import type { ReactNode } from "react";
import { inkOn, teamMeta } from "@/lib/nhl/teams";
import { TeamLogo } from "./TeamLogo";
import { HoverTip } from "./Tooltip";

/**
 * A team's full name on hover, focus or tap, shown as a nameplate in its
 * colors with jersey hem stripes. `detail` adds a line under the name.
 */
export function TeamTooltip({
  team,
  detail,
  children,
  underline,
  className,
}: {
  team: string;
  detail?: ReactNode;
  children: ReactNode;
  underline?: boolean;
  className?: string;
}) {
  const { abbrev, name, primary, secondary } = teamMeta(team);
  const ink = inkOn(primary);

  return (
    <HoverTip
      underline={underline}
      className={className}
      tipClassName="min-w-44 max-w-72 border-2 border-black text-sm font-semibold shadow-[4px_4px_0_0_#000]"
      tipStyle={{ background: primary, color: ink }}
      tip={
        <>
          <span className="flex items-center gap-2.5 px-3 pt-2.5 pb-2">
            <span
              aria-hidden="true"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-white ring-2 ring-black/40"
            >
              <TeamLogo team={abbrev} size={28} />
            </span>
            <span className="min-w-0">
              <span
                className="block font-varsity text-base leading-tight uppercase"
                style={{ textShadow: `1px 1px 0 ${secondary}` }}
              >
                {name}
              </span>
              <span className="mt-1 flex items-center gap-2 text-xs">
                <span
                  className="-skew-x-12 px-1 font-display text-[10px] leading-tight"
                  style={{ background: secondary, color: inkOn(secondary) }}
                >
                  {abbrev}
                </span>
                {detail && <span className="opacity-85">{detail}</span>}
              </span>
            </span>
          </span>
          {/* Hem stripes, as on the jersey. */}
          <span
            aria-hidden="true"
            className="block h-3 border-t border-black/30"
            style={{ background: `linear-gradient(180deg, ${secondary} 0 40%, transparent 40% 65%, ${secondary} 65%)` }}
          />
        </>
      }
    >
      {children}
    </HoverTip>
  );
}
