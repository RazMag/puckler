"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { crewPassword, endSession, startSession } from "./session";
import { passwordMatches } from "./token";

export type LoginState = { error: string | null };

const WINDOW_MS = 60_000;
const MAX_FAILURES = 5;
const failures = new Map<string, number[]>();

function recentFailures(key: string, now: number): number[] {
  const recent = (failures.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  failures.set(key, recent);
  return recent;
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const expected = crewPassword();
  if (!expected) return { error: "Editing isn't set up on this server (CREW_PASSWORD / SESSION_SECRET)." };

  const key = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const recent = recentFailures(key, now);
  if (recent.length >= MAX_FAILURES) {
    return { error: "Two minutes for delay of game — too many tries. Wait a minute." };
  }

  const candidate = formData.get("password");
  if (typeof candidate !== "string" || !passwordMatches(candidate, expected)) {
    recent.push(now);
    return { error: "No goal. That's not the crew password." };
  }

  failures.delete(key);
  await startSession();
  refresh();
  return { error: null };
}

export async function logout(): Promise<void> {
  await endSession();
  refresh();
}
