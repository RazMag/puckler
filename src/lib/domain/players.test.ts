import { describe, expect, it } from "vitest";
import injuriesJson from "@/lib/espn/__fixtures__/injuries.json";
import boxJson from "@/lib/nhl/__fixtures__/boxscore-2026020065.json";
import statsJson from "@/lib/nhl/__fixtures__/club-stats-TOR.json";
import rosterJson from "@/lib/nhl/__fixtures__/roster-TOR.json";
import type { CrewMember } from "@/lib/crew/types";
import { firstSentence, injuriesResponseSchema, normalizeInjuries, type Injury } from "@/lib/espn/injuries";
import { dayLabel, positionLabel, shortName } from "@/lib/format";
import { normalizeBoxscore, normalizeRoster, normalizeTeamStats } from "@/lib/nhl/normalize";
import { boxscoreResponseSchema, clubStatsResponseSchema, rosterResponseSchema } from "@/lib/nhl/schemas";
import type { BoxScore } from "@/lib/nhl/types";
import {
  hasReturnEstimate,
  isHot,
  LEADER_COUNT,
  matchPlayer,
  playerReport,
  recentForm,
  threeStars,
  type TeamPlayers,
} from "./players";

const stats = normalizeTeamStats(clubStatsResponseSchema.parse(statsJson));
const roster = normalizeRoster(rosterResponseSchema.parse(rosterJson));
const box = normalizeBoxscore(boxscoreResponseSchema.parse(boxJson));
const injuries = normalizeInjuries(injuriesResponseSchema.parse(injuriesJson));
const tor: TeamPlayers = { stats, roster, boxScores: [box] };
const raz: CrewMember = { id: "1", name: "Raz", team: "TOR" };

function injury(overrides: Partial<Injury>): Injury {
  return {
    team: "TOR",
    firstName: "Auston",
    lastName: "Matthews",
    position: "C",
    status: "dtd",
    ailment: null,
    returnDate: null,
    note: null,
    updatedAt: "2026-10-01T00:00Z",
    ...overrides,
  };
}

/** A box score where `playerId` (TOR) had the given points; absent when null. */
function game(gameId: number, playerId: number, points: number | null): BoxScore {
  return {
    gameId,
    skaters: points === null ? [] : [{ playerId, team: "TOR", goals: points, assists: 0, points }],
  };
}

describe("NHL player fixtures", () => {
  it("reads season totals for skaters and goalies", () => {
    expect(stats.skaters.length).toBeGreaterThan(10);
    expect(stats.goalies.length).toBeGreaterThan(0);
    for (const s of stats.skaters) expect(s.points).toBe(s.goals + s.assists);
  });

  it("reads sweater numbers off the roster", () => {
    expect(roster.find((p) => p.lastName === "Matthews")?.number).toBe(34);
  });

  it("tags box score lines with each player's team", () => {
    expect(new Set(box.skaters.map((l) => l.team))).toEqual(new Set(["TOR", "VGK"]));
    for (const line of box.skaters) expect(line.points).toBe(line.goals + line.assists);
  });

  it("has no lines before the puck drops", () => {
    const pregame = { ...boxJson, playerByGameStats: undefined };
    expect(normalizeBoxscore(boxscoreResponseSchema.parse(pregame)).skaters).toEqual([]);
  });
});

describe("ESPN injuries", () => {
  it("translates ESPN team abbreviations to the NHL's", () => {
    expect(new Set(injuries.map((i) => i.team))).toEqual(new Set(["TOR", "LAK"]));
  });

  it("maps statuses", () => {
    const status = (last: string) => injuries.find((i) => i.lastName === last)?.status;
    expect(status("Domi")).toBe("ir");
    expect(status("Tavares")).toBe("out");
    expect(status("Ekman-Larsson")).toBe("dtd");
  });

  it("describes the ailment without ESPN's 'Not Specified' filler", () => {
    const ailment = (last: string) => injuries.find((i) => i.lastName === last)?.ailment;
    expect(ailment("Fiala")).toBe("Left Lower Leg (Surgery)");
    expect(ailment("Villeneuve")).toBe("Knee (Surgery)");
    expect(ailment("Turcotte")).toBe("Undisclosed");
  });

  it("skips malformed entries instead of failing the whole report", () => {
    const raw = injuriesResponseSchema.parse({
      injuries: [{ injuries: [{ nonsense: true }, injuriesJson.injuries[0]!.injuries[0]] }],
    });
    expect(normalizeInjuries(raw)).toHaveLength(1);
  });

  describe("notes", () => {
    const entry = injuriesJson.injuries[0]!.injuries[0]!;
    const noteFor = (comments: { shortComment?: string; longComment?: string }, type = "Lower Body") =>
      normalizeInjuries(
        injuriesResponseSchema.parse({
          injuries: [{ injuries: [{ ...entry, ...comments, details: { type, returnDate: "2026-10-13" } }] }],
        }),
      )[0]?.note;

    it("keeps news about the injury", () => {
      expect(noteFor({ shortComment: "Smith (lower body) is week-to-week." })).toBe(
        "Smith (lower body) is week-to-week.",
      );
    });

    it("drops notes that only repeat the status code", () => {
      expect(noteFor({ shortComment: "ir-nr", longComment: "ir-nr" })).toBeNull();
    });

    it("swaps a game recap for the opening line of the long comment", () => {
      const note = noteFor(
        {
          shortComment: "McAvoy logged a goal on three shots and four PIM in Sunday's preseason win.",
          longComment:
            "McAvoy is set to serve a six-game suspension after slashing a St. Louis forward last season. He can return Oct. 13 in San Jose.",
        },
        "Suspension",
      );
      expect(note).toBe("McAvoy is set to serve a six-game suspension after slashing a St. Louis forward last season.");
    });

    it("shows nothing when neither comment is about the injury", () => {
      expect(
        noteFor({ shortComment: "Smith scored twice on Saturday.", longComment: "He also had an assist." }),
      ).toBeNull();
    });
  });

  it("finds the first sentence without stopping at abbreviations", () => {
    expect(firstSentence("Out since Oct. 13 vs. the St. Louis Blues. Back soon.")).toBe(
      "Out since Oct. 13 vs. the St. Louis Blues.",
    );
    expect(firstSentence("J.T. Miller is out. More later.")).toBe("J.T. Miller is out.");
    expect(firstSentence("No end mark")).toBe("No end mark");
  });

  it("only trusts return dates after today", () => {
    expect(hasReturnEstimate(injury({ returnDate: "2026-10-17" }), "2026-10-10")).toBe(true);
    expect(hasReturnEstimate(injury({ returnDate: "2026-10-10" }), "2026-10-10")).toBe(false);
    expect(hasReturnEstimate(injury({ returnDate: null }), "2026-10-10")).toBe(false);
  });
});

describe("recentForm", () => {
  it("lists points per game oldest first, with null for games missed", () => {
    const form = recentForm(7, "TOR", [game(1, 7, 2), game(2, 7, null), game(3, 7, 0), game(4, 7, 1)]);
    expect(form.perGame).toEqual([2, null, 0, 1]);
    expect(form).toMatchObject({ games: 3, goals: 3, points: 3, pointStreak: 1 });
  });

  it("carries a point streak over games the player sat out", () => {
    const form = recentForm(7, "TOR", [game(1, 7, 0), game(2, 7, 1), game(3, 7, null), game(4, 7, 2), game(5, 7, 1)]);
    expect(form.pointStreak).toBe(3);
    expect(isHot(form)).toBe(true);
  });

  it("ignores a same-numbered id on the other team", () => {
    const other: BoxScore = { gameId: 1, skaters: [{ playerId: 7, team: "MTL", goals: 3, assists: 0, points: 3 }] };
    expect(recentForm(7, "TOR", [other]).perGame).toEqual([null]);
  });
});

describe("matchPlayer", () => {
  const people = [
    { id: 1, firstName: "Tim", lastName: "Stützle", number: 18, headshot: "" },
    { id: 2, firstName: "Alexander", lastName: "Nylander", number: 92, headshot: "" },
    { id: 3, firstName: "William", lastName: "Nylander", number: 88, headshot: "" },
    { id: 4, firstName: "Oliver", lastName: "Ekman-Larsson", number: 95, headshot: "" },
  ];

  it("matches names regardless of accents and hyphens", () => {
    expect(matchPlayer(injury({ firstName: "Tim", lastName: "Stutzle" }), people)?.id).toBe(1);
    expect(matchPlayer(injury({ firstName: "Oliver", lastName: "Ekman Larsson" }), people)?.id).toBe(4);
  });

  it("falls back to first initial and last name when that's unambiguous", () => {
    expect(matchPlayer(injury({ firstName: "Alex", lastName: "Nylander" }), people)?.id).toBe(2);
    expect(matchPlayer(injury({ firstName: "Will", lastName: "Nylander" }), people)?.id).toBe(3);
    expect(matchPlayer(injury({ firstName: "Brady", lastName: "Stutzle" }), people)).toBeNull();
  });

  it("gives up rather than guess between two players with the same initial", () => {
    const twins = [...people, { id: 5, firstName: "Andrew", lastName: "Nylander", number: 9, headshot: "" }];
    expect(matchPlayer(injury({ firstName: "Alex", lastName: "Nylander" }), twins)).toBeNull();
  });
});

describe("playerReport", () => {
  const report = playerReport(raz, tor, injuries);

  it("ranks skaters by points, then goals", () => {
    const pts = report.skaters.map((s) => s.points);
    expect(pts).toEqual(pts.toSorted((a, b) => b - a));
    expect(report.skaters[0]?.number).not.toBeNull();
    expect(report.recentGames).toBe(1);
  });

  it("puts the busiest goalie first", () => {
    const starts = report.goalies.map((g) => g.gamesStarted);
    expect(starts).toEqual(starts.toSorted((a, b) => b - a));
  });

  it("keeps only this team's injuries, key players first", () => {
    expect(report.injuries).toHaveLength(injuries.filter((i) => i.team === "TOR").length);
    const keys = report.injuries!.map((i) => i.keyPlayer);
    expect(keys).toEqual(keys.toSorted((a, b) => Number(b) - Number(a)));
  });

  it("flags an injured top scorer as a key player and marks them in the scoring list", () => {
    const tavares = report.injuries!.find((i) => i.lastName === "Tavares")!;
    const rank = report.skaters.findIndex((s) => s.lastName === "Tavares");
    expect(tavares.playerId).toBe(8475166);
    expect(tavares.keyPlayer).toBe(rank < LEADER_COUNT);
    expect(report.skaters[rank]?.injury?.status).toBe("out");
  });

  it("still lists injured players it can't find on the team", () => {
    const merzlikins = report.injuries!.find((i) => i.lastName === "Merzlikins")!;
    expect(merzlikins).toMatchObject({ playerId: null, headshot: null, keyPlayer: false });
  });

  it("reports a missing injury feed as unknown, not as healthy", () => {
    expect(playerReport(raz, tor, null).injuries).toBeNull();
    expect(playerReport(raz, tor, []).injuries).toEqual([]);
  });
});

describe("threeStars", () => {
  const sharing: CrewMember = { id: "2", name: "Dana", team: "TOR" };
  const reports = [playerReport(raz, tor, null), playerReport(sharing, tor, null)];
  const stars = threeStars(reports);

  it("picks the top recent scorers, each player once", () => {
    expect(stars.length).toBeLessThanOrEqual(3);
    expect(new Set(stars.map((s) => s.skater.id)).size).toBe(stars.length);
    const pts = stars.map((s) => s.skater.recent.points);
    expect(pts).toEqual(pts.toSorted((a, b) => b - a));
    for (const s of stars) expect(s.skater.recent.points).toBeGreaterThan(0);
  });

  it("is empty when nobody has scored", () => {
    expect(threeStars([playerReport(raz, { ...tor, boxScores: [] }, null)])).toEqual([]);
  });
});

describe("player formatting", () => {
  it("formats names, positions and days", () => {
    expect(shortName("Auston", "Matthews")).toBe("A. Matthews");
    expect(positionLabel("L")).toBe("LW");
    expect(positionLabel("D")).toBe("D");
    expect(dayLabel("2026-10-17")).toBe("Oct 17");
  });
});
