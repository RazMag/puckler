import type { CrewMember } from "@/lib/crew/types";
import { initials } from "@/lib/domain/crew-standings";
import { resultFor } from "@/lib/domain/faceoffs";
import { highlightsFor } from "@/lib/nhl/highlights";
import type { Game, GameSide } from "@/lib/nhl/types";
import { HighlightLinks } from "./HighlightLinks";
import { LocalTime } from "./LocalTime";
import { TeamLogo } from "./TeamLogo";
import { Term } from "./Term";

function statusLabel(game: Game) {
  if (game.phase === "live") {
    const period =
      game.periodType === "OT" ? "OT" : game.periodType === "SO" ? "SO" : game.period ? `P${game.period}` : "";
    return (
      <span className="flex items-center gap-1.5 text-goal">
        <span className="size-2 animate-live rounded-full bg-goal" />
        LIVE {period}
      </span>
    );
  }
  if (game.phase === "final") {
    if (game.periodType === "OT") return <Term term="finalOt">FINAL/OT</Term>;
    if (game.periodType === "SO") return <Term term="finalSo">FINAL/SO</Term>;
    return "FINAL";
  }
  return <LocalTime iso={game.startTimeUTC} />;
}

/** A broadcast-style score bug. `focus` is the team whose result tints the edge. */
export function GameCard({
  game,
  focus,
  owners,
}: {
  game: Game;
  focus?: string;
  owners: ReadonlyMap<string, CrewMember>;
}) {
  const result = focus ? resultFor(game, focus) : null;
  const edge =
    result === "W"
      ? "border-l-goal"
      : result === "OTL"
        ? "border-l-blue-line"
        : result === "L"
          ? "border-l-ink-soft"
          : "border-l-led";
  const showScores = game.phase !== "upcoming";

  const row = (side: GameSide, where: "@" | "") => {
    const owner = owners.get(side.abbrev);
    const won =
      game.phase === "final" &&
      side.score !== null &&
      side.score > (side === game.home ? (game.away.score ?? 0) : (game.home.score ?? 0));
    return (
      <div className="flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-full bg-white">
          <TeamLogo team={side.abbrev} size={22} />
        </span>
        <span className={`font-bold tracking-wide ${won ? "text-white" : "text-white/70"}`}>
          {where && <span className="mr-1 text-white/40">@</span>}
          {side.abbrev}
        </span>
        {owner && (
          <span className="-skew-x-12 bg-red-line px-1 font-display text-[10px] leading-tight text-white">
            {initials(owner.name)}
          </span>
        )}
        {showScores && (
          <span className={`led ml-auto text-3xl leading-none ${won ? "" : "opacity-60"}`}>{side.score ?? 0}</span>
        )}
      </div>
    );
  };

  return (
    <article className={`jumbotron border-l-[6px] px-3 pt-4 pb-2 text-sm ${edge}`}>
      <div className="space-y-1">
        {row(game.away, "")}
        {row(game.home, "@")}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/10 pt-1.5 text-xs font-semibold tracking-wider text-white/60 uppercase">
        <span>{statusLabel(game)}</span>
        {result && (
          <span className={result === "W" ? "text-goal" : "text-white/70"}>
            {focus} {result}
          </span>
        )}
      </div>
      {highlightsFor(game).length > 0 && (
        <div className="mt-2">
          <HighlightLinks game={game} />
        </div>
      )}
    </article>
  );
}
