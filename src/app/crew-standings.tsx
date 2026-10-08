import { EmptyCrew } from "@/components/EmptyCrew";
import { Jersey } from "@/components/Jersey";
import { LocalTime } from "@/components/LocalTime";
import { PlayoffBadge } from "@/components/PlayoffBadge";
import { Puck } from "@/components/Puck";
import { SectionHeading } from "@/components/Scoreboard";
import { StickBar } from "@/components/StickBar";
import { TeamLogo } from "@/components/TeamLogo";
import { loadBoard } from "@/lib/data";
import { rankCrew, type CrewRow } from "@/lib/domain/crew-standings";
import { ordinal, pct, signed } from "@/lib/format";
import type { TeamStanding } from "@/lib/nhl/types";

const HOT_STREAK = 3;

function isHot(team: TeamStanding): boolean {
  return team.streak?.code === "W" && team.streak.count >= HOT_STREAK;
}

function streakText(team: TeamStanding): string {
  return team.streak ? `${team.streak.code}${team.streak.count}` : "—";
}

function record(team: TeamStanding): string {
  return `${team.wins}-${team.losses}-${team.otLosses}`;
}

export async function CrewStandings() {
  const { crew, standings } = await loadBoard();
  if (crew.length === 0) return <EmptyCrew />;

  const rows = rankCrew(crew, standings.teams);
  const maxPoints = Math.max(1, ...rows.map((r) => r.team.points));

  return (
    <>
      <Podium rows={rows.slice(0, 3)} />

      <SectionHeading
        aside={
          <>
            NHL standings as of <LocalTime iso={standings.updatedAt} />
          </>
        }
      >
        The Stick Race
      </SectionHeading>
      <ol className="space-y-3">
        {rows.map((row) => (
          <li
            key={row.member.id}
            className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 rounded-sm bg-white/70 px-3 py-2 shadow-sm ring-1 ring-black/5 backdrop-blur-sm sm:grid-cols-[12rem_1fr] sm:px-4"
          >
            <div className="flex items-center gap-2">
              <Puck size="sm" glow={isHot(row.team)}>
                {row.rank}
              </Puck>
              <div className="min-w-0">
                <div className="truncate font-display text-lg leading-tight">{row.member.name}</div>
                <div className="flex items-center gap-1 text-sm font-semibold text-ink-soft">
                  <TeamLogo team={row.team.abbrev} size={18} />
                  {row.team.commonName}
                </div>
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <StickBar
                team={row.team.abbrev}
                value={row.team.points}
                max={maxPoints}
                label={`${row.member.name} points`}
              />
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-ink-soft">
                <span>{record(row.team)}</span>
                <span>{row.team.gamesPlayed} GP</span>
                <span>{signed(row.team.goalDiff)} GD</span>
                <span className={isHot(row.team) ? "font-extrabold text-goal" : ""}>
                  {streakText(row.team)}
                  {isHot(row.team) && " 🚨"}
                </span>
                {row.pointsBehindLeader > 0 && (
                  <span>
                    {row.pointsBehindLeader} pt{row.pointsBehindLeader === 1 ? "" : "s"} back
                  </span>
                )}
                <PlayoffBadge status={row.playoff} division={row.team.division} />
              </div>
            </div>
          </li>
        ))}
      </ol>

      <SectionHeading line="blue" aside="Scroll sideways on a phone →">
        Tale of the Tape
      </SectionHeading>
      <TapeTable rows={rows} />
    </>
  );
}

function Podium({ rows }: { rows: CrewRow[] }) {
  // Silver, gold, bronze from left to right, like a real podium.
  const order = [rows[1], rows[0], rows[2]].filter((r): r is CrewRow => r !== undefined);
  return (
    <section aria-label="Top of the crew" className="flex items-end justify-center gap-2 sm:gap-6">
      {order.map((row) => {
        const first = row.rank === 1;
        return (
          <figure
            key={row.member.id}
            className={`flex flex-col items-center text-center ${first ? "w-40 sm:w-56" : "w-28 sm:w-40"}`}
          >
            <Jersey
              team={row.team.abbrev}
              name={row.member.name}
              number={row.rank}
              patch={first ? "C" : "A"}
              className="w-full drop-shadow-[0_12px_10px_rgb(9_14_26/0.3)]"
            />
            <figcaption className="mt-2">
              <div className={`font-display leading-tight ${first ? "text-2xl" : "text-lg"}`}>{row.member.name}</div>
              <div className="flex items-center justify-center gap-1 text-sm font-semibold text-ink-soft">
                <TeamLogo team={row.team.abbrev} size={18} />
                {row.team.points} pts
              </div>
            </figcaption>
            <div
              className={`mt-2 w-full -skew-x-6 font-display ${
                first
                  ? "h-16 bg-gold text-black"
                  : row.rank === 2
                    ? "h-10 bg-silver text-black"
                    : "h-6 bg-[#c98a4b] text-white"
              } grid place-items-center shadow-[4px_4px_0_0_#000]`}
            >
              <span className="skew-x-6">{ordinal(row.rank)}</span>
            </div>
          </figure>
        );
      })}
    </section>
  );
}

function TapeTable({ rows }: { rows: CrewRow[] }) {
  const columns: { label: string; title: string; value: (r: CrewRow) => string | number }[] = [
    { label: "GP", title: "Games played", value: (r) => r.team.gamesPlayed },
    { label: "W", title: "Wins", value: (r) => r.team.wins },
    { label: "L", title: "Regulation losses", value: (r) => r.team.losses },
    { label: "OT", title: "Overtime/shootout losses", value: (r) => r.team.otLosses },
    { label: "PTS", title: "Points", value: (r) => r.team.points },
    { label: "P%", title: "Points percentage", value: (r) => pct(r.team.pointPct) },
    { label: "GF", title: "Goals for", value: (r) => r.team.goalsFor },
    { label: "GA", title: "Goals against", value: (r) => r.team.goalsAgainst },
    { label: "DIFF", title: "Goal differential", value: (r) => signed(r.team.goalDiff) },
    {
      label: "L10",
      title: "Last 10 games (W-L-OT)",
      value: (r) => `${r.team.last10.wins}-${r.team.last10.losses}-${r.team.last10.otLosses}`,
    },
    { label: "STRK", title: "Current streak", value: (r) => streakText(r.team) },
    { label: "PACE", title: "Points pace over 82 games", value: (r) => r.projectedPoints },
    { label: "NHL", title: "League rank", value: (r) => ordinal(r.team.leagueRank) },
    {
      label: "DIV",
      title: "Division rank",
      value: (r) => `${ordinal(r.team.divisionRank)} ${r.team.division.slice(0, 3)}`,
    },
  ];

  return (
    <div className="jumbotron overflow-x-auto px-2 pt-5 pb-2">
      <table className="w-full min-w-[760px] text-right text-sm">
        <thead>
          <tr className="text-[11px] tracking-[0.18em] text-white/50 uppercase">
            <th className="px-2 py-1 text-left">Player</th>
            {columns.map((c) => (
              <th key={c.label} className="px-2 py-1" title={c.title}>
                <abbr title={c.title} className="no-underline">
                  {c.label}
                </abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.member.id} className="border-t border-white/10">
              <th scope="row" className="px-2 py-2 text-left font-normal">
                <span className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-full bg-white">
                    <TeamLogo team={row.team.abbrev} size={20} />
                  </span>
                  <span className="font-display">{row.member.name}</span>
                </span>
              </th>
              {columns.map((c) => (
                <td
                  key={c.label}
                  className={`px-2 py-2 font-led text-xl ${c.label === "PTS" ? "led" : "text-white/85"}`}
                >
                  {c.value(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
