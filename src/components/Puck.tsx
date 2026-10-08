import type { ReactNode } from "react";

const SIZES = {
  sm: "size-8 text-lg",
  md: "size-11 text-2xl",
  lg: "size-16 text-4xl",
} as const;

/** A vulcanized-rubber puck seen from above, carrying a value. */
export function Puck({
  children,
  size = "md",
  className = "",
  title,
}: {
  children: ReactNode;
  size?: keyof typeof SIZES;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`relative inline-grid shrink-0 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#3a404c,#0b0d12_62%)] font-led leading-none text-white shadow-[inset_0_0_0_3px_#000,inset_0_0_0_5px_rgb(255_255_255/0.08),0_4px_0_0_#000,0_6px_12px_-2px_rgb(0_0_0/0.5)] ${SIZES[size]} ${className}`}
    >
      {children}
    </span>
  );
}
