import { useId } from "react";
import { inkOn, teamMeta } from "@/lib/nhl/teams";

type Props = {
  team: string;
  name: string;
  number: number | string;
  className?: string;
};

const BODY = "M30 10 L46 4 Q60 15 74 4 L90 10 L118 32 L105 58 L94 51 L94 124 Q60 130 26 124 L26 51 L15 58 L2 32 Z";

// Cuff stripes run parallel to each sleeve end; the left one mirrors the right.
const RIGHT_CUFF = "M108.5 23.3 L112.8 26.6 L104.1 55.4 L101.6 54.0 Z";
const LEFT_CUFF = "M11.5 23.3 L7.2 26.6 L15.9 55.4 L18.4 54.0 Z";

/** The back of a jersey in team colors with a name bar and number. */
export function Jersey({ team, name, number, className }: Props) {
  const { primary, secondary } = teamMeta(team);
  const ink = inkOn(primary);
  const label = name.toUpperCase();
  const clipId = useId();

  return (
    <svg
      viewBox="0 0 120 132"
      className={className}
      role="img"
      aria-label={`${name}'s ${team} jersey, number ${number}`}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={BODY} />
        </clipPath>
        <linearGradient id={`${clipId}-fold`} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.22" />
          <stop offset="0.3" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="0.7" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.25" />
        </linearGradient>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        <rect width="120" height="132" fill={primary} />
        <rect y="102" width="120" height="7" fill={secondary} />
        <rect y="113" width="120" height="4" fill={secondary} />
        <path d={RIGHT_CUFF} fill={secondary} />
        <path d={LEFT_CUFF} fill={secondary} />
        <rect width="120" height="132" fill={`url(#${clipId}-fold)`} />
      </g>
      <path d={BODY} fill="none" stroke="#000" strokeOpacity="0.55" strokeWidth="2" strokeLinejoin="round" />
      <path d="M46 4 Q60 15 74 4" fill="none" stroke={secondary} strokeWidth="3.5" />

      <text
        x="60"
        y="37"
        textAnchor="middle"
        fontFamily="var(--font-varsity)"
        fontSize="12"
        fill={ink}
        {...(label.length > 8 ? { textLength: 58, lengthAdjust: "spacingAndGlyphs" } : {})}
      >
        {label}
      </text>
      <text
        x="60"
        y="90"
        textAnchor="middle"
        fontFamily="var(--font-varsity)"
        fontSize="44"
        fill={ink}
        stroke={secondary}
        strokeWidth="2.5"
        paintOrder="stroke"
      >
        {number}
      </text>
    </svg>
  );
}
