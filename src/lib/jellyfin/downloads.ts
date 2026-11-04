import { z } from "zod";
import { ALL_TEAMS } from "@/lib/nhl/teams";
import type { Game } from "@/lib/nhl/types";

/**
 * Full games Sportarr downloaded into Jellyfin. Sportarr files each game as an
 * episode of one series ("NHL") named "Home Team vs Away Team (YYYY-MM-DD)",
 * dated by TheSportsDB's UTC day, and keeps it for a couple of days. Nothing
 * carries the NHL's game id, so games are matched on both teams and the day.
 */

const itemSchema = z.object({
  Id: z.string(),
  ServerId: z.string(),
  Name: z.string(),
  SeriesName: z.string().optional(),
  PremiereDate: z.string().optional(),
});

export const itemsResponseSchema = z.object({ Items: z.array(z.unknown()) });

export type ItemsResponse = z.infer<typeof itemsResponseSchema>;

export type Download = {
  home: string;
  away: string;
  /** UTC calendar day (YYYY-MM-DD) Sportarr files the game under. */
  date: string;
  /** The episode's page in Jellyfin's web app. */
  url: string;
};

/** "Montréal Canadiens" and "Montreal Canadiens", "St. Louis" and "St Louis", are the same team. */
function nameKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[^A-Za-z0-9]/g, "")
    .toLowerCase();
}

const BY_NAME = new Map(ALL_TEAMS.map((t) => [nameKey(t.name), t.abbrev]));

const MATCHUP = /^(.+?) vs\.? (.+?)(?: \(\d{4}-\d{2}-\d{2}\))?$/;

export function normalizeDownloads(
  raw: ItemsResponse,
  { publicUrl, series }: { publicUrl: string; series: string },
): Download[] {
  const base = publicUrl.replace(/\/+$/, "");
  return raw.Items.flatMap((entry) => {
    const parsed = itemSchema.safeParse(entry);
    if (!parsed.success || parsed.data.SeriesName !== series || !parsed.data.PremiereDate) return [];
    const { Id, ServerId, Name, PremiereDate } = parsed.data;
    const [, homeName, awayName] = MATCHUP.exec(Name) ?? [];
    const home = homeName && BY_NAME.get(nameKey(homeName));
    const away = awayName && BY_NAME.get(nameKey(awayName));
    if (!home || !away) return [];
    return [
      {
        home,
        away,
        date: PremiereDate.slice(0, 10),
        url: `${base}/web/#/details?id=${encodeURIComponent(Id)}&serverId=${encodeURIComponent(ServerId)}`,
      },
    ];
  });
}

const DAY_MS = 86_400_000;

/**
 * The download of `game`: same home and away teams, filed within a day of the
 * puck drop's UTC date (TheSportsDB and the NHL don't always agree on the day).
 */
export function downloadFor(
  game: Pick<Game, "home" | "away" | "startTimeUTC">,
  downloads: readonly Download[],
): Download | undefined {
  const day = Date.parse(game.startTimeUTC.slice(0, 10));
  return downloads.find(
    (d) => d.home === game.home.abbrev && d.away === game.away.abbrev && Math.abs(Date.parse(d.date) - day) <= DAY_MS,
  );
}

/** `games` with a link to the full game wherever Sportarr has one. */
export function withDownloads(games: readonly Game[], downloads: readonly Download[]): Game[] {
  if (downloads.length === 0) return [...games];
  return games.map((game) => {
    const download = downloadFor(game, downloads);
    return download ? { ...game, links: { ...game.links, fullGame: download.url } } : game;
  });
}
