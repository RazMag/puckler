import type { Game } from "./types";

export type Highlight = {
  kind: "fullGame" | "recap" | "condensed" | "gameCenter";
  /** Short button text. */
  label: string;
  /** What the link opens, for tooltips and screen readers. */
  description: string;
  /** Where it opens. */
  site: "Jellyfin" | "nhl.com";
  url: string;
};

const ORDER = [
  { kind: "fullGame", label: "Full game", description: "the whole broadcast", site: "Jellyfin" },
  { kind: "recap", label: "Recap", description: "3-minute highlights", site: "nhl.com" },
  { kind: "condensed", label: "Condensed", description: "the whole game in about 10 minutes", site: "nhl.com" },
  { kind: "gameCenter", label: "Game center", description: "box score, goal clips and stats", site: "nhl.com" },
] as const;

/**
 * Video and recap links for a finished game, best first. The full game is
 * there when Sportarr has downloaded it. The NHL posts the recap and condensed
 * game a few hours after the final horn; the game center page always exists
 * and carries per-goal clips in the meantime.
 */
export function highlightsFor(game: Game): Highlight[] {
  if (game.phase !== "final") return [];
  return ORDER.flatMap(({ kind, label, description, site }) => {
    const url = game.links[kind];
    return url ? [{ kind, label, description, site, url }] : [];
  });
}

/**
 * The full game, if there is one: the only link that can't give the result
 * away (Jellyfin shows nothing but the matchup), so it stays behind the
 * spoiler shield.
 */
export function fullGameOf(game: Game): Highlight | undefined {
  return highlightsFor(game).find((h) => h.kind === "fullGame");
}

/** For tight rows: the full game, nhl.com's best video, then the game center. Any may be missing. */
export function compactHighlights(game: Game): Highlight[] {
  const all = highlightsFor(game);
  return [
    all.find((h) => h.kind === "fullGame"),
    all.find((h) => h.kind === "recap" || h.kind === "condensed"),
    all.find((h) => h.kind === "gameCenter"),
  ].filter((h) => h !== undefined);
}

/**
 * What to watch, as buttons side by side: the full game and nhl.com's best
 * video, or just the game center while there's neither.
 */
export function watchHighlights(game: Game): Highlight[] {
  const compact = compactHighlights(game);
  const videos = compact.filter((h) => h.kind !== "gameCenter");
  return videos.length > 0 ? videos : compact;
}
