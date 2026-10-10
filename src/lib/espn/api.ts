import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { normalizeInjuries, injuriesResponseSchema, type Injury } from "./injuries";

const INJURIES_URL = "https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/injuries";

/** Every injured or suspended NHL player. */
export async function getInjuries(): Promise<Injury[]> {
  "use cache";
  // The feed is about 1 MB for the whole league and injury news moves slower than scores.
  cacheLife({ stale: 300, revalidate: 900, expire: 86_400 });
  cacheTag("espn:injuries");

  let res: Response;
  try {
    res = await fetch(INJURIES_URL, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(10_000) });
  } catch (cause) {
    throw new Error(`ESPN injuries unreachable: ${String(cause)}`);
  }
  if (!res.ok) throw new Error(`ESPN injuries responded ${res.status}`);

  const parsed = injuriesResponseSchema.safeParse(await res.json());
  if (!parsed.success) throw new Error(`ESPN injuries changed shape: ${parsed.error.message}`);
  return normalizeInjuries(parsed.data);
}
