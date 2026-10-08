import type { PlayoffStatus } from "@/lib/domain/division";
import type { GlossaryKey } from "@/lib/glossary";
import { ordinal } from "@/lib/format";
import { Term } from "./Term";

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
  division: "bg-blue-line text-white",
  wildcard: "bg-kickplate text-black",
  out: "bg-ink-soft/20 text-ink",
} as const;

function termFor(status: PlayoffStatus): GlossaryKey {
  if (status.kind === "division") return "divisionSpot";
  if (status.kind === "wildcard") return "wildCard";
  return status.pointsBehind === 0 ? "bubble" : "out";
}

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
  return (
    <Term term={termFor(status)} underline={false} className={`${BASE} ${STYLE[status.kind]}`}>
      <span className="skew-x-12">{label(status, compact, division)}</span>
    </Term>
  );
}
