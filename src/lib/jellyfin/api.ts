import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { itemsResponseSchema, normalizeDownloads, type Download } from "./downloads";

// Sportarr keeps games for a couple of days; a week back is plenty and keeps the reply small.
const LOOKBACK_MS = 7 * 86_400_000;

/**
 * Full games waiting in Jellyfin. Optional: without JELLYFIN_URL and
 * JELLYFIN_API_KEY, or while Jellyfin is unreachable, there are none and every
 * view falls back to nhl.com's highlights.
 */
export async function getDownloads(): Promise<Download[]> {
  "use cache";
  cacheTag("jellyfin:downloads");

  const url = process.env.JELLYFIN_URL?.replace(/\/+$/, "");
  const key = process.env.JELLYFIN_API_KEY;
  if (!url || !key) {
    cacheLife("max");
    return [];
  }

  try {
    const downloads = await fetchDownloads(url, key);
    // New games land a few hours after the final horn; a couple of minutes' lag is fine.
    cacheLife({ stale: 60, revalidate: 120, expire: 3600 });
    return downloads;
  } catch (error) {
    // Every page shows games, so a Jellyfin outage mustn't slow them down: retry in the background.
    console.error(error);
    cacheLife({ stale: 60, revalidate: 60, expire: 600 });
    return [];
  }
}

async function fetchDownloads(url: string, key: string): Promise<Download[]> {
  const query = new URLSearchParams({
    Recursive: "true",
    IncludeItemTypes: "Episode",
    MinPremiereDate: new Date(Date.now() - LOOKBACK_MS).toISOString(),
    Fields: "PremiereDate",
    EnableImages: "false",
    EnableUserData: "false",
  });
  let res: Response;
  try {
    res = await fetch(`${url}/Items?${query}`, {
      headers: { accept: "application/json", authorization: `MediaBrowser Token="${key}"` },
      signal: AbortSignal.timeout(5_000),
    });
  } catch (cause) {
    throw new Error(`Jellyfin unreachable: ${String(cause)}`);
  }
  if (!res.ok) throw new Error(`Jellyfin responded ${res.status}`);

  const parsed = itemsResponseSchema.safeParse(await res.json());
  if (!parsed.success) throw new Error(`Jellyfin changed shape: ${parsed.error.message}`);
  return normalizeDownloads(parsed.data, {
    publicUrl: process.env.JELLYFIN_PUBLIC_URL || url,
    series: process.env.JELLYFIN_SERIES || "NHL",
  });
}
