import type { Highlight } from "@/lib/nhl/highlights";

/** A screen with a play button: the whole broadcast. */
export function FullGameIcon({ className = "size-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 13" className={`shrink-0 ${className}`} aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M2 .5h12A1.5 1.5 0 0 1 15.5 2v7a1.5 1.5 0 0 1-1.5 1.5H2A1.5 1.5 0 0 1 .5 9V2A1.5 1.5 0 0 1 2 .5zm4.5 2.5v5l4-2.5z"
        fill="currentColor"
      />
      <rect x="4.5" y="11.5" width="7" height="1.5" rx="0.75" fill="currentColor" />
    </svg>
  );
}

/** A video camera: nhl.com's recap or condensed game. */
export function ClipIcon({ className = "size-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 12" className={`shrink-0 ${className}`} aria-hidden="true">
      <rect x="0.5" y="1.5" width="10" height="9" rx="1.5" fill="currentColor" />
      <path d="M11.5 5 15.5 2.5v7L11.5 7z" fill="currentColor" />
    </svg>
  );
}

/** Three bars: the game center's box score and stats. */
export function BoxScoreIcon({ className = "size-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={`shrink-0 ${className}`} aria-hidden="true">
      <path d="M1 11V6h2.5v5zM4.75 11V1h2.5v10zM8.5 11V4H11v7z" fill="currentColor" />
    </svg>
  );
}

export function WatchIcon({ kind, className }: { kind: Highlight["kind"]; className?: string }) {
  if (kind === "fullGame") return <FullGameIcon className={className} />;
  if (kind === "gameCenter") return <BoxScoreIcon className={className} />;
  return <ClipIcon className={className} />;
}
