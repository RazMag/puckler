import { useId } from "react";
import { teamMeta } from "@/lib/nhl/teams";
import { Puck } from "./Puck";

/**
 * A horizontal bar drawn as a hockey stick: the shaft grows with `value`,
 * the blade sits at the end and shoots a puck that carries the number.
 */
export function StickBar({ team, value, max, label }: { team: string; value: number; max: number; label: string }) {
  const { primary, secondary } = teamMeta(team);
  const tapeId = useId();
  const share = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;

  return (
    <div className="flex h-12 items-start" role="img" aria-label={`${label}: ${value}`}>
      <div
        className="relative mt-[7px] h-3.5 min-w-8 origin-left animate-slap rounded-l-full border-y border-l border-black/50"
        style={{
          width: `calc((100% - 6.5rem) * ${share})`,
          background: `linear-gradient(180deg, rgb(255 255 255 / 0.4), transparent 45%, rgb(0 0 0 / 0.3)), linear-gradient(90deg, transparent 0 55%, ${secondary} 55% 60%, transparent 60% 64%, ${secondary} 64% 66%, transparent 66%), ${primary}`,
        }}
      >
        <span className="tape-white absolute inset-y-0 left-0 w-6 rounded-l-full" />
      </div>
      <svg viewBox="0 0 48 40" className="-ml-px h-10 w-12 shrink-0" aria-hidden="true">
        <defs>
          <pattern id={tapeId} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
            <rect width="5" height="5" fill="#15181d" />
            <rect width="1" height="5" fill="#2e343d" />
          </pattern>
        </defs>
        <path
          d="M0 7 L12 7 C18 7 20 11 22 17 L24 24 C25 27 27 28 30 28 L44 28 C47 28 48 30 48 32 L48 34 C48 37 46 38 43 38 L24 38 C17 38 14 35 12 29 L10 23 C9 21 7 21 4 21 L0 21 Z"
          fill={primary}
          stroke="#000"
          strokeOpacity="0.55"
          strokeWidth="1"
        />
        <path
          d="M22 27.5 C24 28 27 28 30 28 L44 28 C47 28 48 30 48 32 L48 34 C48 37 46 38 43 38 L24 38 C20 38 17 37 15 34 Z"
          fill={`url(#${tapeId})`}
        />
      </svg>
      <Puck size="md" className="-ml-1 self-end">
        {value}
      </Puck>
    </div>
  );
}
