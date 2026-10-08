import type { PlayoffStatus } from "@/lib/domain/division";
import { ordinal } from "@/lib/format";

const BASE =
  "inline-flex items-center px-2 py-0.5 text-xs font-extrabold tracking-wider whitespace-nowrap uppercase -skew-x-12";

function label(status: PlayoffStatus, compact: boolean, division?: string): string {
  switch (status.kind) {
    case "division":
      return compact ? `In · ${ordinal(status.spot)}` : `In · ${ordinal(status.spot)}${division ? ` ${division}` : ""}`;
    case "wildcard":
      return compact ? `WC${status.spot}` : `Wild card ${status.spot}`;
    case "out":
      if (status.pointsBehind === 0) return compact ? "Bubble" : "Out · on the bubble";
      return compact
        ? `Out −${status.pointsBehind}`
        : `Out · ${status.pointsBehind} pt${status.pointsBehind === 1 ? "" : "s"} back`;
  }
}

const STYLE = {
  division: ["bg-blue-line text-white", "Holds a top-three division spot"],
  wildcard: ["bg-kickplate text-black", "Holds a wild card spot"],
  out: ["bg-ink-soft/20 text-ink", "Outside the playoff picture: points behind the last wild card"],
} as const;

/** "In · 2nd" / "Wild card 1" / "Out · 3 pts back" stamp describing a team's playoff position today. */
export function PlayoffBadge({
  status,
  division,
  compact = false,
}: {
  status: PlayoffStatus;
  division?: string;
  compact?: boolean;
}) {
  const [style, title] = STYLE[status.kind];
  return (
    <span className={`${BASE} ${style}`} title={title}>
      <span className="skew-x-12">{label(status, compact, division)}</span>
    </span>
  );
}
