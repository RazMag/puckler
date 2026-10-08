import "server-only";
import { connection } from "next/server";
import { readCrew } from "@/lib/crew/store";
import { getSchedules, getStandings } from "@/lib/nhl/api";

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
