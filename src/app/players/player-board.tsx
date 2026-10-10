import type { ReactNode } from "react";
import { EmptyCrew } from "@/components/EmptyCrew";
import { Headshot } from "@/components/Headshot";
import { Jersey } from "@/components/Jersey";
import { SectionHeading } from "@/components/Scoreboard";
import { TeamLogo } from "@/components/TeamLogo";
import { Term } from "@/components/Term";
import { loadPlayers } from "@/lib/data";
import {
  hasReturnEstimate,
  isHot,
  LEADER_COUNT,
  playerReport,
  RECENT_GAMES,
  threeStars,
  type GoalieRow,
  type InjuryRow,
  type PlayerReport,
  type RecentForm,
  type SkaterRow,
  type Star,
} from "@/lib/domain/players";
import type { InjuryStatus } from "@/lib/espn/injuries";
import { dayLabel, ordinal, pct, positionLabel, shortName, signed } from "@/lib/format";
import { teamMeta } from "@/lib/nhl/teams";

const SUBHEAD = "mb-1 text-xs font-extrabold tracking-[0.2em] text-ink-soft uppercase";
const TAG = "inline-block shrink-0 -skew-x-12 px-1 font-display text-[10px] leading-4";

export async function PlayerBoard() {
  const { crew, players, injuries, today } = await loadPlayers();
  if (crew.length === 0) return <EmptyCrew />;

  const reports = crew.flatMap((member) => {
    const data = players.get(member.team);
    return data ? [playerReport(member, data, injuries)] : [];
  });
  const stars = threeStars(reports);

  return (
    <>
      <SectionHeading aside={<Term term="threeStars">Last {RECENT_GAMES} games of each team</Term>}>
        Three Stars
      </SectionHeading>
      {stars.length === 0 ? (
        <p className="font-semibold text-ink-soft">Nobody on a crew team has scored yet. The season&apos;s young.</p>
      ) : (
        <ol className="grid gap-4 md:grid-cols-3">
          {stars.map((star, i) => (
            <StarCard key={star.skater.id} star={star} rank={i + 1} />
          ))}
        </ol>
      )}

      <SectionHeading line="blue">Team Sheets</SectionHeading>
      <div className="grid gap-6 lg:grid-cols-2">
        {reports.map((report) => (
          <TeamSheet key={report.member.id} report={report} today={today} />
        ))}
      </div>
    </>
  );
}

function StarCard({ star: { member, skater }, rank }: { star: Star; rank: number }) {
  const { goals, assists, points, games } = skater.recent;
  return (
    <li className="jumbotron flex min-w-0 items-center gap-4 px-4 pt-5 pb-4">
      <Jersey
        team={member.team}
        name={skater.lastName}
        number={skater.number ?? ""}
        className="w-20 shrink-0 drop-shadow-[0_4px_0_rgb(0_0_0/0.5)]"
      />
      <div className="min-w-0 flex-1">
        <p className="led text-lg leading-none">
          {"★".repeat(4 - rank)} {ordinal(rank)} star
        </p>
        <h3 className="mt-1 truncate font-display text-lg leading-tight">
          {skater.firstName} {skater.lastName}
        </h3>
        <p className="flex items-center gap-1.5 text-sm text-white/70">
          <TeamLogo team={member.team} variant="dark" size={18} />
          <span className="truncate">{member.name}&apos;s pick</span>
        </p>
        <p className="mt-2 flex items-baseline gap-2">
          <span className="led text-3xl leading-none">{points}</span>
          <span className="text-xs font-bold tracking-wider text-white/60 uppercase">
            pts · {goals} G {assists} A in {games} GP
          </span>
        </p>
      </div>
    </li>
  );
}

function TeamSheet({ report, today }: { report: PlayerReport; today: string }) {
  const { member, skaters, goalies, injuries, recentGames } = report;
  const leaders = skaters.slice(0, LEADER_COUNT);
  const keyOut = injuries?.filter((i) => i.keyPlayer && i.status !== "dtd").length ?? 0;

  return (
    <article className="min-w-0 rounded-sm bg-white/80 p-4 shadow-md ring-1 ring-black/5">
      <header className="flex flex-wrap items-center gap-3">
        <TeamLogo team={member.team} size={44} />
        <div className="min-w-32 flex-1">
          <h3 className="truncate font-display text-xl leading-tight">{member.name}</h3>
          <p className="text-sm font-semibold text-ink-soft">{teamMeta(member.team).name}</p>
        </div>
        {keyOut > 0 && (
          <Term term="keyPlayer" underline={false} className={`${TAG} bg-red-line py-0.5 text-xs text-white`}>
            {keyOut} key player{keyOut === 1 ? "" : "s"} out
          </Term>
        )}
      </header>

      <section className="mt-4">
        <div className="flex items-end gap-3">
          <h4 className={`${SUBHEAD} flex-1`}>Top scorers</h4>
          {recentGames > 0 && (
            <Term term="lastGames" className={SUBHEAD}>
              Last {recentGames}
            </Term>
          )}
          <Term term="playerPts" className={`${SUBHEAD} w-8 text-right`}>
            P
          </Term>
        </div>
        <ul className="divide-y divide-black/5">
          {leaders.map((skater) => (
            <SkaterItem key={skater.id} skater={skater} team={member.team} />
          ))}
          {leaders.length === 0 && <li className="py-1 text-sm text-ink-soft">No games played yet.</li>}
        </ul>
      </section>

      {goalies.length > 0 && (
        <section className="mt-4">
          <div className="flex items-end gap-3">
            <h4 className={`${SUBHEAD} flex-1`}>In net</h4>
            <Term term="svPct" className={`${SUBHEAD} w-10 text-right`}>
              SV%
            </Term>
            <Term term="gaa" className={`${SUBHEAD} w-10 text-right`}>
              GAA
            </Term>
          </div>
          <ul className="divide-y divide-black/5">
            {goalies.slice(0, 2).map((goalie) => (
              <GoalieItem key={goalie.id} goalie={goalie} team={member.team} />
            ))}
          </ul>
        </section>
      )}

      <section className="mt-4">
        <h4 className={SUBHEAD}>Injury report</h4>
        {injuries === null ? (
          <p className="py-1 text-sm text-ink-soft">The injury report is unavailable right now. Check back soon.</p>
        ) : injuries.length === 0 ? (
          <p className="py-1 text-sm text-ink-soft">Clean bill of health. Nobody&apos;s on the injury report.</p>
        ) : (
          <ul className="divide-y divide-black/5">
            {injuries.map((injury) => (
              <InjuryItem
                key={`${injury.firstName}-${injury.lastName}`}
                injury={injury}
                team={member.team}
                today={today}
              />
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}

/** Headshot, number and name over a stat line, with stats on the right. */
function PlayerRow({
  headshot,
  firstName,
  lastName,
  number,
  position,
  team,
  tags,
  line,
  children,
}: {
  headshot: string | null;
  firstName: string;
  lastName: string;
  number: number | null;
  position: string | null;
  team: string;
  tags?: ReactNode;
  line: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 py-2 sm:gap-3">
      <Headshot src={headshot} name={`${firstName} ${lastName}`} team={team} />
      <div className="min-w-0 flex-1">
        {/* The name gets the line to itself; tags and stats give way first on narrow screens. */}
        <p className="truncate font-bold">
          {number !== null && <span className="font-varsity text-sm text-ink-soft">#{number} </span>}
          {shortName(firstName, lastName)}
        </p>
        <p className="flex items-center gap-1.5 text-xs text-ink-soft">
          {tags}
          <span className="truncate">
            {position && <span className="font-bold">{positionLabel(position)} · </span>}
            {line}
          </span>
        </p>
      </div>
      {children}
    </div>
  );
}

function SkaterItem({ skater, team }: { skater: SkaterRow; team: string }) {
  return (
    <li>
      <PlayerRow
        {...skater}
        team={team}
        tags={
          <>
            {isHot(skater.recent) && (
              <Term term="hotStick" underline={false} className={`${TAG} bg-goal text-white`}>
                Hot
              </Term>
            )}
            {skater.injury && <StatusTag status={skater.injury.status} />}
          </>
        }
        line={
          <>
            {skater.gamesPlayed} GP · {skater.goals} G · {skater.assists} A ·{" "}
            <Term term="plusMinus" underline={false}>
              {signed(skater.plusMinus)}
            </Term>
          </>
        }
      >
        <FormCells form={skater.recent} />
        <span className="w-8 text-right font-led text-3xl leading-none">{skater.points}</span>
      </PlayerRow>
    </li>
  );
}

/** One cell per recent team game: points scored, 0, or a dash when the player sat. */
function FormCells({ form }: { form: RecentForm }) {
  if (form.perGame.length === 0) return null;
  const spoken = form.perGame.map((p) => (p === null ? "didn't play" : `${p}`)).join(", ");
  return (
    <span
      role="img"
      className="flex shrink-0 gap-0.5"
      aria-label={`Points in the last ${form.perGame.length} games, oldest first: ${spoken}`}
    >
      {form.perGame.map((points, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`grid size-4 place-items-center font-led text-sm leading-none sm:size-5 sm:text-base ${
            points === null ? "text-ink-soft/50" : points > 0 ? "bg-red-line text-white" : "bg-boards/5 text-ink-soft"
          }`}
        >
          {points === null ? "–" : points}
        </span>
      ))}
    </span>
  );
}

function GoalieItem({ goalie, team }: { goalie: GoalieRow; team: string }) {
  return (
    <li>
      <PlayerRow
        {...goalie}
        position={null}
        team={team}
        tags={goalie.injury && <StatusTag status={goalie.injury.status} />}
        line={
          <>
            <Term term="goalieRecord" underline={false}>
              {goalie.wins}-{goalie.losses}-{goalie.otLosses}
            </Term>{" "}
            · {goalie.gamesStarted} of {goalie.gamesPlayed} GP started
          </>
        }
      >
        <span className="w-10 text-right font-led text-xl leading-none">
          {goalie.savePct === null ? "—" : pct(goalie.savePct)}
        </span>
        <span className="w-10 text-right font-led text-xl leading-none">
          {goalie.gaa === null ? "—" : goalie.gaa.toFixed(2)}
        </span>
      </PlayerRow>
    </li>
  );
}

const STATUS = {
  ir: { label: "IR", term: "ir", style: "bg-red-line text-white" },
  out: { label: "Out", term: "injuryOut", style: "bg-red-line text-white" },
  dtd: { label: "DTD", term: "dtd", style: "bg-led text-ink" },
  suspended: { label: "Susp", term: "suspended", style: "bg-boards text-white" },
} as const satisfies Record<InjuryStatus, { label: string; term: string; style: string }>;

function StatusTag({ status }: { status: InjuryStatus }) {
  const { label, term, style } = STATUS[status];
  return (
    <Term term={term} underline={false} className={`${TAG} ${style}`}>
      {label}
    </Term>
  );
}

function InjuryItem({ injury, team, today }: { injury: InjuryRow; team: string; today: string }) {
  return (
    <li className="pb-2">
      <PlayerRow
        {...injury}
        team={team}
        tags={
          injury.keyPlayer && (
            <Term term="keyPlayer" underline={false} className={`${TAG} bg-boards text-led`}>
              Key
            </Term>
          )
        }
        line={
          <>
            {injury.ailment ?? "Undisclosed"}
            {hasReturnEstimate(injury, today) && (
              <>
                {" · "}
                <Term term="estReturn" underline={false}>
                  back ~{dayLabel(injury.returnDate!)}
                </Term>
              </>
            )}
          </>
        }
      >
        <StatusTag status={injury.status} />
      </PlayerRow>
      {injury.note && <p className="-mt-1 pl-12 text-xs text-ink-soft/90 sm:pl-[52px]">{injury.note}</p>}
    </li>
  );
}
