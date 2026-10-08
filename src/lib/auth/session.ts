import "server-only";
import { cookies, headers } from "next/headers";
import { connection } from "next/server";
import { createToken, verifyToken } from "./token";

const COOKIE = "puckler_editor";
const SESSION_DAYS = 30;

function authConfig(): { password: string; secret: string } | null {
  const password = process.env.CREW_PASSWORD;
  const secret = process.env.SESSION_SECRET;
  if (!password || !secret) return null;
  return { password, secret };
}

export function editingConfigured(): boolean {
  return authConfig() !== null;
}

export function crewPassword(): string | null {
  return authConfig()?.password ?? null;
}

export async function isEditor(): Promise<boolean> {
  const config = authConfig();
  if (!config) return false;
  const token = (await cookies()).get(COOKIE)?.value;
  // Expiry is checked against the clock, so this must run per request.
  await connection();
  return verifyToken(token, config.secret, Date.now());
}

export class NotEditorError extends Error {
  constructor() {
    super("Locker room is locked — enter the crew password first.");
  }
}

/** Guard for every mutating Server Action; the UI gate alone is not protection. */
export async function requireEditor(): Promise<void> {
  if (!(await isEditor())) throw new NotEditorError();
}

export async function startSession(): Promise<void> {
  const config = authConfig();
  if (!config) throw new Error("Editing is not configured.");
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  // Mark the cookie Secure whenever the browser reached us over HTTPS (directly or via a
  // TLS-terminating proxy), but still allow plain-HTTP LAN access to work.
  const origin = (await headers()).get("origin");
  (await cookies()).set(COOKIE, createToken(config.secret, Date.now() + maxAge * 1000), {
    httpOnly: true,
    sameSite: "lax",
    secure: origin?.startsWith("https://") ?? false,
    path: "/",
    maxAge,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
