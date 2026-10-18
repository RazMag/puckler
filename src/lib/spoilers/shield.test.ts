import { describe, expect, it } from "vitest";
import boxJson from "@/lib/nhl/__fixtures__/boxscore-2026020065.json";
import statsJson from "@/lib/nhl/__fixtures__/club-stats-TOR.json";
import standingsJson from "@/lib/nhl/__fixtures__/standings.json";
import torJson from "@/lib/nhl/__fixtures__/schedule-TOR.json";
import { normalizeBoxscore, normalizeSchedule, normalizeStandings, normalizeTeamStats } from "@/lib/nhl/normalize";
import {
  boxscoreResponseSchema,
  clubScheduleResponseSchema,
  clubStatsResponseSchema,
  standingsResponseSchema,
} from "@/lib/nhl/schemas";
import type { Game, LeagueGame } from "@/lib/nhl/types";
import {
  addDays,
  applyShield,
  easternDate,
  isHidden,
  openingNight,
  rewindStats,
  shieldFor,
  spoilersOffAt,
  spoilersOn,
  standingsThrough,
} from "./shield";

// Tuesday 13 Oct, 19:00 in Israel: the crew is about to watch Monday night's games.
const NOW = new Date("2026-10-13T16:00:00Z");

function game(overrides: Partial<Game>): Game {
  return {
    id: 1,
    gameType: 2,
    gameDate: "2026-10-12",
    startTimeUTC: "2026-10-12T23:00:00Z",
    phase: "final",
    venue: null,
    away: { abbrev: "MTL", score: 3 },
    home: { abbrev: "TOR", score: 2 },
    periodType: "OT",
    period: null,
    links: { recap: "https://www.nhl.com/video/recap", condensed: null, gameCenter: null },
    hidden: false,
    ...overrides,
  };
}

describe("eastern dates", () => {
  it("files a late puck drop under the day it started in New York", () => {
    expect(easternDate(new Date("2026-10-09T02:00:00Z"))).toBe("2026-10-08");
  });

  it("steps across month ends", () => {
    expect(addDays("2026-11-01", -1)).toBe("2026-10-31");
  });
});

describe("shieldFor", () => {
  it("starts at yesterday's slate with spoilers off", () => {
    const shield = shieldFor(NOW, undefined);
    expect(shield).toEqual({ since: "2026-10-12", caughtUpAt: null });
    expect(spoilersOn(shield, [])).toBe(false);
  });

  it("keeps a catch-up from last night or today", () => {
    expect(spoilersOn(shieldFor(NOW, "2026-10-13T15:00:00.000Z"), [])).toBe(true);
    expect(spoilersOn(shieldFor(NOW, "2026-10-12T20:00:00.000Z"), [])).toBe(true);
  });

  it("lets a catch-up from before last night's slate lapse", () => {
    expect(spoilersOn(shieldFor(NOW, "2026-10-11T20:00:00.000Z"), [])).toBe(false);
  });

  it("ignores junk and future timestamps", () => {
    expect(spoilersOn(shieldFor(NOW, "nonsense"), [])).toBe(false);
    expect(spoilersOn(shieldFor(NOW, "2026-10-14T00:00:00.000Z"), [])).toBe(false);
  });
});

describe("isHidden", () => {
  const off = shieldFor(NOW, null);
  const caughtUp = shieldFor(NOW, "2026-10-13T15:00:00.000Z");

  it("hides last night's results while the shield is up", () => {
    expect(isHidden(game({}), off)).toBe(true);
    expect(isHidden(game({ phase: "live" }), off)).toBe(true);
  });

  it("shows older results and games that haven't started", () => {
    expect(isHidden(game({ gameDate: "2026-10-11", startTimeUTC: "2026-10-11T23:00:00Z" }), off)).toBe(false);
    expect(isHidden(game({ phase: "upcoming", gameDate: "2026-10-13" }), off)).toBe(false);
  });

  it("shows what started before the catch-up and hides what started after", () => {
    expect(isHidden(game({}), caughtUp)).toBe(false);
    expect(
      isHidden(game({ gameDate: "2026-10-13", startTimeUTC: "2026-10-13T16:30:00Z", phase: "live" }), caughtUp),
    ).toBe(true);
  });
});

describe("applyShield", () => {
  it("blanks the score and the OT tell but keeps the highlight links", () => {
    const [hidden] = applyShield([game({})], shieldFor(NOW, null));
    expect(hidden).toMatchObject({
      hidden: true,
      away: { score: null },
      home: { score: null },
      periodType: null,
      links: { recap: "https://www.nhl.com/video/recap" },
    });
  });

  it("leaves a real schedule's older games alone", () => {
    const schedule = normalizeSchedule(clubScheduleResponseSchema.parse(torJson));
    const shield = shieldFor(new Date(`${addDays(schedule.at(-1)!.gameDate, 30)}T16:00:00Z`), null);
    expect(applyShield(schedule, shield)).toEqual(schedule);
  });
});

describe("standingsThrough", () => {
  const league = (games: Partial<LeagueGame>[]): LeagueGame[] => games.map((g, i) => ({ ...game({ id: i }), ...g }));

  it("stops the day before the earliest hidden game", () => {
    const through = standingsThrough(
      league([{}, { gameDate: "2026-10-13", startTimeUTC: "2026-10-13T15:00:00Z", phase: "live" }]),
      shieldFor(NOW, null),
    );
    expect(through).toBe("2026-10-11");
  });

  it("uses the live standings once nothing is hidden", () => {
    const games = league([{}, { gameDate: "2026-10-13", startTimeUTC: "2026-10-13T23:00:00Z", phase: "upcoming" }]);
    expect(standingsThrough(games, shieldFor(NOW, "2026-10-13T15:00:00.000Z"))).toBeNull();
  });

  it("ignores preseason games, which don't count in the standings", () => {
    expect(standingsThrough(league([{ gameType: 1 }]), shieldFor(NOW, null))).toBeNull();
  });
});

describe("the spoiler switch", () => {
  const league = (games: Partial<LeagueGame>[]): LeagueGame[] => games.map((g, i) => ({ ...game({ id: i }), ...g }));
  const caughtUp = shieldFor(NOW, "2026-10-13T15:00:00.000Z");
  const tonight = { gameDate: "2026-10-13", startTimeUTC: "2026-10-13T23:00:00Z", phase: "upcoming" as const };

  it("stays on while everything that started is caught up", () => {
    expect(spoilersOn(caughtUp, league([{}, tonight]))).toBe(true);
  });

  it("flips back off once a game starts after the catch-up", () => {
    expect(spoilersOn(caughtUp, league([{}, { ...tonight, phase: "live" }]))).toBe(false);
  });

  it("is due off at the next puck drop", () => {
    const games = league([{}, tonight, { ...tonight, startTimeUTC: "2026-10-14T01:30:00Z" }]);
    expect(spoilersOffAt(caughtUp, games, NOW)).toBe("2026-10-13T23:00:00.000Z");
  });

  it("looks again in a minute at a game past its start time that hasn't begun", () => {
    const late = league([{ ...tonight, startTimeUTC: "2026-10-13T15:30:00Z" }]);
    expect(spoilersOffAt(caughtUp, late, NOW)).toBe("2026-10-13T16:01:00.000Z");
  });

  it("has nothing due while spoilers are off or no game is coming", () => {
    expect(spoilersOffAt(shieldFor(NOW, null), league([tonight]), NOW)).toBeNull();
    expect(spoilersOffAt(caughtUp, league([{}]), NOW)).toBeNull();
  });
});

describe("openingNight", () => {
  const { teams } = normalizeStandings(standingsResponseSchema.parse(standingsJson));
  const zeroed = openingNight(teams);

  it("puts every team at zero", () => {
    expect(zeroed).toHaveLength(32);
    expect(zeroed.every((t) => t.points === 0 && t.gamesPlayed === 0 && t.streak === null)).toBe(true);
  });

  it("still fills three division spots and ranks the rest for the wild card", () => {
    for (const division of new Set(zeroed.map((t) => t.division))) {
      const teams = zeroed.filter((t) => t.division === division);
      expect(teams.filter((t) => t.wildcardRank === 0)).toHaveLength(3);
      expect(teams.map((t) => t.divisionRank).toSorted((a, b) => a - b)).toEqual(teams.map((_, i) => i + 1));
    }
    expect(zeroed.map((t) => t.leagueRank)).toEqual(zeroed.map((_, i) => i + 1));
  });
});

describe("rewindStats", () => {
  const stats = normalizeTeamStats(clubStatsResponseSchema.parse(statsJson));
  const box = normalizeBoxscore(boxscoreResponseSchema.parse(boxJson));
  const rewound = rewindStats(stats, "TOR", [box]);

  it("takes a hidden game's scoring back out of season totals", () => {
    const line = box.skaters.find((l) => l.team === "TOR" && l.points > 0)!;
    const before = stats.skaters.find((s) => s.id === line.playerId)!;
    const after = rewound.skaters.find((s) => s.id === line.playerId)!;
    expect(after.gamesPlayed).toBe(before.gamesPlayed - 1);
    expect(after.points).toBe(before.points - line.points);
    expect(after.plusMinus).toBe(before.plusMinus - line.plusMinus);
  });

  it("rewinds the goalie of record, leaving the backup who never went in", () => {
    const starter = rewound.goalies.find((g) => g.id === 8475683)!;
    expect(starter).toMatchObject({
      gamesPlayed: 2,
      gamesStarted: 2,
      wins: 0,
      losses: 2,
      otLosses: 0,
      goalsAgainst: 6,
    });
    expect(starter.savePct).toBeCloseTo(47 / 53);
    expect(starter.gaa).toBeCloseTo((6 * 3600) / (10955 - 3900));
    expect(rewound.goalies.find((g) => g.id === 8476932)).toEqual(stats.goalies.find((g) => g.id === 8476932));
  });

  it("leaves another team's stats alone", () => {
    expect(rewindStats(stats, "MTL", [box])).toEqual(stats);
  });
});
