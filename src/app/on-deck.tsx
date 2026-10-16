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
  // Side by side on wide screens: earliest games down the left, the rest down the right.
  // Each column starts with its date showing.
  const half = Math.ceil(games.length / 2);
  const columns = [games.slice(0, half), games.slice(half)].filter((column) => column.length > 0);

  return (
    <section className="jumbotron px-3 pt-6 pb-1 sm:px-5">
      {games.length === 0 ? (
        <p className="led py-6 text-center text-2xl">SEASON&apos;S OVER · SEE YOU IN OCTOBER</p>
      ) : (
        <div className="grid gap-x-10 xl:grid-cols-2">
          {columns.map((column, c) => (
            <div key={c}>
              <BoardHeader className={c > 0 ? "hidden xl:grid" : ""} />
              <ol>
                {column.map((entry, i) => (
                  <DeckRow key={entry.game.id} entry={entry} after={column[i - 1]?.game} />
                ))}
              </ol>
            </div>
          ))}
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

function BoardHeader({ className = "" }: { className?: string }) {
  return (
    <div
      className={`grid grid-cols-[5.5rem_1fr] gap-3 border-b-2 border-led/30 pb-1 text-[11px] font-bold tracking-[0.2em] text-white/45 uppercase sm:grid-cols-[9rem_1fr] ${className}`}
    >
      <span>Puck drop</span>
      <span>Matchup</span>
    </div>
  );
}

/** `after` is the game listed before this one, so a day's date only shows on its first game. */
function DeckRow({ entry, after }: { entry: DeckGame; after?: Game }) {
  const { game, away, home, faceoff, series } = entry;
  return (
    <li
      className={`relative -mx-3 grid grid-cols-[5.5rem_1fr] items-center gap-x-3 border-b border-white/10 px-3 py-1.5 last:border-b-0 sm:-mx-5 sm:grid-cols-[9rem_1fr] sm:px-5 ${
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
