import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { EmptyCrew } from "@/components/EmptyCrew";
import { FaceoffDot } from "@/components/FaceoffDot";
import { SpoilerTape } from "@/components/SpoilerTape";
import { TeamLogo } from "@/components/TeamLogo";
import { TeamTooltip } from "@/components/TeamTooltip";
import type { CrewMember } from "@/lib/crew/types";
import { loadCalendar } from "@/lib/data";
import { shorthand } from "@/lib/domain/crew-standings";
import { onDeck, played, recordIn, resultFor, type DeckGame, type Result } from "@/lib/domain/faceoffs";
import { monthLabel } from "@/lib/format";
import { highlightsFor } from "@/lib/nhl/highlights";
import { inkOn, teamMeta } from "@/lib/nhl/teams";
import type { Game, GameSide } from "@/lib/nhl/types";
import { addDays, easternDate } from "@/lib/spoilers/shield";

type Params = Awaited<PageProps<"/schedule">["searchParams"]>;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Which part of the season the calendar hangs: what's left, what's been played, or all of it. */
const VIEWS = [
  { key: "ahead", label: "Ahead", empty: "NOTHING LEFT ON THE SCHEDULE" },
  { key: "played", label: "Played", empty: "NO CREW GAMES PLAYED YET" },
  { key: "season", label: "Whole season", empty: "NO CREW GAMES THIS SEASON" },
] as const;

type View = (typeof VIEWS)[number]["key"];

const weekday = (day: string) => new Date(`${day}T00:00:00Z`).getUTCDay();

function plays(entry: DeckGame, team: string): boolean {
  return entry.game.away.abbrev === team || entry.game.home.abbrev === team;
}

/** The crew's season as month calendars: `?when=` picks the part of it, filtered by `?team=` and `?faceoffs=1`. */
export async function SeasonCalendar({ searchParams }: { searchParams: PageProps<"/schedule">["searchParams"] }) {
  const [{ crew, schedules, now }, params] = await Promise.all([loadCalendar(), searchParams]);
  if (crew.length === 0) return <EmptyCrew />;

  const view = VIEWS.find((v) => v.key === params.when) ?? VIEWS[0];
  const team = crew.find((m) => m.team === params.team)?.team ?? null;
  const faceoffsOnly = params.faceoffs === "1";
  const games = [
    ...(view.key === "ahead" ? [] : played(crew, schedules)),
    ...(view.key === "played" ? [] : onDeck(crew, schedules, { count: Infinity }).games),
  ];
  const shown = games.filter((d) => (!team || plays(d, team)) && (!faceoffsOnly || d.faceoff));

  // Days follow the NHL's Eastern-time calendar, the one `gameDate` is filed under.
  const today = easternDate(now);
  const thisWeek = addDays(today, -weekday(today));
  // Weeks that are already over drop off the top of what's ahead; weeks still to come drop off what's played.
  const span = {
    from: view.key === "ahead" ? thisWeek : null,
    to: view.key === "played" ? addDays(thisWeek, 6) : null,
  };
  const byDay = new Map<string, DeckGame[]>();
  for (const entry of shown) byDay.set(entry.game.gameDate, [...(byDay.get(entry.game.gameDate) ?? []), entry]);
  const months = [...new Set(games.map((d) => d.game.gameDate.slice(0, 7)))].map((month) => ({
    month,
    games: shown.filter((d) => d.game.gameDate.startsWith(month)),
  }));
  // Results read newest first; the schedule reads from the next game on.
  if (view.key === "played") months.reverse();
  const finals = shown.filter((d) => d.game.phase === "final");

  return (
    <>
      <ViewSwitch params={params} current={view.key} />
      <Filters crew={crew} params={params} team={team} faceoffsOnly={faceoffsOnly} />
      <nav aria-label="Months" className="mt-4 flex [scrollbar-width:none] gap-1 overflow-x-auto pb-1">
        {months.map(({ month, games }) =>
          games.length === 0 ? (
            <span key={month} className="flex shrink-0 flex-col items-center px-3 py-1 opacity-40">
              <MonthTab month={month} count={0} />
            </span>
          ) : (
            <a
              key={month}
              href={`#month-${month}`}
              className="flex shrink-0 -skew-x-12 flex-col items-center px-3 py-1 hover:bg-black/10"
            >
              <MonthTab month={month} count={games.length} />
            </a>
          ),
        )}
      </nav>
      <Legend results={view.key !== "ahead"} />
      {finals.length > 0 && (
        <section
          aria-label={faceoffsOnly ? "Crew faceoff records" : "Records so far"}
          className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2"
        >
          <span className="text-xs font-bold tracking-[0.2em] text-ink-soft uppercase">
            {faceoffsOnly ? "In crew faceoffs" : "So far"}
          </span>
          <Records crew={crew} games={finals} team={team} />
        </section>
      )}
      {shown.length === 0 ? (
        <section className="jumbotron mt-8 px-5 py-8">
          <p className="led text-center text-2xl">{view.empty}</p>
        </section>
      ) : (
        months
          .filter(({ games }) => games.length > 0)
          .map(({ month, games }) => (
            <MonthGrid
              key={month}
              month={month}
              games={games}
              byDay={byDay}
              today={today}
              span={span}
              view={view.key}
              crew={crew}
              follow={team}
            />
          ))
      )}
    </>
  );
}

function MonthTab({ month, count }: { month: string; count: number }) {
  return (
    <>
      <span className="skew-x-12 font-display text-sm tracking-wider uppercase">{monthLabel(month, true)}</span>
      <span className="skew-x-12 font-led text-lg leading-none text-ink-soft">{count}</span>
    </>
  );
}

/** This page with `patch` applied to its search params; `undefined` drops one. */
function scheduleHref(params: Params, patch: Params): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, ...patch })) {
    if (typeof value === "string") query.set(key, value);
  }
  const search = query.toString();
  return search ? `/schedule?${search}` : "/schedule";
}

/** Scoreboard tabs over the filters that pick which part of the season hangs on the wall. */
function ViewSwitch({ params, current }: { params: Params; current: View }) {
  return (
    <nav aria-label="Which games" className="mb-3 flex gap-1">
      {VIEWS.map((view) => (
        <Link
          key={view.key}
          href={scheduleHref(params, { when: view === VIEWS[0] ? undefined : view.key })}
          scroll={false}
          aria-current={view.key === current ? "true" : undefined}
          className={`-skew-x-12 px-2.5 py-1 font-display text-sm tracking-wider whitespace-nowrap uppercase sm:px-3 sm:text-base ${
            view.key === current ? "bg-boards text-led shadow-[3px_3px_0_0_var(--color-red-line)]" : "hover:bg-black/10"
          }`}
        >
          <span className="inline-block skew-x-12">{view.label}</span>
        </Link>
      ))}
    </nav>
  );
}

function Filters({
  crew,
  params,
  team,
  faceoffsOnly,
}: {
  crew: readonly CrewMember[];
  params: Params;
  team: string | null;
  faceoffsOnly: boolean;
}) {
  const teams = [...new Set(crew.map((m) => m.team))];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 bg-white/70 px-4 py-3 shadow-sm ring-1 ring-black/5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-bold tracking-[0.2em] text-ink-soft uppercase">Follow</span>
        <Chip href={scheduleHref(params, { team: undefined })} active={team === null}>
          Whole crew
        </Chip>
        {teams.map((abbrev) => {
          const { primary } = teamMeta(abbrev);
          const active = abbrev === team;
          return (
            <Chip
              key={abbrev}
              href={scheduleHref(params, { team: active ? undefined : abbrev })}
              active={active}
              style={active ? { backgroundColor: primary, color: inkOn(primary) } : undefined}
            >
              <span className="-my-1 grid size-7 shrink-0 place-items-center rounded-full bg-white ring-1 ring-black/10">
                <TeamLogo team={abbrev} size={22} />
              </span>
              {crew
                .filter((m) => m.team === abbrev)
                .map((m) => m.name)
                .join(" & ")}
            </Chip>
          );
        })}
      </div>
      <FaceoffSwitch href={scheduleHref(params, { faceoffs: faceoffsOnly ? undefined : "1" })} on={faceoffsOnly} />
    </div>
  );
}

function Chip({
  href,
  active,
  style,
  children,
}: {
  href: string;
  active: boolean;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      style={style}
      className={`-skew-x-12 px-2.5 py-1 text-sm font-bold tracking-wide uppercase ${
        active ? "bg-boards text-white shadow-[3px_3px_0_0_#000]" : "ring-1 ring-black/15 hover:bg-black/5"
      }`}
    >
      <span className="flex skew-x-12 items-center gap-1.5">{children}</span>
    </Link>
  );
}

/**
 * Not a pick like the chips but an on/off that narrows whichever one is followed,
 * so it's built like the header's spoiler switch: a scoreboard plate with a puck that slides across.
 */
function FaceoffSwitch({ href, on }: { href: string; on: boolean }) {
  return (
    <Link
      href={href}
      scroll={false}
      role="switch"
      aria-checked={on}
      className="group flex shrink-0 items-center gap-2.5 rounded-sm bg-boards py-1 pr-2 pl-1 text-white shadow-[3px_3px_0_0_var(--color-red-line)] outline-offset-4 focus-visible:outline-2 focus-visible:outline-kickplate sm:ml-auto"
    >
      <FaceoffDot
        className={`size-8 transition-[filter,opacity] duration-300 ${
          on ? "drop-shadow-[0_0_8px_rgb(212_23_42/0.9)]" : "opacity-50 grayscale group-hover:opacity-80"
        }`}
      />
      <span
        className={`text-sm font-bold tracking-wider uppercase transition-colors ${on ? "text-white" : "text-white/75 group-hover:text-white"}`}
      >
        Crew faceoffs only
      </span>
      <span
        className={`relative grid h-6 w-[3.25rem] -skew-x-12 items-center shadow-[2px_2px_0_0_#000] transition-colors ${
          on ? "bg-red-line" : "tape-white"
        }`}
      >
        <span
          className={`skew-x-12 px-1.5 font-display text-[10px] leading-none ${
            on ? "justify-self-start text-white" : "justify-self-end text-ink/70"
          }`}
        >
          {on ? "ON" : "OFF"}
        </span>
        <span
          aria-hidden="true"
          className={`absolute top-1/2 left-0.5 size-5 -translate-y-1/2 skew-x-12 rounded-full bg-[radial-gradient(circle_at_35%_30%,#3a404c,#0b0d12_62%)] shadow-[inset_0_0_0_2px_#000,0_2px_0_0_#000] transition-transform duration-300 ease-[cubic-bezier(0.2,0.9,0.3,1.2)] ${
            on ? "translate-x-[1.75rem]" : ""
          }`}
        />
      </span>
    </Link>
  );
}

function Legend({ results }: { results: boolean }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold text-ink-soft">
      <span className="flex items-center gap-2">
        <span className="size-4 bg-red-line shadow-[2px_2px_0_0_#000]" /> Crew faceoff
      </span>
      <span className="flex items-center gap-2">
        <span className="size-4 rounded-full bg-white ring-2 ring-led" /> Crew pick
      </span>
      <span className="flex items-center gap-2">
        <span className="size-4 bg-boards ring-2 ring-led ring-inset" /> Today
      </span>
      {results && <span>Scores link to highlights on nhl.com.</span>}
      <span>Days follow the NHL&apos;s Eastern-time calendar.</span>
    </div>
  );
}

/** Each pick's W-L-OT across `games`, or just the followed one's; picks with nothing played are left out. */
function Records({
  crew,
  games,
  team,
}: {
  crew: readonly CrewMember[];
  games: readonly DeckGame[];
  team: string | null;
}) {
  const teams = team ? [team] : [...new Set(crew.map((m) => m.team))];
  const records = teams
    .map((abbrev) => ({
      abbrev,
      record: recordIn(
        games.map((d) => d.game),
        abbrev,
      ),
    }))
    .filter(({ record }) => record.wins + record.losses + record.otLosses + record.taped > 0);
  return (
    <ul className="flex flex-wrap gap-2">
      {records.map(({ abbrev, record }) => {
        const owners = crew.filter((m) => m.team === abbrev);
        return (
          <li
            key={abbrev}
            className="flex items-center gap-1.5 bg-boards py-0.5 pr-2 pl-0.5 text-white shadow-[2px_2px_0_0_var(--color-red-line)]"
          >
            <span className="grid size-6 place-items-center rounded-full bg-white">
              <TeamLogo team={abbrev} size={18} />
            </span>
            <span className="font-display text-xs tracking-wider">{owners.map(shorthand).join(" & ")}</span>
            <span className="led text-lg leading-none" title="Wins, regulation losses and OT/shootout losses">
              {record.wins}-{record.losses}-{record.otLosses}
            </span>
            {record.taped > 0 && <SpoilerTape label={`+${record.taped} taped`} />}
          </li>
        );
      })}
    </ul>
  );
}

function MonthGrid({
  month,
  games,
  byDay,
  today,
  span,
  view,
  crew,
  follow,
}: {
  month: string;
  games: DeckGame[];
  byDay: ReadonlyMap<string, DeckGame[]>;
  today: string;
  /** First and last day the view shows, when it stops short of the whole month. */
  span: { from: string | null; to: string | null };
  view: View;
  crew: readonly CrewMember[];
  follow: string | null;
}) {
  const first = `${month}-01`;
  const last = addDays(`${addDays(first, 32).slice(0, 7)}-01`, -1);
  const start = addDays(first, -weekday(first));
  const end = addDays(last, 6 - weekday(last));
  const days: string[] = [];
  for (
    let day = span.from && span.from > start ? span.from : start;
    day <= (span.to && span.to < end ? span.to : end);
    day = addDays(day, 1)
  ) {
    days.push(day);
  }
  const faceoffs = games.filter((d) => d.faceoff).length;
  const finals = games.filter((d) => d.game.phase === "final");
  // Past days fade on the schedule ahead, days still to come on the results.
  const faded = (day: string) => (view === "ahead" ? day < today : view === "played" ? day > today : false);

  return (
    <section id={`month-${month}`} className="mt-10 scroll-mt-24">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-display text-2xl tracking-wide sm:text-3xl">{monthLabel(month)}</h2>
        <span className="text-sm font-semibold text-ink-soft">
          {games.length} game{games.length === 1 ? "" : "s"} · {faceoffs} crew faceoff{faceoffs === 1 ? "" : "s"}
        </span>
        {view !== "ahead" && finals.length > 0 && (
          <div className="w-full">
            <Records crew={crew} games={finals} team={follow} />
          </div>
        )}
      </div>
      <div className="jumbotron px-1.5 pt-5 pb-1.5 sm:px-3 sm:pb-3">
        <div className="grid grid-cols-7 gap-px pb-1 text-center text-[11px] font-bold tracking-[0.2em] text-white/45 uppercase">
          {WEEKDAYS.map((d) => (
            <span key={d}>
              <span className="sm:hidden">{d.charAt(0)}</span>
              <span className="hidden sm:inline">{d}</span>
            </span>
          ))}
        </div>
        <ol className="grid grid-cols-7 gap-px bg-white/10 ring-1 ring-white/10">
          {days.map((day) => (
            <Day
              key={day}
              day={day}
              entries={byDay.get(day) ?? []}
              outside={!day.startsWith(month)}
              today={today}
              faded={faded(day)}
              follow={follow}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}

function Day({
  day,
  entries,
  outside,
  today,
  faded,
  follow,
}: {
  day: string;
  entries: DeckGame[];
  outside: boolean;
  today: string;
  faded: boolean;
  follow: string | null;
}) {
  return (
    <li
      className={`min-h-16 min-w-0 p-0.5 sm:min-h-24 sm:p-1.5 ${outside ? "bg-boards/60" : "bg-boards"} ${
        day === today ? "ring-2 ring-led ring-inset" : ""
      }`}
    >
      {!outside && (
        <>
          <span className={`led block text-lg leading-none ${faded ? "opacity-40" : ""}`}>{Number(day.slice(8))}</span>
          <ul className="mt-1 flex flex-col gap-0.5 lg:gap-px">
            {entries.map((entry) => (
              <CalendarGame key={entry.game.id} entry={entry} follow={follow} />
            ))}
          </ul>
        </>
      )}
    </li>
  );
}

const EDGE = {
  W: "border-l-goal",
  L: "border-l-ink-soft",
  OTL: "border-l-blue-line",
} as const satisfies Record<Result, string>;

/**
 * Both teams, away @ home, with the score in place of the @ once it's final. From lg up each side
 * carries its abbreviation; below that the logos stand alone, and on a phone the score drops under them.
 * Crew picks are ringed, and every logo shows the team's nameplate on hover.
 * Following one pick, the edge tells how each of its games went.
 */
function CalendarGame({ entry, follow }: { entry: DeckGame; follow: string | null }) {
  const { game, away, home, faceoff } = entry;
  const final = game.phase === "final";
  const result = follow ? resultFor(game, follow) : null;
  return (
    <li
      className={`flex min-w-0 items-center text-[11px] leading-5 font-bold tracking-wide sm:px-0.5 lg:px-1 ${
        faceoff ? "bg-red-line shadow-[2px_2px_0_0_#000]" : "bg-white/5"
      } ${result ? `border-l-2 ${EDGE[result]}` : ""}`}
    >
      <span className="flex w-full flex-wrap items-center justify-center gap-x-0.5 py-0.5 lg:hidden">
        <Logo side={game.away} owners={away} />
        <span className={`text-[9px] leading-none text-white/40 ${final ? "sm:hidden" : ""}`}>@</span>
        {final && (
          <span className="order-last basis-full text-center sm:order-none sm:basis-auto">
            <Score game={game} compact />
          </span>
        )}
        <Logo side={game.home} owners={home} />
      </span>
      <span className="hidden min-w-0 items-center gap-1 lg:flex">
        <Side side={game.away} owners={away} />
        {final ? <Score game={game} /> : <span className="text-white/40">@</span>}
        <Side side={game.home} owners={home} />
      </span>
    </li>
  );
}

function Logo({ side, owners }: { side: GameSide; owners: readonly CrewMember[] }) {
  const crew = owners.length > 0;
  return (
    <TeamTooltip team={side.abbrev} detail={pickOf(owners)} underline={false}>
      <span
        className={`grid size-3.5 shrink-0 place-items-center rounded-full bg-white sm:size-5 md:size-6 ${
          crew ? "ring-1 ring-led" : "opacity-60"
        }`}
      >
        <TeamLogo team={side.abbrev} size={18} className="size-3 sm:size-4 md:size-5" />
      </span>
    </TeamTooltip>
  );
}

/** "3–2" with the winner's goals lit, linked to the best highlights there are; taped while it could spoil. */
function Score({ game, compact = false }: { game: Game; compact?: boolean }) {
  if (game.hidden) {
    return compact ? (
      <span role="img" aria-label="Score taped" className="spoiler-tape inline-block h-2.5 w-4 -rotate-6" />
    ) : (
      <SpoilerTape label="Taped" />
    );
  }
  const [away, home] = [game.away.score ?? 0, game.home.score ?? 0];
  const ending = game.periodType === "OT" || game.periodType === "SO" ? `/${game.periodType}` : "";
  const best = highlightsFor(game)[0];
  const digits = (
    <>
      <span className={away > home ? "text-led" : "text-white/55"}>{away}</span>
      <span className="text-white/40">–</span>
      <span className={home > away ? "text-led" : "text-white/55"}>{home}</span>
      {ending && !compact && <span className="ml-px align-super text-[8px] text-white/55">{game.periodType}</span>}
    </>
  );
  const label = `${game.away.abbrev} ${away}, ${game.home.abbrev} ${home}, final${ending}`;
  if (!best) {
    return (
      <span aria-label={label} className={`font-led leading-none whitespace-nowrap ${compact ? "text-xs" : "text-sm"}`}>
        {digits}
      </span>
    );
  }
  return (
    <a
      href={best.url}
      target="_blank"
      rel="noopener noreferrer"
      title={`${best.label}: ${best.description} on nhl.com`}
      aria-label={`${label}. ${best.label} on nhl.com`}
      className={`rounded-sm px-0.5 font-led leading-none whitespace-nowrap hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-led ${compact ? "text-xs" : "text-sm"}`}
    >
      {digits}
    </a>
  );
}

function pickOf(owners: readonly CrewMember[]): string | null {
  return owners.length > 0 ? `${owners.map((m) => m.name).join(" & ")}'s pick` : null;
}

function Side({ side, owners }: { side: GameSide; owners: readonly CrewMember[] }) {
  const crew = owners.length > 0;
  return (
    <TeamTooltip
      team={side.abbrev}
      detail={pickOf(owners)}
      underline={false}
      className={`flex items-center gap-0.5 ${crew ? "text-white" : "text-white/45"}`}
    >
      <span
        className={`grid size-4 shrink-0 place-items-center rounded-full bg-white ${crew ? "ring-1 ring-led" : "opacity-60"}`}
      >
        <TeamLogo team={side.abbrev} size={13} />
      </span>
      {side.abbrev}
    </TeamTooltip>
  );
}
