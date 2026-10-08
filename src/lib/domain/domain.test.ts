import { describe, expect, it } from "vitest";
import standingsJson from "@/lib/nhl/__fixtures__/standings.json";
import torJson from "@/lib/nhl/__fixtures__/schedule-TOR.json";
import mtlJson from "@/lib/nhl/__fixtures__/schedule-MTL.json";
import { normalizeSchedule, normalizeStandings } from "@/lib/nhl/normalize";
import { clubScheduleResponseSchema, standingsResponseSchema } from "@/lib/nhl/schemas";
import type { CrewMember } from "@/lib/crew/types";
import type { Game } from "@/lib/nhl/types";
import { initials, rankCrew } from "./crew-standings";
import { conferenceTables, playoffStatus } from "./division";
import { benchReports, resultFor, rivalries } from "./faceoffs";

const { teams } = normalizeStandings(standingsResponseSchema.parse(standingsJson));
const schedules = new Map([
  ["TOR", normalizeSchedule(clubScheduleResponseSchema.parse(torJson))],
  ["MTL", normalizeSchedule(clubScheduleResponseSchema.parse(mtlJson))],
]);

const crew: CrewMember[] = [
  { id: "1", name: "Raz", team: "TOR" },
  { id: "2", name: "Dana Cohen", team: "MTL" },
  { id: "3", name: "Noa", team: "NYR" },
];

describe("standings fixture", () => {
  it("parses all 32 teams in league order", () => {
    expect(teams).toHaveLength(32);
    expect(teams.map((t) => t.leagueRank)).toEqual([...teams.map((t) => t.leagueRank)].sort((a, b) => a - b));
  });
});

describe("rankCrew", () => {
  const rows = rankCrew(crew, teams);

  it("orders members by their team's league rank", () => {
    expect(rows.map((r) => r.member.team)).toEqual(["NYR", "TOR", "MTL"]);
    expect(rows.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it("measures the gap to the leader", () => {
    expect(rows[0]?.pointsBehindLeader).toBe(0);
    expect(rows[1]?.pointsBehindLeader).toBe(rows[0]!.team.points - rows[1]!.team.points);
  });

  it("skips members whose team is missing from standings", () => {
    expect(rankCrew([{ id: "x", name: "Ghost", team: "XXX" }], teams)).toEqual([]);
  });
});

describe("initials", () => {
  it("uses first and last name, or first two letters", () => {
    expect(initials("Dana Cohen")).toBe("DC");
    expect(initials("raz")).toBe("RA");
  });
});

describe("playoff status", () => {
  const team = (abbrev: string) => teams.find((t) => t.abbrev === abbrev)!;

  it("classifies division, wild card and out", () => {
    expect(playoffStatus(team("NYR"), teams)).toEqual({ kind: "division", spot: 1 });
    expect(playoffStatus(team("BUF"), teams)).toEqual({ kind: "wildcard", spot: 1 });
    const tor = playoffStatus(team("TOR"), teams);
    expect(tor.kind).toBe("out");
  });

  it("groups conferences with a wild card race and cut line", () => {
    const [east, west] = conferenceTables(teams);
    expect(east?.name).toBe("Eastern");
    expect(west?.name).toBe("Western");
    expect(east?.divisions.map((d) => d.name)).toEqual(["Atlantic", "Metropolitan"]);
    expect(east?.divisions.every((d) => d.teams.length === 8)).toBe(true);
    expect(east?.wildCardRace[0]?.wildcardRank).toBe(1);
    expect(east?.cutLinePoints).toBe(team("PIT").points);
  });
});

describe("faceoffs", () => {
  it("scores results from either side", () => {
    const game: Game = {
      id: 1,
      gameType: 2,
      startTimeUTC: "",
      phase: "final",
      venue: null,
      period: null,
      home: { abbrev: "TOR", score: 2 },
      away: { abbrev: "MTL", score: 3 },
      periodType: "OT",
    };
    expect(resultFor(game, "MTL")).toBe("W");
    expect(resultFor(game, "TOR")).toBe("OTL");
    expect(resultFor({ ...game, periodType: "REG" }, "TOR")).toBe("L");
    expect(resultFor({ ...game, phase: "upcoming" }, "TOR")).toBeNull();
  });

  it("finds regular-season meetings between crew teams once per game", () => {
    const torMtl = rivalries(crew, schedules).find((r) => r.a.team === "MTL" && r.b.team === "TOR");
    expect(torMtl?.a.team).toBe("MTL");
    expect(torMtl?.b.team).toBe("TOR");
    expect(torMtl?.games.length).toBeGreaterThan(0);
    expect(new Set(torMtl?.games.map((g) => g.id)).size).toBe(torMtl?.games.length);
    expect(torMtl?.games.every((g) => g.gameType === 2)).toBe(true);
  });

  it("builds bench reports with newest results first", () => {
    const [tor] = benchReports(crew, schedules);
    expect(tor?.recent.length).toBeGreaterThan(0);
    const times = tor!.recent.map((g) => g.startTimeUTC);
    expect(times).toEqual([...times].sort().reverse());
    expect(tor?.upcoming).toHaveLength(3);
  });
});

describe("format", async () => {
  const { ordinal, signed, pct } = await import("@/lib/format");
  it("formats ordinals, differentials and percentages", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 101, 111].map(ordinal)).toEqual([
      "1st",
      "2nd",
      "3rd",
      "4th",
      "11th",
      "12th",
      "13th",
      "21st",
      "22nd",
      "101st",
      "111th",
    ]);
    expect(signed(3)).toBe("+3");
    expect(signed(-2)).toBe("−2");
    expect(pct(0.8)).toBe(".800");
  });
});
