import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { nhlFetch } from "./client";
import { normalizeSchedule, normalizeStandings } from "./normalize";
import { clubScheduleResponseSchema, standingsResponseSchema } from "./schemas";
import type { Game, Standings } from "./types";

/** League standings, refreshed about once a minute. */
export async function getStandings(): Promise<Standings> {
  "use cache";
  cacheLife("minutes");
  cacheTag("nhl:standings");
  return normalizeStandings(await nhlFetch("/standings/now", standingsResponseSchema));
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
