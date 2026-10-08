import type { ClubScheduleResponse, StandingsResponse } from "./schemas";
import type { Game, GamePhase, Standings, TeamStanding } from "./types";

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
  };
}

/** Current-season games, oldest first. */
export function normalizeSchedule(raw: ClubScheduleResponse): Game[] {
  return raw.games
    .filter((g) => g.season === raw.currentSeason)
    .map(normalizeGame)
    .sort((a, b) => a.startTimeUTC.localeCompare(b.startTimeUTC));
}
