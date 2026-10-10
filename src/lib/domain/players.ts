import type { CrewMember } from "@/lib/crew/types";
import type { Injury } from "@/lib/espn/injuries";
import type { BoxScore, Goalie, RosterPlayer, Skater, TeamStats } from "@/lib/nhl/types";

/** How many of the team's latest games count as "recent". */
export const RECENT_GAMES = 5;
/** Top scorers shown per team. */
export const LEADER_COUNT = 5;
/** Consecutive games with a point that make a skater hot. */
export const HOT_STREAK = 3;

export type RecentForm = {
  /** Points in each of the team's recent games, oldest first; null when the player didn't dress. */
  perGame: (number | null)[];
  games: number;
  goals: number;
  assists: number;
  points: number;
  /** Games in a row with a point, counting back from the latest one played (capped by the window). */
  pointStreak: number;
};

export type SkaterRow = Skater & { number: number | null; recent: RecentForm; injury: Injury | null };
export type GoalieRow = Goalie & { number: number | null; injury: Injury | null };

export type InjuryRow = Injury & {
  playerId: number | null;
  number: number | null;
  headshot: string | null;
  /** One of the team's top scorers or its starting goalie. */
  keyPlayer: boolean;
};

/** Everything the players page shows for one team. */
export type TeamPlayers = {
  stats: TeamStats;
  roster: RosterPlayer[];
  /** The team's recent finals, oldest first. */
  boxScores: BoxScore[];
};

export type PlayerReport = {
  member: CrewMember;
  /** Every skater who has played this season, best scorer first. */
  skaters: SkaterRow[];
  /** Goalies who have played, busiest first. */
  goalies: GoalieRow[];
  /** Null when the injury feed couldn't be loaded. */
  injuries: InjuryRow[] | null;
  /** Games in the recent-form window (fewer than RECENT_GAMES early in the season). */
  recentGames: number;
};

export function isHot(form: RecentForm): boolean {
  return form.pointStreak >= HOT_STREAK;
}

export function recentForm(playerId: number, team: string, boxScores: readonly BoxScore[]): RecentForm {
  const perGame = boxScores.map(
    (box) => box.skaters.find((line) => line.playerId === playerId && line.team === team) ?? null,
  );
  const played = perGame.filter((line) => line !== null);

  let pointStreak = 0;
  for (const line of played.toReversed()) {
    if (line.points === 0) break;
    pointStreak++;
  }

  return {
    perGame: perGame.map((line) => line?.points ?? null),
    games: played.length,
    goals: played.reduce((sum, line) => sum + line.goals, 0),
    assists: played.reduce((sum, line) => sum + line.assists, 0),
    points: played.reduce((sum, line) => sum + line.points, 0),
    pointStreak,
  };
}

/** Lowercase letters only, so "Ekman-Larsson" and "Stützle" match however they're spelled. */
function nameKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

type Person = { id: number; firstName: string; lastName: string; number: number | null; headshot: string };

/**
 * The NHL player an ESPN injury entry refers to. ESPN has no NHL ids, so this
 * matches on full name, then on last name plus first initial when that's
 * unambiguous (Alex/Alexander, Mitch/Mitchell).
 */
export function matchPlayer<P extends Person>(injury: Injury, people: readonly P[]): P | null {
  const full = nameKey(`${injury.firstName}${injury.lastName}`);
  const exact = people.find((p) => nameKey(`${p.firstName}${p.lastName}`) === full);
  if (exact) return exact;

  const last = nameKey(injury.lastName);
  const initial = nameKey(injury.firstName).charAt(0);
  const close = people.filter((p) => nameKey(p.lastName) === last && nameKey(p.firstName).charAt(0) === initial);
  return close.length === 1 ? close[0]! : null;
}

function bySeasonScoring(a: Skater, b: Skater): number {
  return (
    b.points - a.points || b.goals - a.goals || a.gamesPlayed - b.gamesPlayed || a.lastName.localeCompare(b.lastName)
  );
}

export function playerReport(
  member: CrewMember,
  { stats, roster, boxScores }: TeamPlayers,
  injuries: readonly Injury[] | null,
): PlayerReport {
  const numbers = new Map(roster.map((p) => [p.id, p.number]));
  // The roster leaves out players sent down or on long-term IR; season stats remember them.
  const people = new Map<number, Person>();
  for (const p of [...stats.skaters, ...stats.goalies]) people.set(p.id, { ...p, number: numbers.get(p.id) ?? null });
  for (const p of roster) people.set(p.id, p);

  const teamInjuries = (injuries ?? [])
    .filter((injury) => injury.team === member.team)
    .map((injury) => ({ injury, player: matchPlayer(injury, [...people.values()]) }));
  const injuryOf = (id: number) => teamInjuries.find((i) => i.player?.id === id)?.injury ?? null;

  const skaters = stats.skaters.toSorted(bySeasonScoring).map((s) => ({
    ...s,
    number: numbers.get(s.id) ?? null,
    recent: recentForm(s.id, member.team, boxScores),
    injury: injuryOf(s.id),
  }));
  const goalies = stats.goalies
    .filter((g) => g.gamesPlayed > 0)
    .toSorted((a, b) => b.gamesStarted - a.gamesStarted || b.gamesPlayed - a.gamesPlayed)
    .map((g) => ({ ...g, number: numbers.get(g.id) ?? null, injury: injuryOf(g.id) }));

  const keyIds = new Set([...skaters.slice(0, LEADER_COUNT).map((s) => s.id), ...goalies.slice(0, 1).map((g) => g.id)]);

  return {
    member,
    skaters,
    goalies,
    injuries:
      injuries &&
      teamInjuries
        .map(({ injury, player }) => ({
          ...injury,
          playerId: player?.id ?? null,
          number: player?.number ?? null,
          headshot: player?.headshot ?? null,
          keyPlayer: player !== null && keyIds.has(player.id),
        }))
        .sort((a, b) => Number(b.keyPlayer) - Number(a.keyPlayer) || b.updatedAt.localeCompare(a.updatedAt)),
    recentGames: boxScores.length,
  };
}

export type Star = { member: CrewMember; skater: SkaterRow };

/**
 * The crew's three stars: the best scorers across every crew team over each
 * team's recent games. Points, then goals, then fewer games to get there.
 */
export function threeStars(reports: readonly PlayerReport[]): Star[] {
  const seen = new Set<number>();
  return reports
    .flatMap((report) => report.skaters.map((skater) => ({ member: report.member, skater })))
    .filter(({ skater }) => skater.recent.points > 0)
    .sort(
      (a, b) =>
        b.skater.recent.points - a.skater.recent.points ||
        b.skater.recent.goals - a.skater.recent.goals ||
        a.skater.recent.games - b.skater.recent.games ||
        bySeasonScoring(a.skater, b.skater),
    )
    .filter(({ skater }) => !seen.has(skater.id) && seen.add(skater.id))
    .slice(0, 3);
}

/** True when ESPN's estimated return is a real date after `today` (YYYY-MM-DD), not its rolling placeholder. */
export function hasReturnEstimate(injury: Injury, today: string): boolean {
  return injury.returnDate !== null && injury.returnDate > today;
}
