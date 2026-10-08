import { EmptyCrew } from "@/components/EmptyCrew";
import { GameCard } from "@/components/GameCard";
import { Jersey } from "@/components/Jersey";
import { LocalTime } from "@/components/LocalTime";
import { Puck } from "@/components/Puck";
import { SectionHeading } from "@/components/Scoreboard";
import { TeamLogo } from "@/components/TeamLogo";
import { Term } from "@/components/Term";
import { Tooltip } from "@/components/Tooltip";
import type { CrewMember } from "@/lib/crew/types";
import { loadFaceoffs } from "@/lib/data";
import { ownersByTeam } from "@/lib/domain/crew-standings";
import {
  benchReports,
  opponentOf,
  resultFor,
  rivalries,
  scoreFor,
  type BenchReport,
  type Result,
  type Rivalry,
} from "@/lib/domain/faceoffs";
import type { Game } from "@/lib/nhl/types";

export async function FaceoffBoard() {
  const { crew, schedules } = await loadFaceoffs();
  if (crew.length === 0) return <EmptyCrew />;

  const owners = ownersByTeam(crew);
  const clashes = rivalries(crew, schedules);
  const reports = benchReports(crew, schedules);

  return (
    <>
      <SectionHeading aside={`${clashes.length} crew rivalr${clashes.length === 1 ? "y" : "ies"}`}>
        Crew Clashes
      </SectionHeading>
      {clashes.length === 0 ? (
        <p className="font-semibold text-ink-soft">
          No crew picks face each other this season. Draft a rival to make it interesting.
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {clashes.map((rivalry) => (
            <RivalryCard key={`${rivalry.a.id}-${rivalry.b.id}`} rivalry={rivalry} owners={owners} />
          ))}
        </div>
      )}

      <SectionHeading line="blue">Bench Report</SectionHeading>
      <div className="grid gap-6 lg:grid-cols-2">
        {reports.map((report) => (
          <BenchCard key={report.member.id} report={report} owners={owners} />
        ))}
      </div>
    </>
  );
}

function seriesText({ a, b, winsA, winsB, games }: Rivalry): string {
  const played = games.filter((g) => g.phase === "final").length;
  if (played === 0) return `${games.length} meeting${games.length === 1 ? "" : "s"} this season`;
  if (winsA === winsB) return `Series tied ${winsA}–${winsB}`;
  return winsA > winsB ? `${a.name} leads ${winsA}–${winsB}` : `${b.name} leads ${winsB}–${winsA}`;
}

function RivalryCard({ rivalry, owners }: { rivalry: Rivalry; owners: ReadonlyMap<string, CrewMember> }) {
  const { a, b, winsA, winsB, next, last } = rivalry;
  return (
    <article className="overflow-hidden rounded-sm bg-white/80 shadow-md ring-1 ring-black/5">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 pt-4">
        <Jersey team={a.team} name={a.name} number={winsA} className="w-full max-w-36 justify-self-end" />
        <FaceoffDot />
        <Jersey team={b.team} name={b.name} number={winsB} className="w-full max-w-36" />
      </div>
      <p className="mt-2 text-center font-display text-lg">
        <Term term="series">{seriesText(rivalry)}</Term>
      </p>
      <p className="text-center text-xs font-semibold tracking-wider text-ink-soft uppercase">
        Jersey number = series wins
      </p>

      <div className={`mt-4 grid gap-3 bg-boards/5 p-4 ${next && last ? "sm:grid-cols-2" : ""}`}>
        {next && (
          <div>
            <h4 className="mb-1 text-xs font-extrabold tracking-[0.2em] text-ink-soft uppercase">
              {next.phase === "live" ? "On now" : "Next meeting"}
            </h4>
            <GameCard game={next} owners={owners} />
          </div>
        )}
        {last && (
          <div>
            <h4 className="mb-1 text-xs font-extrabold tracking-[0.2em] text-ink-soft uppercase">Last meeting</h4>
            <GameCard game={last} owners={owners} />
          </div>
        )}
      </div>
    </article>
  );
}

/** Center-ice faceoff circle with the dot and hash marks. */
function FaceoffDot() {
  return (
    <svg viewBox="0 0 80 80" className="size-16 sm:size-20" aria-hidden="true">
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

const RESULT_NAME: Record<Result, string> = { W: "Win", L: "Loss", OTL: "OT loss" };

const RESULT_STYLE = {
  W: "bg-goal text-white",
  OTL: "bg-blue-line text-white",
  L: "bg-ink-soft/25 text-ink",
} as const;

function BenchCard({ report, owners }: { report: BenchReport; owners: ReadonlyMap<string, CrewMember> }) {
  const { member, live, recent, upcoming } = report;
  const form = recent.toReversed();

  return (
    <article className="rounded-sm bg-white/80 p-4 shadow-md ring-1 ring-black/5">
      <header className="flex flex-wrap items-center gap-3">
        <TeamLogo team={member.team} size={44} />
        <div className="min-w-32 flex-1">
          <h3 className="truncate font-display text-xl leading-tight">{member.name}</h3>
          <p className="text-sm font-semibold text-ink-soft">{member.team}</p>
        </div>
        <div className="flex items-center gap-1" aria-label="Recent form, oldest to newest">
          <Term term="form" className="mr-1 text-xs font-extrabold tracking-[0.2em] text-ink-soft uppercase">
            Form
          </Term>
          {form.map((game) => {
            const result = resultFor(game, member.team) ?? "L";
            const [us, them] = scoreFor(game, member.team);
            return (
              <Tooltip
                key={game.id}
                title={`${RESULT_NAME[result]} vs ${opponentOf(game, member.team)}`}
                text={`${us}–${them}${game.periodType && game.periodType !== "REG" ? ` (${game.periodType})` : ""}`}
                underline={false}
                className="rounded-full"
              >
                <Puck size="sm" className={`text-sm! ${result === "W" ? "text-goal" : ""}`}>
                  {result === "OTL" ? "OT" : result}
                </Puck>
              </Tooltip>
            );
          })}
        </div>
      </header>

      {live && (
        <div className="mt-4">
          <GameCard game={live} focus={member.team} owners={owners} />
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <section>
          <h4 className="mb-1 text-xs font-extrabold tracking-[0.2em] text-ink-soft uppercase">Last {recent.length}</h4>
          <ul className="divide-y divide-black/5">
            {recent.map((game) => (
              <ResultRow key={game.id} game={game} team={member.team} />
            ))}
            {recent.length === 0 && <li className="py-1 text-sm text-ink-soft">No games yet.</li>}
          </ul>
        </section>
        <section>
          <h4 className="mb-1 text-xs font-extrabold tracking-[0.2em] text-ink-soft uppercase">Up next</h4>
          <ul className="divide-y divide-black/5">
            {upcoming.map((game) => (
              <UpcomingRow key={game.id} game={game} team={member.team} owners={owners} />
            ))}
            {upcoming.length === 0 && <li className="py-1 text-sm text-ink-soft">Season&apos;s over.</li>}
          </ul>
        </section>
      </div>
    </article>
  );
}

function ResultRow({ game, team }: { game: Game; team: string }) {
  const result = resultFor(game, team);
  const home = game.home.abbrev === team;
  const [us, them] = scoreFor(game, team);
  return (
    <li className="flex items-center gap-2 py-1.5 text-sm">
      {result &&
        (result === "OTL" ? (
          <Term
            term="otl"
            underline={false}
            className={`w-9 -skew-x-12 text-center text-xs font-extrabold ${RESULT_STYLE[result]}`}
          >
            {result}
          </Term>
        ) : (
          <span className={`w-9 -skew-x-12 text-center text-xs font-extrabold ${RESULT_STYLE[result]}`}>{result}</span>
        ))}
      <span className="w-4 text-ink-soft">{home ? "vs" : "@"}</span>
      <TeamLogo team={opponentOf(game, team)} size={20} />
      <span className="font-semibold">{opponentOf(game, team)}</span>
      <span className="ml-auto font-led text-xl">
        {us}–{them}
        {(game.periodType === "OT" || game.periodType === "SO") && (
          <Term term={game.periodType === "OT" ? "finalOt" : "finalSo"} underline={false} className="ml-1 text-sm">
            {game.periodType}
          </Term>
        )}
      </span>
    </li>
  );
}

function UpcomingRow({ game, team, owners }: { game: Game; team: string; owners: ReadonlyMap<string, CrewMember> }) {
  const opponent = opponentOf(game, team);
  const rival = owners.get(opponent);
  return (
    <li className="flex items-center gap-2 py-1.5 text-sm">
      <span className="w-4 text-ink-soft">{game.home.abbrev === team ? "vs" : "@"}</span>
      <TeamLogo team={opponent} size={20} />
      <span className="font-semibold">{opponent}</span>
      {rival && (
        <Tooltip
          title="Crew clash"
          text={`${rival.name}'s team. This one counts toward your season series.`}
          underline={false}
          className="-skew-x-12 bg-red-line px-1 font-display text-[10px] text-white"
        >
          {rival.name}
        </Tooltip>
      )}
      <span className="ml-auto text-right text-ink-soft">
        <LocalTime iso={game.startTimeUTC} />
      </span>
    </li>
  );
}
