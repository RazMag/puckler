import { GameCard } from "@/components/GameCard";
import { TeamLogo } from "@/components/TeamLogo";
import { TeamTooltip } from "@/components/TeamTooltip";
import { UpcomingRow } from "@/components/UpcomingRow";
import type { CrewMember } from "@/lib/crew/types";
import { loadSchedules } from "@/lib/data";
import { ownersByTeam } from "@/lib/domain/crew-standings";
import { benchReports } from "@/lib/domain/faceoffs";

/** Each pick's live game and next few games, in the order the crew is ranked. */
export async function OnDeck({ crew }: { crew: readonly CrewMember[] }) {
  const schedules = await loadSchedules(crew.map((m) => m.team));
  const owners = ownersByTeam(crew);

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {benchReports(crew, schedules).map(({ member, live, upcoming }) => (
        <li key={member.id} className="rounded-sm bg-white/80 p-3 shadow-sm ring-1 ring-black/5">
          <header className="flex items-center gap-2">
            <TeamLogo team={member.team} size={28} />
            <h3 className="min-w-0 truncate font-display text-lg leading-tight">{member.name}</h3>
            <TeamTooltip team={member.team} className="ml-auto text-sm font-semibold text-ink-soft">
              {member.team}
            </TeamTooltip>
          </header>
          {live && (
            <div className="mt-2">
              <GameCard game={live} focus={member.team} owners={owners} />
            </div>
          )}
          <ul className="mt-1 divide-y divide-black/5">
            {upcoming.map((game) => (
              <UpcomingRow key={game.id} game={game} team={member.team} owners={owners} />
            ))}
            {upcoming.length === 0 && <li className="py-1.5 text-sm text-ink-soft">Season&apos;s over.</li>}
          </ul>
        </li>
      ))}
    </ul>
  );
}
