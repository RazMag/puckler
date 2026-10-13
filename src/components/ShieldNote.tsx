import type { ReactNode } from "react";
import { dayLabel } from "@/lib/format";

/** Tape across the top of a board saying what the spoiler shield is holding back. */
export function ShieldNote({ children }: { children: ReactNode }) {
  return (
    <div role="note" className="mb-2 drop-shadow-[3px_3px_0_rgb(0_0_0/0.85)]">
      <p className="spoiler-tape -rotate-[0.4deg] px-6 py-3 font-semibold sm:px-8">
        <span className="mr-2 font-display text-sm tracking-wider text-red-line uppercase">Spoiler shield up</span>
        {children}
      </p>
    </div>
  );
}

/** The standings and divisions pages, while the standings are rewound to the end of `through`. */
export function StandingsShieldNote({ through }: { through: string }) {
  return (
    <ShieldNote>
      Standings stop at the end of {dayLabel(through)} (NHL time), before the games you haven&apos;t caught up on.
    </ShieldNote>
  );
}
