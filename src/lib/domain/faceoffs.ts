import type { CrewMember } from "@/lib/crew/types";
import type { Game } from "@/lib/nhl/types";

export const PRESEASON = 1;
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

/** "Raz leads 2–1", "Series tied 1–1", or how many meetings are left before the first one. */
export function seriesText({ a, b, winsA, winsB, games }: Rivalry): string {
  const played = games.filter((g) => g.phase === "final" && !g.hidden).length;
  if (played === 0) return `${games.length} meeting${games.length === 1 ? "" : "s"} this season`;
  if (winsA === winsB) return `Series tied ${winsA}–${winsB}`;
  return winsA > winsB ? `${a.name} leads ${winsA}–${winsB}` : `${b.name} leads ${winsB}–${winsA}`;
}

export type DeckGame = {
  game: Game;
  /** Crew members whose team plays on each side. */
  away: CrewMember[];
  home: CrewMember[];
  /** Two crew picks meet. */
  faceoff: boolean;
  /** The regular-season series a faceoff counts toward. */
  series: Rivalry | null;
};

export type Deck = {
  /** The next `count` games, or every game starting before `until`, live ones first. */
  games: DeckGame[];
  /** The first crew faceoff after those, when none of them is one. */
  nextFaceoff: DeckGame | null;
  /** Every crew game left to play, shown or not. */
  left: number;
};

/**
 * Every crew game that passes `keep`, each listed once however many picks play in it, in start order.
 * Preseason only counts while there's nothing bigger in the pool.
 */
function crewGames(
  crew: readonly CrewMember[],
  schedules: ReadonlyMap<string, readonly Game[]>,
  keep: (game: Game) => boolean,
): DeckGame[] {
  const games = new Map<number, Game>();
  for (const team of new Set(crew.map((m) => m.team))) {
    for (const game of schedules.get(team) ?? []) {
      if (keep(game)) games.set(game.id, game);
    }
  }
  const all = [...games.values()];
  const pool = all.some((g) => g.gameType !== PRESEASON) ? all.filter((g) => g.gameType !== PRESEASON) : all;
  const meetings = new Map(rivalries(crew, schedules).flatMap((r) => r.games.map((g) => [g.id, r] as const)));

  return pool
    .sort((x, y) => x.startTimeUTC.localeCompare(y.startTimeUTC))
    .map((game): DeckGame => {
      const away = crew.filter((m) => m.team === game.away.abbrev);
      const home = crew.filter((m) => m.team === game.home.abbrev);
      return { game, away, home, faceoff: away.length > 0 && home.length > 0, series: meetings.get(game.id) ?? null };
    });
}

/**
 * The crew's upcoming games in order, each listed once however many picks play in it:
 * the next `count`, or with `until`, every game that starts before then.
 */
export function onDeck(
  crew: readonly CrewMember[],
  schedules: ReadonlyMap<string, readonly Game[]>,
  { count = 12, until }: { count?: number; until?: Date } = {},
): Deck {
  const deck = crewGames(crew, schedules, (g) => g.phase !== "final").sort(
    (x, y) => Number(y.game.phase === "live") - Number(x.game.phase === "live"),
  );
  const shown = until
    ? deck.filter((d) => d.game.phase === "live" || Date.parse(d.game.startTimeUTC) < until.getTime())
    : deck.slice(0, count);
  return {
    games: shown,
    nextFaceoff: shown.some((d) => d.faceoff) ? null : (deck.slice(shown.length).find((d) => d.faceoff) ?? null),
    left: deck.length,
  };
}

/** Every crew game played to a final, oldest first. Before opening night, that's the preseason. */
export function played(crew: readonly CrewMember[], schedules: ReadonlyMap<string, readonly Game[]>): DeckGame[] {
  return crewGames(crew, schedules, (g) => g.phase === "final");
}

export type TeamRecord = {
  wins: number;
  losses: number;
  otLosses: number;
  /** Finals behind the spoiler shield, left out of the record. */
  taped: number;
};

/** `abbrev`'s wins, losses and OT losses in `games`, with taped finals counted but not scored. */
export function recordIn(games: readonly Game[], abbrev: string): TeamRecord {
  const record: TeamRecord = { wins: 0, losses: 0, otLosses: 0, taped: 0 };
  for (const game of games) {
    if (game.away.abbrev !== abbrev && game.home.abbrev !== abbrev) continue;
    if (game.phase === "final" && game.hidden) record.taped++;
    const result = resultFor(game, abbrev);
    if (result === "W") record.wins++;
    else if (result === "L") record.losses++;
    else if (result === "OTL") record.otLosses++;
  }
  return record;
}
