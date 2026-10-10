import "server-only";
import { connection } from "next/server";
import { readCrew } from "@/lib/crew/store";
import { recentFinals } from "@/lib/domain/faceoffs";
import { RECENT_GAMES, type TeamPlayers } from "@/lib/domain/players";
import { getInjuries } from "@/lib/espn/api";
import { getBoxScore, getRoster, getSchedules, getStandings, getTeamSchedule, getTeamStats } from "@/lib/nhl/api";

/**
 * Crew picks change whenever someone edits them, so every view reads them at
 * request time; NHL data underneath is cached for a minute.
 */
export async function loadBoard() {
  await connection();
  const [crew, standings] = await Promise.all([readCrew(), getStandings()]);
  return { crew, standings };
}

export async function loadFaceoffs() {
  await connection();
  const crew = await readCrew();
  const schedules = await getSchedules(crew.map((m) => m.team));
  return { crew, schedules };
}

export async function loadPlayers() {
  await connection();
  const crew = await readCrew();
  const teams = [...new Set(crew.map((m) => m.team))];
  const [players, injuries] = await Promise.all([
    Promise.all(teams.map(loadTeamPlayers)),
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

async function loadTeamPlayers(team: string): Promise<TeamPlayers> {
  const [stats, roster, schedule] = await Promise.all([getTeamStats(team), getRoster(team), getTeamSchedule(team)]);
  const boxScores = await Promise.all(recentFinals(schedule, RECENT_GAMES).map((game) => getBoxScore(game.id)));
  return { stats, roster, boxScores };
}
