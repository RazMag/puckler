/** Normalized shapes the rest of the app works with. */

export type TeamStanding = {
  abbrev: string;
  name: string;
  commonName: string;
  placeName: string;
  logo: string;
  conference: string;
  division: string;
  divisionRank: number;
  conferenceRank: number;
  leagueRank: number;
  /** 0 = top three in division, 1–2 = wild card spot, 3+ = outside. */
  wildcardRank: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  otLosses: number;
  points: number;
  pointPct: number;
  regulationWins: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  streak: { code: "W" | "L" | "OT"; count: number } | null;
  last10: { wins: number; losses: number; otLosses: number };
  /** x/y/z/p clinched, e eliminated. Only appears late in the season. */
  clinch: string | null;
};

export type Standings = {
  updatedAt: string;
  teams: TeamStanding[];
};

export type GamePhase = "upcoming" | "live" | "final";

export type GameSide = { abbrev: string; score: number | null };

export type Game = {
  id: number;
  /** 1 preseason, 2 regular season, 3 playoffs. */
  gameType: number;
  startTimeUTC: string;
  phase: GamePhase;
  venue: string | null;
  away: GameSide;
  home: GameSide;
  /** REG, OT or SO once decided; current period type while live. */
  periodType: string | null;
  period: number | null;
};
