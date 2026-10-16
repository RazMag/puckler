import "server-only";
import { connection } from "next/server";
import { readCrew } from "@/lib/crew/store";
import { recentFinals } from "@/lib/domain/faceoffs";
import { RECENT_GAMES, type TeamPlayers } from "@/lib/domain/players";
import { getInjuries } from "@/lib/espn/api";
import {
  getBoxScore,
  getLeagueWeek,
  getRoster,
  getSchedules,
  getStandings,
  getStandingsOn,
  getTeamSchedule,
  getTeamStats,
} from "@/lib/nhl/api";
import type { Standings } from "@/lib/nhl/types";
import { readShield } from "@/lib/spoilers/session";
import { applyShield, openingNight, rewindStats, standingsThrough, type Shield } from "@/lib/spoilers/shield";

/**
 * Crew picks change whenever someone edits them, so every view reads them at
 * request time; NHL data underneath is cached for a minute. Every loader also
 * applies the viewer's spoiler shield.
 */
export async function loadBoard() {
  await connection();
  const shield = await readShield();
  const [crew, { standings, through }] = await Promise.all([readCrew(), shieldedStandings(shield)]);
  return { crew, standings, through };
}

/**
 * Live standings, or the standings at the end of the last day with nothing
 * hidden (`through`) while the shield is covering any game in the league.
 */
async function shieldedStandings(shield: Shield): Promise<{ standings: Standings; through: string | null }> {
  // The week from yesterday reaches today, so it holds every game the shield can cover.
  const through = standingsThrough(await getLeagueWeek(shield.since), shield);
  if (through === null) return { standings: await getStandings(), through };

  const past = await getStandingsOn(through);
  if (past.teams.length > 0) return { standings: past, through };
  // No standings before opening night: everyone starts from zero.
  return { standings: { updatedAt: null, teams: openingNight((await getStandings()).teams) }, through };
}

export async function loadFaceoffs() {
  await connection();
  const crew = await readCrew();
  return { crew, schedules: await loadSchedules(crew.map((m) => m.team)) };
}

/** Club schedules for `teams`, with the viewer's spoiler shield applied. */
export async function loadSchedules(teams: readonly string[]) {
  await connection();
  const [shield, schedules] = await Promise.all([readShield(), getSchedules(teams)]);
  return new Map([...schedules].map(([team, games]) => [team, applyShield(games, shield)]));
}

export async function loadPlayers() {
  await connection();
  const [crew, shield] = await Promise.all([readCrew(), readShield()]);
  const teams = [...new Set(crew.map((m) => m.team))];
  const [players, injuries] = await Promise.all([
    Promise.all(teams.map((team) => loadTeamPlayers(team, shield))),
    // Injuries come from a second source; the rest of the page still works without them.
    getInjuries().catch((error: unknown) => {
      console.error(error);
      return null;
    }),
  ]);
  return {
    crew,
    players: new Map(teams.map((team, i) => [team, players[i]!])),
    injuries,
    today: new Date().toISOString().slice(0, 10),
  };
}

async function loadTeamPlayers(team: string, shield: Shield): Promise<TeamPlayers> {
  const [stats, roster, schedule] = await Promise.all([getTeamStats(team), getRoster(team), getTeamSchedule(team)]);
  const games = applyShield(schedule, shield);
  // Recent form only counts games the viewer has seen; hidden finals come back out of the season totals.
  const [boxScores, hiddenBoxScores] = await Promise.all([
    Promise.all(
      recentFinals(
        games.filter((g) => !g.hidden),
        RECENT_GAMES,
      ).map((game) => getBoxScore(game.id)),
    ),
    Promise.all(games.filter((g) => g.hidden && g.phase === "final").map((game) => getBoxScore(game.id))),
  ]);
  return {
    stats: rewindStats(stats, team, hiddenBoxScores),
    roster,
    boxScores,
    hiddenGames: hiddenBoxScores.length,
  };
}
