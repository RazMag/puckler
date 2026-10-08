import type { ReactNode } from "react";

const SIZES = {
  sm: "size-8 text-lg",
  md: "size-11 text-2xl",
  lg: "size-16 text-4xl",
} as const;

const SHADOW =
  "shadow-[inset_0_0_0_3px_#000,inset_0_0_0_5px_rgb(255_255_255/0.08),0_4px_0_0_#000,0_6px_12px_-2px_rgb(0_0_0/0.5)]";
const GLOW_SHADOW =
  "shadow-[inset_0_0_0_3px_#000,inset_0_0_0_5px_rgb(255_255_255/0.08),0_4px_0_0_#000,0_0_14px_4px_rgb(255_38_38/0.55)]";

/** A vulcanized-rubber puck seen from above, carrying a value. */
export function Puck({
  children,
  size = "md",
  className = "",
  glow = false,
}: {
  children: ReactNode;
  size?: keyof typeof SIZES;
  className?: string;
  /** Steady red goal-light halo, e.g. for a team on a hot streak. */
  glow?: boolean;
}) {
  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#3a404c,#0b0d12_62%)] font-led leading-none text-white ${
        glow ? GLOW_SHADOW : SHADOW
      } ${SIZES[size]} ${className}`}
    >
      {children}
    </span>
  );
}
