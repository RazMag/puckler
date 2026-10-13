import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { nhlFetch } from "./client";
import {
  normalizeBoxscore,
  normalizeLeagueSchedule,
  normalizeRoster,
  normalizeSchedule,
  normalizeStandings,
  normalizeTeamStats,
} from "./normalize";
import {
  boxscoreResponseSchema,
  clubScheduleResponseSchema,
  clubStatsResponseSchema,
  leagueScheduleResponseSchema,
  rosterResponseSchema,
  standingsResponseSchema,
} from "./schemas";
import type { BoxScore, Game, LeagueGame, RosterPlayer, Standings, TeamStats } from "./types";

/** League standings, refreshed about once a minute. */
export async function getStandings(): Promise<Standings> {
  "use cache";
  cacheLife("minutes");
  cacheTag("nhl:standings");
  return normalizeStandings(await nhlFetch("/standings/now", standingsResponseSchema));
}

/**
 * League standings at the end of an Eastern-time day (YYYY-MM-DD), for the
 * spoiler shield. Past days don't change. Empty before opening night.
 */
export async function getStandingsOn(date: string): Promise<Standings> {
  "use cache";
  cacheLife("hours");
  cacheTag(`nhl:standings:${date}`);
  return normalizeStandings(await nhlFetch(`/standings/${encodeURIComponent(date)}`, standingsResponseSchema));
}

/** Every league game in the week starting on `date` (YYYY-MM-DD), with live state. */
export async function getLeagueWeek(date: string): Promise<LeagueGame[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`nhl:league-week:${date}`);
  return normalizeLeagueSchedule(await nhlFetch(`/schedule/${encodeURIComponent(date)}`, leagueScheduleResponseSchema));
}

/** One club's current-season schedule including scores of played games. */
export async function getTeamSchedule(abbrev: string): Promise<Game[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`nhl:schedule:${abbrev}`);
  return normalizeSchedule(
    await nhlFetch(`/club-schedule-season/${encodeURIComponent(abbrev)}/now`, clubScheduleResponseSchema),
  );
}

/** Schedules for several clubs, fetched in parallel. */
export async function getSchedules(abbrevs: readonly string[]): Promise<Map<string, Game[]>> {
  const unique = [...new Set(abbrevs)];
  const schedules = await Promise.all(unique.map(getTeamSchedule));
  return new Map(unique.map((abbrev, i) => [abbrev, schedules[i] ?? []]));
}

/** Season totals for every skater and goalie who has played for the club. */
export async function getTeamStats(abbrev: string): Promise<TeamStats> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`nhl:stats:${abbrev}`);
  return normalizeTeamStats(await nhlFetch(`/club-stats/${encodeURIComponent(abbrev)}/now`, clubStatsResponseSchema));
}

/** The club's current roster, for sweater numbers. Changes with call-ups and trades. */
export async function getRoster(abbrev: string): Promise<RosterPlayer[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(`nhl:roster:${abbrev}`);
  return normalizeRoster(await nhlFetch(`/roster/${encodeURIComponent(abbrev)}/current`, rosterResponseSchema));
}

/** Player scoring from a game. Only fetched once a game is final; hours covers late stat corrections. */
export async function getBoxScore(gameId: number): Promise<BoxScore> {
  "use cache";
  cacheLife("hours");
  cacheTag(`nhl:boxscore:${gameId}`);
  return normalizeBoxscore(await nhlFetch(`/gamecenter/${gameId}/boxscore`, boxscoreResponseSchema));
}
