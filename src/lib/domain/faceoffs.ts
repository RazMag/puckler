import type { CrewMember } from "@/lib/crew/types";
import type { Game } from "@/lib/nhl/types";

export const REGULAR_SEASON = 2;

export type Result = "W" | "L" | "OTL";

/** Outcome of a finished game from `abbrev`'s point of view. */
export function resultFor(game: Game, abbrev: string): Result | null {
  if (game.phase !== "final" || game.home.score === null || game.away.score === null) return null;
  const [us, them] = scoreFor(game, abbrev) as [number, number];
  if (us > them) return "W";
  return game.periodType === "OT" || game.periodType === "SO" ? "OTL" : "L";
}

/** `[our goals, their goals]` from `abbrev`'s point of view. */
export function scoreFor(game: Game, abbrev: string): [number | null, number | null] {
  return game.home.abbrev === abbrev ? [game.home.score, game.away.score] : [game.away.score, game.home.score];
}

export function opponentOf(game: Game, abbrev: string): string {
  return game.home.abbrev === abbrev ? game.away.abbrev : game.home.abbrev;
}

export type BenchReport = {
  member: CrewMember;
  live: Game | null;
  recent: Game[];
  upcoming: Game[];
};

/** Live game, last `recentCount` results and next `upcomingCount` games for each member. */
export function benchReports(
  crew: readonly CrewMember[],
  schedules: ReadonlyMap<string, readonly Game[]>,
  { recentCount = 5, upcomingCount = 3 } = {},
): BenchReport[] {
  return crew.map((member) => {
    const games = schedules.get(member.team) ?? [];
    return {
      member,
      live: games.find((g) => g.phase === "live") ?? null,
      recent: recentFinals(games, recentCount).reverse(),
      upcoming: games.filter((g) => g.gameType === REGULAR_SEASON && g.phase === "upcoming").slice(0, upcomingCount),
    };
  });
}

/** The last `count` finished regular-season games, oldest first. */
export function recentFinals(games: readonly Game[], count: number): Game[] {
  const regular = games.filter((g) => g.gameType === REGULAR_SEASON);
  // Before opening night, fall back to preseason so there's something to show.
  const pool = regular.some((g) => g.phase === "final") ? regular : games;
  return pool.filter((g) => g.phase === "final").slice(-count);
}

export type Rivalry = {
  /** Sorted pair of crew members, `a.team` < `b.team`. */
  a: CrewMember;
  b: CrewMember;
  games: Game[];
  winsA: number;
  winsB: number;
  next: Game | null;
  last: Game | null;
};

/** Every regular-season meeting between two crew teams, grouped by pairing. */
export function rivalries(crew: readonly CrewMember[], schedules: ReadonlyMap<string, readonly Game[]>): Rivalry[] {
  const owners = new Map(crew.map((m) => [m.team, m]));
  const pairs = new Map<string, { a: CrewMember; b: CrewMember; games: Map<number, Game> }>();

  for (const member of crew) {
    for (const game of schedules.get(member.team) ?? []) {
      if (game.gameType !== REGULAR_SEASON) continue;
      const rival = owners.get(opponentOf(game, member.team));
      if (!rival || rival.id === member.id) continue;
      const [a, b] = member.team < rival.team ? [member, rival] : [rival, member];
      const key = `${a.team}-${b.team}`;
      const pair = pairs.get(key) ?? { a, b, games: new Map() };
      pair.games.set(game.id, game);
      pairs.set(key, pair);
    }
  }

  return [...pairs.values()]
    .map(({ a, b, games }) => {
      const sorted = [...games.values()].sort((x, y) => x.startTimeUTC.localeCompare(y.startTimeUTC));
      const finals = sorted.filter((g) => g.phase === "final");
      return {
        a,
        b,
        games: sorted,
        winsA: finals.filter((g) => resultFor(g, a.team) === "W").length,
        winsB: finals.filter((g) => resultFor(g, b.team) === "W").length,
        next: sorted.find((g) => g.phase !== "final") ?? null,
        last: finals.at(-1) ?? null,
      };
    })
    .sort((x, y) => (x.next?.startTimeUTC ?? "9999").localeCompare(y.next?.startTimeUTC ?? "9999"));
}
