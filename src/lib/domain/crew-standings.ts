import type { CrewMember } from "@/lib/crew/types";
import { POINTS_PER_WIN, SEASON_GAMES } from "@/lib/nhl/league";
import type { TeamStanding } from "@/lib/nhl/types";
import { playoffStatus, type PlayoffStatus } from "./division";

export type CrewRow = {
  rank: number;
  member: CrewMember;
  team: TeamStanding;
  pointsBehindLeader: number;
  /** Points over a full season at the current points percentage. */
  projectedPoints: number;
  playoff: PlayoffStatus;
};

/**
 * Crew members ranked by their team's league position. The NHL's own league
 * order already applies the official tiebreakers (points %, regulation wins…).
 * Members whose team isn't in the standings are dropped.
 */
export function rankCrew(crew: readonly CrewMember[], standings: readonly TeamStanding[]): CrewRow[] {
  const byAbbrev = new Map(standings.map((t) => [t.abbrev, t]));
  const joined = crew
    .flatMap((member) => {
      const team = byAbbrev.get(member.team);
      return team ? [{ member, team }] : [];
    })
    .sort((a, b) => a.team.leagueRank - b.team.leagueRank);

  const leaderPoints = joined[0]?.team.points ?? 0;
  return joined.map(({ member, team }, i) => ({
    rank: i + 1,
    member,
    team,
    pointsBehindLeader: leaderPoints - team.points,
    projectedPoints: Math.round(team.pointPct * SEASON_GAMES * POINTS_PER_WIN),
    playoff: playoffStatus(team, standings),
  }));
}

/** Owner lookup by team abbreviation. */
export function ownersByTeam(crew: readonly CrewMember[]): Map<string, CrewMember> {
  return new Map(crew.map((m) => [m.team, m]));
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0]!.charAt(0) + parts.at(-1)!.charAt(0) : name.trim().slice(0, 2);
  return letters.toUpperCase();
}
