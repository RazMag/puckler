import type { CrewMember } from "@/lib/crew/types";
import { opponentOf } from "@/lib/domain/faceoffs";
import type { Game } from "@/lib/nhl/types";
import { LocalTime } from "./LocalTime";
import { TeamLogo } from "./TeamLogo";
import { TeamTooltip } from "./TeamTooltip";
import { Tooltip } from "./Tooltip";

/** One upcoming game from `team`'s side: opponent, a crew-clash tag and the local start time. */
export function UpcomingRow({
  game,
  team,
  owners,
}: {
  game: Game;
  team: string;
  owners: ReadonlyMap<string, CrewMember>;
}) {
  const opponent = opponentOf(game, team);
  const rival = owners.get(opponent);
  return (
    <li className="flex items-center gap-2 py-1.5 text-sm">
      <span className="w-4 text-ink-soft">{game.home.abbrev === team ? "vs" : "@"}</span>
      <TeamLogo team={opponent} size={20} />
      <TeamTooltip team={opponent} detail={rival && `${rival.name}'s pick`} className="font-semibold">
        {opponent}
      </TeamTooltip>
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
