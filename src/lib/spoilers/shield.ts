import type { BoxScore, Game, LeagueGame, TeamStanding, TeamStats } from "@/lib/nhl/types";

/**
 * The spoiler shield, for a crew that watches on delay from another time zone.
 *
 * Results stay hidden from last night's slate on, by the NHL's own Eastern-time
 * calendar. Flipping spoilers on means "I'm caught up": everything that started
 * before that moment shows, and games that start later hide again until the
 * next flip. Forgetting to switch it back off can't spoil tomorrow's games.
 */
export type Shield = {
  /** Eastern-time day (YYYY-MM-DD) from which results can be hidden: yesterday's slate. */
  since: string;
  /** When the viewer last caught up (ISO). Null while the shield is fully up. */
  caughtUpAt: string | null;
};

const EASTERN = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The Eastern-time calendar day of an instant, as YYYY-MM-DD. */
export function easternDate(instant: Date): string {
  return EASTERN.format(instant);
}

/** "2026-10-13", -1 → "2026-10-12". */
export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** The shield at `now`. A catch-up from before last night's slate no longer reveals anything, so it lapses. */
export function shieldFor(now: Date, caughtUpAt: string | null | undefined): Shield {
  const since = addDays(easternDate(now), -1);
  const at = caughtUpAt ? new Date(caughtUpAt) : null;
  const valid = at !== null && !Number.isNaN(at.getTime()) && at <= now && easternDate(at) >= since;
  return { since, caughtUpAt: valid ? at.toISOString() : null };
}

/**
 * Spoilers are on: the viewer caught up recently enough for it to still count,
 * and no game in `league` has started since. A game that starts after the flip
 * turns the switch back off, so it never reads on above taped-over results.
 */
export function spoilersOn(shield: Shield, league: readonly LeagueGame[]): boolean {
  return shield.caughtUpAt !== null && !league.some((game) => isHidden(game, shield));
}

/** How soon to look again at a game that is past its start time but not under way yet. */
const RECHECK_MS = 60 * 1000;

/**
 * When the switch is next due to flip off on its own (ISO): the next puck drop
 * the viewer hasn't caught up on. Null while spoilers are off or nothing is coming.
 */
export function spoilersOffAt(shield: Shield, league: readonly LeagueGame[], now: Date): string | null {
  if (!spoilersOn(shield, league)) return null;
  const caughtUpAt = Date.parse(shield.caughtUpAt!);
  const due = league
    .filter((g) => g.phase === "upcoming" && g.gameDate >= shield.since && Date.parse(g.startTimeUTC) >= caughtUpAt)
    .map((g) => Math.max(Date.parse(g.startTimeUTC), now.getTime() + RECHECK_MS));
  return due.length === 0 ? null : new Date(Math.min(...due)).toISOString();
}

/** A game whose score the viewer shouldn't see yet: under way or over, from last night on, and newer than their catch-up. */
export function isHidden(game: Pick<Game, "phase" | "gameDate" | "startTimeUTC">, shield: Shield): boolean {
  if (game.phase === "upcoming" || game.gameDate < shield.since) return false;
  return shield.caughtUpAt === null || Date.parse(game.startTimeUTC) >= Date.parse(shield.caughtUpAt);
}

/** Blank out the scores (and the OT/SO tell) of every game the viewer hasn't caught up on. */
export function applyShield(games: readonly Game[], shield: Shield): Game[] {
  return games.map((game) =>
    isHidden(game, shield)
      ? {
          ...game,
          hidden: true,
          away: { ...game.away, score: null },
          home: { ...game.home, score: null },
          periodType: null,
          period: null,
        }
      : game,
  );
}

/**
 * The last Eastern-time day whose results the standings can include, or null
 * when nothing in the league is hidden and the live standings are safe.
 * Standings only move on regular-season games.
 */
export function standingsThrough(league: readonly LeagueGame[], shield: Shield): string | null {
  const hidden = league.filter((g) => g.gameType === 2 && isHidden(g, shield)).map((g) => g.gameDate);
  if (hidden.length === 0) return null;
  return addDays(
    hidden.reduce((a, b) => (a < b ? a : b)),
    -1,
  );
}

/**
 * Standings before anyone has played: every team at zero. The NHL has no
 * standings for days before opening night, so the first night of the season
 * rewinds to this. Ranks fall back to alphabetical order.
 */
export function openingNight(teams: readonly TeamStanding[]): TeamStanding[] {
  const byName = teams.toSorted((a, b) => a.name.localeCompare(b.name));
  const rankWithin = (team: TeamStanding, key: "division" | "conference") =>
    byName.filter((t) => t[key] === team[key]).indexOf(team) + 1;
  const wildcardRank = (team: TeamStanding) => {
    if (rankWithin(team, "division") <= 3) return 0;
    return byName.filter((t) => t.conference === team.conference && rankWithin(t, "division") > 3).indexOf(team) + 1;
  };

  return byName.map((team, i) => ({
    ...team,
    divisionRank: rankWithin(team, "division"),
    conferenceRank: rankWithin(team, "conference"),
    leagueRank: i + 1,
    wildcardRank: wildcardRank(team),
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    otLosses: 0,
    points: 0,
    pointPct: 0,
    regulationWins: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    streak: null,
    last10: { wins: 0, losses: 0, otLosses: 0 },
    clinch: null,
  }));
}

/**
 * Season totals with `hidden` games taken back out, so the players page
 * doesn't give away who scored last night. Anyone whose only games are hidden
 * drops off entirely: a debut is news too.
 */
export function rewindStats(stats: TeamStats, team: string, hidden: readonly BoxScore[]): TeamStats {
  if (hidden.length === 0) return stats;
  const skaterLines = hidden.flatMap((box) => box.skaters.filter((l) => l.team === team));
  // A backup who never left the bench doesn't get a game played.
  const goalieLines = hidden.flatMap((box) => box.goalies.filter((l) => l.team === team && l.seconds > 0));

  const skaters = stats.skaters
    .map((s) => {
      const lines = skaterLines.filter((l) => l.playerId === s.id);
      const sum = (key: "goals" | "assists" | "points" | "plusMinus") => lines.reduce((n, l) => n + l[key], 0);
      return {
        ...s,
        gamesPlayed: s.gamesPlayed - lines.length,
        goals: s.goals - sum("goals"),
        assists: s.assists - sum("assists"),
        points: s.points - sum("points"),
        plusMinus: s.plusMinus - sum("plusMinus"),
      };
    })
    .filter((s) => s.gamesPlayed > 0);

  const goalies = stats.goalies
    .map((g) => {
      const lines = goalieLines.filter((l) => l.playerId === g.id);
      if (lines.length === 0) return g;
      const count = (pred: (l: (typeof lines)[number]) => boolean) => lines.filter(pred).length;
      const sum = (key: "goalsAgainst" | "shotsAgainst" | "saves" | "seconds") => lines.reduce((n, l) => n + l[key], 0);
      const goalsAgainst = g.goalsAgainst - sum("goalsAgainst");
      const shotsAgainst = g.shotsAgainst - sum("shotsAgainst");
      const saves = g.saves - sum("saves");
      const timeOnIce = g.timeOnIce - sum("seconds");
      return {
        ...g,
        gamesPlayed: g.gamesPlayed - lines.length,
        gamesStarted: g.gamesStarted - count((l) => l.starter),
        wins: g.wins - count((l) => l.decision === "W"),
        losses: g.losses - count((l) => l.decision === "L"),
        otLosses: g.otLosses - count((l) => l.decision === "O"),
        goalsAgainst,
        shotsAgainst,
        saves,
        timeOnIce,
        savePct: shotsAgainst > 0 ? saves / shotsAgainst : null,
        gaa: timeOnIce > 0 ? (goalsAgainst * 3600) / timeOnIce : null,
      };
    })
    .filter((g) => g.gamesPlayed > 0);

  return { skaters, goalies };
}
