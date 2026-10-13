import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { shieldFor, type Shield } from "./shield";

/** When the viewer last flipped spoilers on (ISO). Absent means the shield is fully up. */
export const CAUGHT_UP_COOKIE = "puckler_caught_up";

/** This viewer's spoiler shield for this request. */
export async function readShield(): Promise<Shield> {
  const caughtUpAt = (await cookies()).get(CAUGHT_UP_COOKIE)?.value;
  // Which games are hidden moves with the clock, so this must run per request.
  await connection();
  return shieldFor(new Date(), caughtUpAt);
}
