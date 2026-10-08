import { highlightsFor } from "@/lib/nhl/highlights";
import type { Game } from "@/lib/nhl/types";

const BASE = "inline-block -skew-x-12 px-2 py-0.5 text-xs font-extrabold tracking-wider whitespace-nowrap uppercase";

const STYLE = {
  dark: {
    primary: "bg-red-line text-white hover:bg-goal",
    secondary: "border border-white/30 text-white/80 hover:border-white hover:text-white",
  },
  light: {
    primary: "bg-red-line text-white hover:bg-goal",
    secondary: "border border-boards/30 text-ink hover:border-boards",
  },
} as const;

/**
 * Links to the game's highlights on nhl.com, best first (recap, condensed
 * game, game center). Renders nothing for games that haven't finished.
 */
export function HighlightLinks({
  game,
  variant = "dark",
  max = 3,
  compact = false,
}: {
  game: Game;
  variant?: keyof typeof STYLE;
  /** Cap on how many links to show; 1 keeps just the best one. */
  max?: number;
  /** Just a ▶ button for the best link, for tight rows; the label moves to the tooltip. */
  compact?: boolean;
}) {
  const links = highlightsFor(game).slice(0, compact ? 1 : max);
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
          title={compact ? `${h.label}: ${h.description} on nhl.com` : `${h.description} on nhl.com`}
          aria-label={`${h.label}, ${h.description}: ${matchup} (opens nhl.com)`}
          className={`${BASE} ${i === 0 ? STYLE[variant].primary : STYLE[variant].secondary}`}
        >
          <span className="inline-block skew-x-12">
            {i === 0 && <span aria-hidden="true">{compact ? "▶" : "▶ "}</span>}
            {!compact && h.label}
          </span>
        </a>
      ))}
    </span>
  );
}
