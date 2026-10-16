import { FaceoffDot } from "@/components/FaceoffDot";
import { LocalDay, LocalTime } from "@/components/LocalTime";
import { SpoilerTape } from "@/components/SpoilerTape";
import { TeamLogo } from "@/components/TeamLogo";
import { TeamTooltip } from "@/components/TeamTooltip";
import { Term } from "@/components/Term";
import type { CrewMember } from "@/lib/crew/types";
import { loadSchedules } from "@/lib/data";
import { initials } from "@/lib/domain/crew-standings";
import { onDeck, seriesText, type DeckGame } from "@/lib/domain/faceoffs";
import { inkOn, teamMeta } from "@/lib/nhl/teams";
import type { Game, GameSide } from "@/lib/nhl/types";

export const ON_DECK_COUNT = 12;

/** The crew's next games as one arena schedule board, crew faceoffs lit up in red. */
export async function OnDeck({ crew }: { crew: readonly CrewMember[] }) {
  const { games, nextFaceoff } = onDeck(crew, await loadSchedules(crew.map((m) => m.team)), { count: ON_DECK_COUNT });
  // Side by side on wide screens: earliest games down the left, the rest down the right,
  // with the route between them showing the way. Each column starts with its date showing.
  const half = Math.ceil(games.length / 2);
  const [left, right] = [games.slice(0, half), games.slice(half)];
  const split = right.length > 0;

  return (
    <section className="jumbotron px-3 pt-6 pb-1 sm:px-5">
      {games.length === 0 ? (
        <p className="led py-6 text-center text-2xl">SEASON&apos;S OVER · SEE YOU IN OCTOBER</p>
      ) : (
        <div className="grid xl:grid-cols-[1fr_6rem_1fr]">
          <BoardHeader className="xl:col-start-1 xl:row-start-1" />
          {split && <BoardHeader hidden className="hidden xl:col-start-3 xl:row-start-1 xl:grid" />}
          <ol className="xl:col-start-1 xl:row-start-2">
            {left.map((entry, i) => (
              <DeckRow key={entry.game.id} entry={entry} after={left[i - 1]?.game} side={split ? "left" : undefined} />
            ))}
          </ol>
          {split && (
            <>
              {/* Rows are near enough one height that game counts place the end of the line. */}
              <Route end={right.length / left.length} />
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
          <p className="led border-t-2 border-led/30 pt-1.5 text-center text-lg leading-none tracking-[0.3em] uppercase">
            ▼ Next crew faceoff ▼
          </p>
          <ol>
            <DeckRow entry={nextFaceoff} />
          </ol>
        </>
      )}
    </section>
  );
}

function BoardHeader({ className = "", hidden = false }: { className?: string; hidden?: boolean }) {
  return (
    <div
      aria-hidden={hidden || undefined}
      className={`grid grid-cols-[5.5rem_1fr] gap-3 border-b-2 border-led/30 pb-1 text-[11px] font-bold tracking-[0.2em] text-white/45 uppercase sm:grid-cols-[9rem_1fr] ${className}`}
    >
      <span>Puck drop</span>
      <span>Matchup</span>
    </div>
  );
}

/*
 * The reading order between the two columns as one skating line: from the
 * puck down the left column, a sweeping turn up across the gutter, then down
 * the right column to the arrow. The viewBox is as wide as the 6rem gutter, so
 * only its height stretches, and the stroke keeps its width while it does.
 */
const LEFT_X = 18;
const RIGHT_X = 78;

/** `end` is how far down the gutter the right column reaches, from 0 to 1. */
function Route({ end }: { end: number }) {
  const bottom = 100 * end;
  // Straight down each column, rounded corners at the bottom and top of the climb across.
  const d = `M${LEFT_X} 0 V86 Q${LEFT_X} 100 ${LEFT_X + 14} 90 L${RIGHT_X - 14} 10 Q${RIGHT_X} 0 ${RIGHT_X} 14 V${bottom}`;
  return (
    <div aria-hidden="true" className="relative hidden xl:col-start-2 xl:row-start-2 xl:block">
      <div className="absolute inset-x-0 inset-y-3">
        <svg
          viewBox="0 0 96 100"
          preserveAspectRatio="none"
          className="absolute inset-0 size-full overflow-visible drop-shadow-[0_0_6px_rgb(212_23_42/0.9)]"
        >
          <path
            d={d}
            fill="none"
            stroke="var(--color-red-line)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <span
          className="absolute -translate-x-1/2 border-x-[7px] border-t-[11px] border-x-transparent border-t-red-line drop-shadow-[0_0_4px_rgb(212_23_42/0.9)]"
          style={{ left: RIGHT_X, top: `calc(${bottom}% - 11px)` }}
        />
        <span
          className="absolute top-0 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_35%_30%,#3a404c,#0b0d12_62%)] shadow-[0_0_0_2px_rgb(255_255_255/0.75),0_2px_0_0_#000]"
          style={{ left: LEFT_X }}
        />
      </div>
    </div>
  );
}

/** `after` is the game listed before this one, so a day's date only shows on its first game. */
function DeckRow({ entry, after, side }: { entry: DeckGame; after?: Game; side?: "left" | "right" }) {
  const { game, away, home, faceoff, series } = entry;
  return (
    <li
      className={`relative -mx-3 grid grid-cols-[5.5rem_1fr] items-center gap-x-3 border-b border-white/10 px-3 py-1.5 last:border-b-0 sm:-mx-5 sm:grid-cols-[9rem_1fr] sm:px-5 ${
        // Side by side, rows stop at the gutter so the route stays clear.
        side === "left" ? "xl:mr-0 xl:pr-3" : side === "right" ? "xl:ml-0 xl:pl-4" : ""
      } ${
        faceoff
          ? "bg-[linear-gradient(90deg,rgb(212_23_42/0.45),rgb(212_23_42/0.12)_55%,transparent)] shadow-[inset_6px_0_0_0_var(--color-red-line),inset_0_1px_0_0_rgb(212_23_42/0.8),inset_0_-1px_0_0_rgb(212_23_42/0.8)]"
          : ""
      }`}
    >
      <When game={game} after={after} />

      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 sm:gap-x-3">
        <Plate side={game.away} owners={away} />
        {faceoff ? (
          <FaceoffDot className="-my-1 size-7 shrink-0 drop-shadow-[0_0_8px_rgb(212_23_42/0.8)] sm:size-8" />
        ) : (
          <span className="font-display text-xs text-white/35 sm:text-base">@</span>
        )}
        <Plate side={game.home} owners={home} />
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

/** One side of the matchup: logo, abbreviation and a name bar in team colors for each crew pick. */
function Plate({ side, owners }: { side: GameSide; owners: readonly CrewMember[] }) {
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
          className="inline-block max-w-28 shrink-0 -skew-x-12 truncate px-1.5 font-display text-[11px] leading-5 shadow-[2px_2px_0_0_#000]"
          style={{ backgroundColor: primary, color: inkOn(primary) }}
        >
          {/* Initials on a phone, so both teams fit on one line. */}
          <span className="sm:hidden">{initials(member.name)}</span>
          <span className="hidden sm:inline">{member.name}</span>
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
