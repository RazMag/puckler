import type {
  BoxscoreResponse,
  ClubScheduleResponse,
  ClubStatsResponse,
  RosterResponse,
  StandingsResponse,
} from "./schemas";
import type { BoxScore, Game, GamePhase, RosterPlayer, Standings, TeamStanding, TeamStats } from "./types";

const NHL_SITE = "https://www.nhl.com";

type RawStanding = StandingsResponse["standings"][number];
type RawGame = ClubScheduleResponse["games"][number];

function streakOf(raw: RawStanding): TeamStanding["streak"] {
  const { streakCode: code, streakCount: count } = raw;
  if ((code === "W" || code === "L" || code === "OT") && count) return { code, count };
  return null;
}

export function normalizeStanding(raw: RawStanding): TeamStanding {
  return {
    abbrev: raw.teamAbbrev.default,
    name: raw.teamName.default,
    commonName: raw.teamCommonName.default,
    placeName: raw.placeName.default,
    logo: raw.teamLogo,
    conference: raw.conferenceName,
    division: raw.divisionName,
    divisionRank: raw.divisionSequence,
    conferenceRank: raw.conferenceSequence,
    leagueRank: raw.leagueSequence,
    wildcardRank: raw.wildcardSequence,
    gamesPlayed: raw.gamesPlayed,
    wins: raw.wins,
    losses: raw.losses,
    otLosses: raw.otLosses,
    points: raw.points,
    pointPct: raw.pointPctg,
    regulationWins: raw.regulationWins,
    goalsFor: raw.goalFor,
    goalsAgainst: raw.goalAgainst,
    goalDiff: raw.goalDifferential,
    streak: streakOf(raw),
    last10: { wins: raw.l10Wins, losses: raw.l10Losses, otLosses: raw.l10OtLosses },
    clinch: raw.clinchIndicator ?? null,
  };
}

export function normalizeStandings(raw: StandingsResponse): Standings {
  return {
    updatedAt: raw.standingsDateTimeUtc,
    teams: raw.standings.map(normalizeStanding).sort((a, b) => a.leagueRank - b.leagueRank),
  };
}

/** Site-relative nhl.com path → absolute URL; anything else is ignored. */
function nhlUrl(path: string | undefined): string | null {
  return path?.startsWith("/") && !path.startsWith("//") ? `${NHL_SITE}${path}` : null;
}

const PHASES: Record<string, GamePhase> = {
  FUT: "upcoming",
  PRE: "upcoming",
  LIVE: "live",
  CRIT: "live",
  FINAL: "final",
  OFF: "final",
};

export function normalizeGame(raw: RawGame): Game {
  const phase = PHASES[raw.gameState] ?? "upcoming";
  return {
    id: raw.id,
    gameType: raw.gameType,
    startTimeUTC: raw.startTimeUTC,
    phase,
    venue: raw.venue?.default ?? null,
    away: { abbrev: raw.awayTeam.abbrev, score: raw.awayTeam.score ?? null },
    home: { abbrev: raw.homeTeam.abbrev, score: raw.homeTeam.score ?? null },
    periodType:
      raw.gameOutcome?.lastPeriodType ?? (phase === "live" ? (raw.periodDescriptor?.periodType ?? null) : null),
    period: phase === "live" ? (raw.periodDescriptor?.number ?? null) : null,
    links: {
      recap: nhlUrl(raw.threeMinRecap),
      condensed: nhlUrl(raw.condensedGame),
      gameCenter: nhlUrl(raw.gameCenterLink),
    },
  };
}

/** Current-season games, oldest first. */
export function normalizeSchedule(raw: ClubScheduleResponse): Game[] {
  return raw.games
    .filter((g) => g.season === raw.currentSeason)
    .map(normalizeGame)
    .sort((a, b) => a.startTimeUTC.localeCompare(b.startTimeUTC));
}

export function normalizeTeamStats(raw: ClubStatsResponse): TeamStats {
  return {
    skaters: raw.skaters.map((p) => ({
      id: p.playerId,
      firstName: p.firstName.default,
      lastName: p.lastName.default,
      position: p.positionCode,
      headshot: p.headshot,
      gamesPlayed: p.gamesPlayed,
      goals: p.goals,
      assists: p.assists,
      points: p.points,
      plusMinus: p.plusMinus,
    })),
    goalies: raw.goalies.map((p) => ({
      id: p.playerId,
      firstName: p.firstName.default,
      lastName: p.lastName.default,
      headshot: p.headshot,
      gamesPlayed: p.gamesPlayed,
      gamesStarted: p.gamesStarted,
      wins: p.wins,
      losses: p.losses,
      otLosses: p.overtimeLosses,
      gaa: p.goalsAgainstAverage ?? null,
      savePct: p.savePercentage ?? null,
    })),
  };
}

export function normalizeRoster(raw: RosterResponse): RosterPlayer[] {
  return [...raw.forwards, ...raw.defensemen, ...raw.goalies].map((p) => ({
    id: p.id,
    firstName: p.firstName.default,
    lastName: p.lastName.default,
    number: p.sweaterNumber ?? null,
    position: p.positionCode,
    headshot: p.headshot,
  }));
}

export function normalizeBoxscore(raw: BoxscoreResponse): BoxScore {
  const stats = raw.playerByGameStats;
  const side = (team: string, players: NonNullable<typeof stats>["homeTeam"]) =>
    [...players.forwards, ...players.defense].map(({ playerId, goals, assists, points }) => ({
      playerId,
      team,
      goals,
      assists,
      points,
    }));
  return {
    gameId: raw.id,
    skaters: stats ? [...side(raw.awayTeam.abbrev, stats.awayTeam), ...side(raw.homeTeam.abbrev, stats.homeTeam)] : [],
  };
}
