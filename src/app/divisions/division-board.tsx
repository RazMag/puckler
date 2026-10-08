import type { CrewMember } from "@/lib/crew/types";
import { PlayoffBadge } from "@/components/PlayoffBadge";
import { DivisionRink } from "@/components/rink/DivisionRink";
import { SectionHeading } from "@/components/Scoreboard";
import { TeamLogo } from "@/components/TeamLogo";
import { loadBoard } from "@/lib/data";
import { ownersByTeam } from "@/lib/domain/crew-standings";
import { conferenceTables, DIVISION_SPOTS, playoffStatus, WILD_CARD_SPOTS } from "@/lib/domain/division";
import { signed } from "@/lib/format";
import type { TeamStanding } from "@/lib/nhl/types";

export async function DivisionBoard() {
  const { crew, standings } = await loadBoard();
  const owners = ownersByTeam(crew);
  const maxPoints = Math.max(1, ...standings.teams.map((t) => t.points));

  return conferenceTables(standings.teams).map((conference) => (
    <section key={conference.name} aria-label={`${conference.name} Conference`}>
      <SectionHeading line="blue" aside={`Wild card cut: ${conference.cutLinePoints} pts`}>
        {conference.name} Conference
      </SectionHeading>

      <div className="grid gap-8 lg:grid-cols-2">
        {conference.divisions.map((division) => (
          <article key={division.name} className="min-w-0">
            <h3 className="mb-2 font-display text-xl tracking-wide">
              {division.name}
              <span className="ml-2 align-middle font-sans text-sm font-semibold text-ink-soft">
                top {DIVISION_SPOTS} qualify
              </span>
            </h3>
            <DivisionRink
              division={division}
              maxPoints={maxPoints}
              cutLinePoints={conference.cutLinePoints}
              owners={owners}
            />
            <StandingsTable
              teams={division.teams}
              owners={owners}
              all={standings.teams}
              cutAfter={DIVISION_SPOTS}
              rankOf={(t) => t.divisionRank}
            />
          </article>
        ))}
      </div>

      <h3 className="mt-8 mb-2 font-display text-xl tracking-wide">
        Wild Card Race
        <span className="ml-2 align-middle font-sans text-sm font-semibold text-ink-soft">
          best {WILD_CARD_SPOTS} of the rest
        </span>
      </h3>
      <StandingsTable
        teams={conference.wildCardRace}
        owners={owners}
        all={standings.teams}
        cutAfter={WILD_CARD_SPOTS}
        rankOf={(t) => t.wildcardRank}
      />
    </section>
  ));
}

function StandingsTable({
  teams,
  owners,
  all,
  cutAfter,
  rankOf,
}: {
  teams: TeamStanding[];
  owners: ReadonlyMap<string, CrewMember>;
  all: readonly TeamStanding[];
  cutAfter: number;
  rankOf: (team: TeamStanding) => number;
}) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[400px] border-collapse bg-white/80 text-sm shadow-sm">
        <thead>
          <tr className="bg-boards text-[11px] tracking-[0.15em] text-white/60 uppercase">
            <th className="w-8 px-2 py-1.5">#</th>
            <th className="px-2 py-1.5 text-left">Team</th>
            <th className="px-2 py-1.5 text-right" title="Wins-losses-overtime losses">
              Record
            </th>
            <th className="px-2 py-1.5 text-right">PTS</th>
            <th className="px-2 py-1.5 text-right">Diff</th>
            <th className="px-2 py-1.5 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => {
            const owner = owners.get(team.abbrev);
            const lastIn = rankOf(team) === cutAfter;
            return (
              <tr
                key={team.abbrev}
                className={`${owner ? "bg-kickplate/25 font-semibold" : ""} ${
                  lastIn ? "border-b-4 border-red-line" : "border-b border-black/5"
                }`}
              >
                <td className="px-2 py-1.5 text-center font-led text-lg">{rankOf(team)}</td>
                <td className="px-2 py-1.5">
                  <span className="flex items-center gap-2">
                    <TeamLogo team={team.abbrev} size={22} />
                    <span className="truncate">{team.commonName}</span>
                    {owner && (
                      <span className="-skew-x-12 bg-red-line px-1.5 font-display text-[11px] whitespace-nowrap text-white">
                        {owner.name}
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {team.wins}-{team.losses}-{team.otLosses}
                </td>
                <td className="px-2 py-1.5 text-right font-led text-xl">{team.points}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{signed(team.goalDiff)}</td>
                <td className="px-2 py-1.5">
                  <PlayoffBadge status={playoffStatus(team, all)} compact />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
