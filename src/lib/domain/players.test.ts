import { describe, expect, it } from "vitest";
import boxJson from "@/lib/nhl/__fixtures__/boxscore-2026020065.json";
import statsJson from "@/lib/nhl/__fixtures__/club-stats-TOR.json";
import rosterJson from "@/lib/nhl/__fixtures__/roster-TOR.json";
import { normalizeBoxscore, normalizeRoster, normalizeTeamStats } from "@/lib/nhl/normalize";
import { boxscoreResponseSchema, clubStatsResponseSchema, rosterResponseSchema } from "@/lib/nhl/schemas";

const stats = normalizeTeamStats(clubStatsResponseSchema.parse(statsJson));
const roster = normalizeRoster(rosterResponseSchema.parse(rosterJson));
const box = normalizeBoxscore(boxscoreResponseSchema.parse(boxJson));

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
