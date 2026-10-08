/** Two crossed sticks over a puck — the site mark. */
export function CrossedSticks({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <g strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 4 L38 44 Q41 49 47 49 L58 49" fill="none" stroke="#d4172a" strokeWidth="6" />
        <path d="M56 4 L26 44 Q23 49 17 49 L6 49" fill="none" stroke="#f7fbfe" strokeWidth="6" />
        <path d="M9 5.5 L15 13.5" stroke="#f5c400" strokeWidth="6.5" />
        <path d="M55 5.5 L49 13.5" stroke="#f5c400" strokeWidth="6.5" />
      </g>
      <ellipse cx="32" cy="57" rx="10" ry="4" fill="#000" stroke="#3a4560" strokeWidth="1.5" />
    </svg>
  );
}
