import type { CrewMember } from "@/lib/crew/types";
import { initials } from "@/lib/domain/crew-standings";
import type { DivisionTable } from "@/lib/domain/division";
import { teamMeta } from "@/lib/nhl/teams";
import { TeamLogo } from "../TeamLogo";
import { RinkSurface } from "./RinkSurface";

// Usable ice between the goal lines, as a share of the 200 ft rink.
const ICE_START = 13 / 200;
const ICE_END = 187 / 200;

function xFor(points: number, maxPoints: number): number {
  const share = maxPoints > 0 ? points / maxPoints : 0;
  return (ICE_START + share * (ICE_END - ICE_START)) * 100;
}

/**
 * One division drawn as a rink: each team is a puck slid down the ice by its
 * points (one lane per team, best at the top), with the conference playoff
 * cut painted as a dashed line.
 */
export function DivisionRink({
  division,
  maxPoints,
  cutLinePoints,
  owners,
}: {
  division: DivisionTable;
  maxPoints: number;
  cutLinePoints: number;
  owners: ReadonlyMap<string, CrewMember>;
}) {
  const lanes = division.teams.length;
  const cutX = xFor(cutLinePoints, maxPoints);

  return (
    <div className="@container relative aspect-[200/85] w-full drop-shadow-[0_10px_14px_rgb(9_14_26/0.25)]">
      <RinkSurface className="absolute inset-0 h-full w-full" />

      <div
        className="absolute top-[6%] bottom-[6%] border-l-2 border-dashed border-goal"
        style={{ left: `${cutX}%` }}
        aria-hidden="true"
      >
        <span className="absolute -top-1 left-1 font-led text-[clamp(10px,2.6cqw,15px)] leading-none whitespace-nowrap text-goal">
          WC CUT {cutLinePoints}
        </span>
      </div>

      <ol aria-label={`${division.name} division by points`}>
        {division.teams.map((team, i) => {
          const owner = owners.get(team.abbrev);
          const top = 12 + (i * 76) / Math.max(1, lanes - 1);
          return (
            <li
              key={team.abbrev}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${xFor(team.points, maxPoints)}%`, top: `${top}%`, zIndex: owner ? 2 : 1 }}
              title={`${team.name}: ${team.points} pts${owner ? ` — ${owner.name}'s pick` : ""}`}
            >
              <span
                className={`grid size-[clamp(18px,5.4cqw,34px)] place-items-center rounded-full bg-white ${
                  owner ? "animate-goal-light ring-[3px]" : "ring-1 ring-black/30"
                }`}
                style={owner ? { ["--tw-ring-color" as string]: teamMeta(team.abbrev).primary } : undefined}
              >
                <TeamLogo team={team.abbrev} size={28} className="size-[82%]" />
              </span>
              {owner && (
                <span className="absolute top-1/2 left-full ml-1 -translate-y-1/2 -skew-x-12 bg-boards px-1 font-display text-[clamp(8px,2.2cqw,12px)] leading-tight text-white">
                  {initials(owner.name)}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
