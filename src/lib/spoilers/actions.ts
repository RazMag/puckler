"use server";

import { refresh } from "next/cache";
import { cookies, headers } from "next/headers";
import { CAUGHT_UP_COOKIE } from "./session";

/** A catch-up lapses on its own after last night's slate; the cookie just doesn't need to outlive it. */
const MAX_AGE = 3 * 24 * 60 * 60;

/** On: "I'm caught up", reveal everything that has started so far. Off: hide last night's games again. */
export async function setSpoilers(on: boolean): Promise<void> {
  const jar = await cookies();
  if (on === true) {
    const origin = (await headers()).get("origin");
    jar.set(CAUGHT_UP_COOKIE, new Date().toISOString(), {
      httpOnly: true,
      sameSite: "lax",
      secure: origin?.startsWith("https://") ?? false,
      path: "/",
      maxAge: MAX_AGE,
    });
  } else {
    jar.delete(CAUGHT_UP_COOKIE);
  }
  refresh();
}
