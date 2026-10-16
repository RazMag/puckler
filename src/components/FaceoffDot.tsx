/** Center-ice faceoff circle with the dot and hash marks. */
export function FaceoffDot({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
      <circle cx="40" cy="40" r="34" fill="#fff" stroke="var(--color-red-line)" strokeWidth="3" />
      <g stroke="var(--color-red-line)" strokeWidth="3">
        <path d="M28 6 V0 M52 6 V0 M28 74 V80 M52 74 V80" />
      </g>
      <circle cx="40" cy="40" r="11" fill="var(--color-red-line)" />
      <text x="40" y="45" textAnchor="middle" fontFamily="var(--font-display)" fontSize="13" fill="#fff">
        VS
      </text>
    </svg>
  );
}
