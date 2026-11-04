import { compactHighlights, highlightsFor, watchHighlights, type Highlight } from "@/lib/nhl/highlights";
import type { Game } from "@/lib/nhl/types";
import { WatchIcon } from "./WatchIcons";

const BASE = "inline-block -skew-x-12 px-2 py-0.5 text-xs font-extrabold tracking-wider whitespace-nowrap uppercase";

/** The full game is lit like the scoreboard; nhl.com's best link stays goal-light red, the rest are outlined. */
const STYLE = {
  dark: {
    fullGame: "bg-led text-boards hover:bg-gold",
    primary: "bg-red-line text-white hover:bg-goal",
    secondary: "border border-white/30 text-white/80 hover:border-white hover:text-white",
  },
  light: {
    fullGame: "bg-led text-ink shadow-[1px_1px_0_0_var(--color-ink)] hover:bg-gold",
    primary: "bg-red-line text-white hover:bg-goal",
    secondary: "border border-boards/30 text-ink hover:border-boards",
  },
} as const;

function styleOf(links: readonly Highlight[], i: number, variant: keyof typeof STYLE): string {
  const h = links[i]!;
  if (h.kind === "fullGame") return STYLE[variant].fullGame;
  return links.findIndex((l) => l.kind !== "fullGame") === i ? STYLE[variant].primary : STYLE[variant].secondary;
}

/**
 * Links to the game's video, best first: the full game in Jellyfin, then
 * nhl.com's recap, condensed game and game center. Each kind has its own
 * icon so the full game never reads as another highlight reel. Renders
 * nothing for games that haven't finished.
 */
export function HighlightLinks({
  game,
  variant = "dark",
  watch = false,
  compact = false,
}: {
  game: Game;
  variant?: keyof typeof STYLE;
  /** Just what to watch: the full game and nhl.com's best video. */
  watch?: boolean;
  /** For tight rows: icon buttons for the full game, the best video and the game center; labels move to the tooltip. */
  compact?: boolean;
}) {
  const links = compact ? compactHighlights(game) : watch ? watchHighlights(game) : highlightsFor(game);
  if (links.length === 0) return null;
  const matchup = `${game.away.abbrev} at ${game.home.abbrev}`;

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {links.map((h, i) => (
        <a
          key={h.kind}
          href={h.url}
          target="_blank"
          rel="noopener noreferrer"
          title={compact ? `${h.label}: ${h.description} on ${h.site}` : `${h.description} on ${h.site}`}
          aria-label={`${h.label}, ${h.description}: ${matchup} (opens ${h.site})`}
          className={`${BASE} ${styleOf(links, i, variant)}`}
        >
          <span className="flex skew-x-12 items-center gap-1">
            {(compact || h.kind !== "gameCenter") && <WatchIcon kind={h.kind} />}
            {!compact && h.label}
          </span>
        </a>
      ))}
    </span>
  );
}
