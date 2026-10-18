import Link from "next/link";
import type { ReactNode } from "react";
import { FaceoffDot } from "@/components/FaceoffDot";
import { LocalDay, LocalTime } from "@/components/LocalTime";
import { SpoilerTape } from "@/components/SpoilerTape";
import { TeamLogo } from "@/components/TeamLogo";
import { TeamTooltip } from "@/components/TeamTooltip";
import { Term } from "@/components/Term";
import type { CrewMember } from "@/lib/crew/types";
import { loadUpcoming } from "@/lib/data";
import { shorthand } from "@/lib/domain/crew-standings";
import { onDeck, seriesText, type Deck, type DeckGame } from "@/lib/domain/faceoffs";
import { inkOn, teamMeta } from "@/lib/nhl/teams";
import type { Game, GameSide } from "@/lib/nhl/types";

export const ON_DECK_COUNT = 12;

/** How far ahead the board looks: the next dozen games, or every game in the next few days. */
export const DECK_RANGES = [
  { key: "next", label: `Next ${ON_DECK_COUNT}`, days: null },
  { key: "7d", label: "7 days", days: 7 },
  { key: "14d", label: "14 days", days: 14 },
  { key: "30d", label: "30 days", days: 30 },
] as const;

export type DeckRange = (typeof DECK_RANGES)[number];

/** The range a `?deck=` search param asks for, the next dozen games by default. */
export function deckRange(param: string | string[] | undefined): DeckRange {
  return DECK_RANGES.find((r) => r.key === param) ?? DECK_RANGES[0];
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** The crew's next games as one arena schedule board, crew faceoffs lit up in red. */
export async function OnDeck({ crew, range }: { crew: readonly CrewMember[]; range: DeckRange }) {
  const { schedules, now } = await loadUpcoming(crew.map((m) => m.team));
  const deck = onDeck(
    crew,
    schedules,
    range.days === null ? { count: ON_DECK_COUNT } : { until: new Date(now.getTime() + range.days * DAY_MS) },
  );
  const shown = deck.games.length;
  return (
    <DeckBoard deck={deck} empty={deck.left > 0 ? `NO CREW GAMES IN THE NEXT ${range.days} DAYS` : undefined}>
      {deck.left > 0 && (
        <div className="-mx-3 mt-1 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t-2 border-led/30 px-3 pt-2 pb-1.5 text-[11px] font-bold tracking-[0.2em] text-white/45 uppercase sm:-mx-5 sm:px-5">
          <span>
            {range.days === null
              ? `Next ${shown} of ${deck.left} crew games`
              : `${shown} crew game${shown === 1 ? "" : "s"} in the next ${range.days} days`}{" "}
            · times in your time zone
          </span>
          <Link
            href="/schedule"
            className="-skew-x-12 bg-red-line px-2.5 py-1 font-display text-xs tracking-wider text-white normal-case shadow-[3px_3px_0_0_#000] hover:brightness-110"
          >
            <span className="inline-block skew-x-12">Full schedule →</span>
          </Link>
        </div>
      )}
    </DeckBoard>
  );
}

/** Tabs beside the On Deck heading that set how far ahead the board looks. */
export function DeckRangeSwitch({ current }: { current: DeckRange }) {
  return (
    <nav aria-label="How far ahead" className="flex gap-1">
      {DECK_RANGES.map((range) => (
        <Link
          key={range.key}
          href={range === DECK_RANGES[0] ? "/" : `/?deck=${range.key}`}
          scroll={false}
          aria-current={range.key === current.key ? "true" : undefined}
          className={`-skew-x-12 px-2 py-0.5 text-sm font-bold tracking-wide uppercase ${
            range.key === current.key
              ? "bg-boards text-led shadow-[2px_2px_0_0_var(--color-red-line)]"
              : "hover:bg-black/10"
          }`}
        >
          <span className="inline-block skew-x-12">{range.label}</span>
        </Link>
      ))}
    </nav>
  );
}

/** The schedule board for any run of games; `children` go along the bottom edge. */
function DeckBoard({
  deck: { games, nextFaceoff },
  empty = "SEASON'S OVER · SEE YOU IN OCTOBER",
  children,
}: {
  deck: Deck;
  empty?: string;
  children?: ReactNode;
}) {
  // Side by side on wide screens: earliest games down the left, the rest down the right,
  // with the route between them showing the way. Each column starts with its date showing.
  const half = Math.ceil(games.length / 2);
  const [left, right] = [games.slice(0, half), games.slice(half)];
  const split = right.length > 0;

  return (
    <section className="jumbotron px-3 pt-6 pb-1 sm:px-5">
      {games.length === 0 ? (
        <p className="led py-6 text-center text-2xl">{empty}</p>
      ) : (
        <div className="grid xl:grid-cols-[1fr_8rem_1fr]">
          <BoardHeader side={split ? "left" : undefined} className="xl:col-start-1 xl:row-start-1" />
          {split && <BoardHeader hidden side="right" className="hidden xl:col-start-3 xl:row-start-1 xl:grid" />}
          <ol className="xl:col-start-1 xl:row-start-2">
            {left.map((entry, i) => (
              <DeckRow key={entry.game.id} entry={entry} after={left[i - 1]?.game} side={split ? "left" : undefined} />
            ))}
          </ol>
          {split && (
            <>
              <Route rows={left.length} endRows={right.length} />
              <div className="border-t border-white/10 xl:col-start-3 xl:row-start-2 xl:border-t-0">
                <ol>
                  {right.map((entry, i) => (
                    <DeckRow key={entry.game.id} entry={entry} after={right[i - 1]?.game} side="right" />
                  ))}
                </ol>
              </div>
            </>
          )}
        </div>
      )}
      {nextFaceoff && (
        <>
          <p className="led -mx-3 border-t-2 border-led/30 px-3 pt-1.5 text-center text-lg leading-none tracking-[0.3em] uppercase sm:-mx-5 sm:px-5">
            ▼ Next crew faceoff ▼
          </p>
          <ol>
            <DeckRow entry={nextFaceoff} />
          </ol>
        </>
      )}
      {children}
    </section>
  );
}

/** Column labels over the rows, its rule running as far as the row lines below it. */
function BoardHeader({
  side,
  className = "",
  hidden = false,
}: {
  side?: "left" | "right";
  className?: string;
  hidden?: boolean;
}) {
  return (
    <div
      aria-hidden={hidden || undefined}
      className={`-mx-3 grid grid-cols-[5.5rem_1fr] gap-3 border-b-2 border-led/30 px-3 pb-1 text-[11px] font-bold tracking-[0.2em] text-white/45 uppercase sm:-mx-5 sm:grid-cols-[9rem_1fr] sm:px-5 ${SIDE_INSET[side ?? "none"]} ${className}`}
    >
      <span>Puck drop</span>
      <span>Matchup</span>
    </div>
  );
}

/*
 * The reading order between the two columns as one skating line: from the
 * puck down the left column, a round turn at the bottom, one straight climb
 * across the gutter, a round turn at the top, then down the right column to
 * the arrow. The path is drawn at about its real pixel size, from the row
 * count, so the turns stay circular once it stretches to the gutter's height.
 */
const GUTTER = 128;
const LEFT_X = 20;
const RIGHT_X = 108;
const TURN_RADIUS = 20;
const ROW_HEIGHT = 45;

/** Angle of the climb from vertical, so it leaves the bottom turn and meets the top one without a kink. */
function climbAngle(span: number, rise: number, r: number): number {
  // Wider angle: the arcs take more room across and less up; bisect for where the climb fits exactly.
  const gap = (phi: number) => span - 2 * r * (1 + Math.cos(phi)) - Math.tan(phi) * (rise + 2 * r * Math.sin(phi));
  let [lo, hi] = [0, Math.PI / 2 - 0.01];
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (gap(mid) > 0) lo = mid;
    else hi = mid;
  }
  return lo;
}

/** `rows` games down the left column, `endRows` down the right. */
function Route({ rows, endRows }: { rows: number; endRows: number }) {
  const height = Math.max(rows * ROW_HEIGHT - 24, 120);
  const r = TURN_RADIUS;
  const [down, up] = [height - r, r];
  const bottom = Math.max(up, (height * endRows) / rows);
  const phi = climbAngle(RIGHT_X - LEFT_X, down - up, r);
  const [cos, sin] = [Math.cos(phi), Math.sin(phi)];
  const d = [
    `M${LEFT_X} 0`,
    `V${down}`,
    `A${r} ${r} 0 0 0 ${LEFT_X + r * (1 + cos)} ${down + r * sin}`,
    `L${RIGHT_X - r * (1 + cos)} ${up - r * sin}`,
    `A${r} ${r} 0 0 1 ${RIGHT_X} ${up}`,
    // Stop inside the arrowhead's wide end, so the line never pokes out past its tip.
    `V${bottom - 7}`,
  ].join(" ");
  return (
    <div aria-hidden="true" className="relative hidden xl:col-start-2 xl:row-start-2 xl:block">
      <div className="absolute inset-x-0 inset-y-3">
        <svg
          viewBox={`0 0 ${GUTTER} ${height}`}
          preserveAspectRatio="none"
          className="absolute inset-0 size-full overflow-visible drop-shadow-[0_0_6px_rgb(212_23_42/0.9)]"
        >
          <path
            d={d}
            fill="none"
            stroke="var(--color-red-line)"
            strokeWidth="3"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <span
          className="absolute -translate-x-1/2 border-x-[7px] border-t-[11px] border-x-transparent border-t-red-line drop-shadow-[0_0_4px_rgb(212_23_42/0.9)]"
          style={{ left: RIGHT_X, top: `calc(${(100 * bottom) / height}% - 11px)` }}
        />
        <span
          className="absolute top-0 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_35%_30%,#3a404c,#0b0d12_62%)] shadow-[0_0_0_2px_rgb(255_255_255/0.75),0_2px_0_0_#000]"
          style={{ left: LEFT_X }}
        />
      </div>
    </div>
  );
}

// Side by side, rows and headers stop at the gutter so the route stays clear.
const SIDE_INSET = { left: "xl:mr-0 xl:pr-3", right: "xl:ml-0 xl:pl-4", none: "" } as const;

/** `after` is the game listed before this one, so a day's date only shows on its first game. */
function DeckRow({ entry, after, side }: { entry: DeckGame; after?: Game; side?: "left" | "right" }) {
  const { game, away, home, faceoff, series } = entry;
  // A live score beside a single pick should stay on the matchup's line.
  const tight = game.phase === "live" && !faceoff;
  return (
    <li
      className={`relative -mx-3 grid grid-cols-[5.5rem_1fr] items-center gap-x-3 border-b border-white/10 px-3 py-1.5 last:border-b-0 sm:-mx-5 sm:grid-cols-[9rem_1fr] sm:px-5 ${SIDE_INSET[side ?? "none"]} ${
        faceoff
          ? "bg-[linear-gradient(90deg,rgb(212_23_42/0.45),rgb(212_23_42/0.12)_55%,transparent)] shadow-[inset_6px_0_0_0_var(--color-red-line),inset_0_1px_0_0_rgb(212_23_42/0.8),inset_0_-1px_0_0_rgb(212_23_42/0.8)]"
          : ""
      }`}
    >
      <When game={game} after={after} />

      <div
        className={`@container flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 sm:gap-x-3 ${tight ? "sm:flex-nowrap" : ""}`}
      >
        <Plate side={game.away} owners={away} tight={tight} />
        {faceoff ? (
          <FaceoffDot className="-my-1 size-7 shrink-0 drop-shadow-[0_0_8px_rgb(212_23_42/0.8)] sm:size-8" />
        ) : (
          <span className="font-display text-xs text-white/35 sm:text-base">@</span>
        )}
        <Plate side={game.home} owners={home} tight={tight} />
        {(faceoff || game.phase === "live") && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:ml-auto">
            {game.phase === "live" && <LiveScore game={game} />}
            {faceoff && (
              <>
                <span className="-skew-x-12 bg-red-line px-2 py-0.5 font-display text-xs tracking-wider text-white shadow-[3px_3px_0_0_#000]">
                  <span className="inline-block skew-x-12">Crew faceoff</span>
                </span>
                {series && (
                  <Term term="series" className="text-xs font-bold tracking-wider text-white/75 uppercase">
                    {seriesText(series)}
                  </Term>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

/** LED day and start time in the viewer's zone, on one line from sm up, or a breathing LIVE light. */
function When({ game, after }: { game: Game; after?: Game }) {
  if (game.phase === "live") {
    const period =
      game.periodType === "OT" ? "OT" : game.periodType === "SO" ? "SO" : game.period ? `P${game.period}` : "";
    return (
      <div className="flex items-center gap-1.5 font-led text-2xl leading-none text-goal">
        <span className="size-2.5 animate-live rounded-full bg-goal shadow-[0_0_10px_2px_rgb(255_38_38/0.7)]" />
        LIVE
        {period && <span className="text-white/60">{period}</span>}
      </div>
    );
  }
  return (
    <div className="led flex flex-col leading-none uppercase sm:flex-row sm:items-baseline sm:gap-2">
      <span className="text-base opacity-75 empty:hidden sm:w-14 sm:text-lg sm:empty:block">
        <LocalDay
          iso={game.startTimeUTC}
          after={after?.phase === "upcoming" ? after.startTimeUTC : undefined}
          format="day"
        />
      </span>
      <span className="text-xl sm:text-2xl">
        <LocalTime iso={game.startTimeUTC} format="time" />
      </span>
    </div>
  );
}

/**
 * One side of the matchup: logo, abbreviation and a name bar in team colors for each crew pick.
 * `tight` rows switch to shorthand by the matchup's width rather than the screen's.
 */
function Plate({ side, owners, tight }: { side: GameSide; owners: readonly CrewMember[]; tight: boolean }) {
  const crew = owners.length > 0;
  const { primary } = teamMeta(side.abbrev);
  return (
    <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
      <span
        className={`grid size-7 shrink-0 place-items-center rounded-full bg-white ${crew ? "ring-2 ring-led/70" : "opacity-70"}`}
      >
        <TeamLogo team={side.abbrev} size={22} />
      </span>
      <TeamTooltip
        team={side.abbrev}
        detail={crew && `${owners.map((m) => m.name).join(" & ")}'s pick`}
        className={`font-bold tracking-wide ${crew ? "text-white" : "text-white/55"}`}
      >
        {side.abbrev}
      </TeamTooltip>
      {owners.map((member) => (
        <span
          key={member.id}
          className="inline-block max-w-28 min-w-0 -skew-x-12 truncate px-1.5 font-display text-[11px] leading-5 shadow-[2px_2px_0_0_#000]"
          style={{ backgroundColor: primary, color: inkOn(primary) }}
        >
          {/* Shorthand on a phone, so both teams fit on one line. */}
          <span className={tight ? "@sm:hidden" : "sm:hidden"}>{shorthand(member)}</span>
          <span className={tight ? "hidden @sm:inline" : "hidden sm:inline"}>{member.name}</span>
        </span>
      ))}
    </div>
  );
}

function LiveScore({ game }: { game: Game }) {
  if (game.hidden) return <SpoilerTape label="Score taped" />;
  return (
    <span className="led text-3xl leading-none">
      {game.away.score ?? 0}–{game.home.score ?? 0}
    </span>
  );
}
