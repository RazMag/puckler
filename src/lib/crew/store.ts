import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { crewFileSchema, type CrewMember } from "./types";

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const CREW_FILE = path.join(DATA_DIR, "crew.json");

export class CrewConflictError extends Error {}

export async function readCrew(): Promise<CrewMember[]> {
  let text: string;
  try {
    text = await readFile(CREW_FILE, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
  return crewFileSchema.parse(JSON.parse(text)).members;
}

async function writeCrew(members: CrewMember[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = `${CREW_FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify({ version: 1, members }, null, 2));
  await rename(tmp, CREW_FILE);
}

// Serialize read-modify-write cycles so two quick edits can't clobber each other.
let queue: Promise<unknown> = Promise.resolve();

function mutate<T>(fn: (members: CrewMember[]) => { members: CrewMember[]; result: T }): Promise<T> {
  const run = queue.then(async () => {
    const { members, result } = fn(await readCrew());
    await writeCrew(members);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

function assertTeamFree(members: CrewMember[], team: string, exceptId?: string) {
  const owner = members.find((m) => m.team === team && m.id !== exceptId);
  if (owner) throw new CrewConflictError(`${owner.name} already drafted ${team}.`);
}

export function addMember(name: string, team: string): Promise<CrewMember> {
  return mutate((members) => {
    assertTeamFree(members, team);
    const member = { id: randomUUID(), name, team };
    return { members: [...members, member], result: member };
  });
}

export function updateMember(id: string, name: string, team: string): Promise<void> {
  return mutate((members) => {
    if (!members.some((m) => m.id === id)) throw new CrewConflictError("That player left the bench.");
    assertTeamFree(members, team, id);
    return { members: members.map((m) => (m.id === id ? { ...m, name, team } : m)), result: undefined };
  });
}

export function removeMember(id: string): Promise<void> {
  return mutate((members) => ({ members: members.filter((m) => m.id !== id), result: undefined }));
}
