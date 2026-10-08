import type { Game } from "./types";

export type Highlight = {
  kind: "recap" | "condensed" | "gameCenter";
  /** Short button text. */
  label: string;
  /** What the link opens, for tooltips and screen readers. */
  description: string;
  url: string;
};

const ORDER = [
  { kind: "recap", label: "Recap", description: "3-minute highlights" },
  { kind: "condensed", label: "Condensed", description: "the whole game in about 10 minutes" },
  { kind: "gameCenter", label: "Game center", description: "box score, goal clips and stats" },
] as const;

/**
 * Video and recap links for a finished game, best first. The NHL posts the
 * recap and condensed game a few hours after the final horn; the game center
 * page always exists and carries per-goal clips in the meantime.
 */
export function highlightsFor(game: Game): Highlight[] {
  if (game.phase !== "final") return [];
  return ORDER.flatMap(({ kind, label, description }) => {
    const url = game.links[kind];
    return url ? [{ kind, label, description, url }] : [];
  });
}
