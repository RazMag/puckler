import { Tooltip } from "./Tooltip";

export const TAPED_TIP = "Hidden so you can watch it first. Flip Spoilers on at the top once you're caught up.";

const SIZES = {
  sm: "px-1.5 py-0.5 text-[10px]",
  lg: "px-3 py-1.5 text-xs",
} as const;

/** A strip of hockey tape stuck over a result the viewer hasn't caught up on. */
export function SpoilerTape({
  label = "No spoilers",
  size = "sm",
  className = "",
}: {
  label?: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <Tooltip
      title="Taped over"
      text={TAPED_TIP}
      underline={false}
      className={`inline-block drop-shadow-[1px_2px_0_rgb(0_0_0/0.45)] ${className}`}
    >
      <span
        className={`spoiler-tape inline-block -rotate-3 font-display leading-none tracking-wider whitespace-nowrap uppercase ${SIZES[size]}`}
      >
        {label}
      </span>
    </Tooltip>
  );
}
