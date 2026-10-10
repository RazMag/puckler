import { describe, expect, it } from "vitest";
import injuriesJson from "@/lib/espn/__fixtures__/injuries.json";
import boxJson from "@/lib/nhl/__fixtures__/boxscore-2026020065.json";
import statsJson from "@/lib/nhl/__fixtures__/club-stats-TOR.json";
import rosterJson from "@/lib/nhl/__fixtures__/roster-TOR.json";
import { firstSentence, injuriesResponseSchema, normalizeInjuries } from "@/lib/espn/injuries";
import { normalizeBoxscore, normalizeRoster, normalizeTeamStats } from "@/lib/nhl/normalize";
import { boxscoreResponseSchema, clubStatsResponseSchema, rosterResponseSchema } from "@/lib/nhl/schemas";

const stats = normalizeTeamStats(clubStatsResponseSchema.parse(statsJson));
const roster = normalizeRoster(rosterResponseSchema.parse(rosterJson));
const box = normalizeBoxscore(boxscoreResponseSchema.parse(boxJson));
const injuries = normalizeInjuries(injuriesResponseSchema.parse(injuriesJson));

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
});
