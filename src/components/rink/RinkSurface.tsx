import { useId } from "react";

/**
 * A regulation rink in a 200×85 viewBox (feet): boards, goal lines,
 * blue lines, the center red line, faceoff circles and creases.
 */
export function RinkSurface({ className }: { className?: string }) {
  const clipId = useId();
  const red = "var(--color-red-line)";
  const blue = "var(--color-blue-line)";
  const endZoneDots = [
    [31, 20.5],
    [31, 64.5],
    [169, 20.5],
    [169, 64.5],
  ] as const;
  const neutralDots = [
    [80, 20.5],
    [80, 64.5],
    [120, 20.5],
    [120, 64.5],
  ] as const;

  return (
    <svg viewBox="0 0 200 85" className={className} aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <rect x="1" y="1" width="198" height="83" rx="28" />
        </clipPath>
        <radialGradient id={`${clipId}-ice`} cx="50%" cy="40%" r="75%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dbe8f3" />
        </radialGradient>
      </defs>

      <rect x="1" y="1" width="198" height="83" rx="28" fill={`url(#${clipId}-ice)`} />
      <g clipPath={`url(#${clipId})`}>
        <line x1="11" y1="0" x2="11" y2="85" stroke={red} strokeWidth="0.6" />
        <line x1="189" y1="0" x2="189" y2="85" stroke={red} strokeWidth="0.6" />
        <rect x="74" y="0" width="2.5" height="85" fill={blue} opacity="0.9" />
        <rect x="123.5" y="0" width="2.5" height="85" fill={blue} opacity="0.9" />
        <rect x="99.25" y="0" width="1.5" height="85" fill={red} />
        <line x1="100" y1="0" x2="100" y2="85" stroke="#fff" strokeWidth="1.5" strokeDasharray="0.6 3.4" />

        <circle cx="100" cy="42.5" r="15" fill="none" stroke={blue} strokeWidth="0.5" />
        <circle cx="100" cy="42.5" r="0.8" fill={blue} />
        {endZoneDots.map(([cx, cy]) => (
          <g key={`${cx}-${cy}`}>
            <circle cx={cx} cy={cy} r="15" fill="none" stroke={red} strokeWidth="0.5" />
            <circle cx={cx} cy={cy} r="1" fill={red} />
          </g>
        ))}
        {neutralDots.map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1" fill={red} />
        ))}

        <path d="M11 38.5 A6 6 0 0 1 11 46.5 Z" fill="#9cc3ec" fillOpacity="0.6" stroke={red} strokeWidth="0.4" />
        <path d="M189 38.5 A6 6 0 0 0 189 46.5 Z" fill="#9cc3ec" fillOpacity="0.6" stroke={red} strokeWidth="0.4" />
        <rect x="7.5" y="39.5" width="3.5" height="6" fill="none" stroke={red} strokeWidth="0.6" />
        <rect x="189" y="39.5" width="3.5" height="6" fill="none" stroke={red} strokeWidth="0.6" />
      </g>
      <rect x="1" y="1" width="198" height="83" rx="28" fill="none" stroke="var(--color-boards)" strokeWidth="2" />
    </svg>
  );
}
