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
  updatedAt: string | null;
  teams: TeamStanding[];
};

export type GamePhase = "upcoming" | "live" | "final";

export type GameSide = { abbrev: string; score: number | null };

/** Absolute nhl.com URLs; null until the NHL publishes them. */
export type GameLinks = {
  recap: string | null;
  condensed: string | null;
  gameCenter: string | null;
};

export type Game = {
  id: number;
  /** 1 preseason, 2 regular season, 3 playoffs. */
  gameType: number;
  /** Eastern-time calendar day the NHL files the game under (YYYY-MM-DD). */
  gameDate: string;
  startTimeUTC: string;
  phase: GamePhase;
  venue: string | null;
  away: GameSide;
  home: GameSide;
  /** REG, OT or SO once decided; current period type while live. */
  periodType: string | null;
  period: number | null;
  links: GameLinks;
  /** Started after the viewer's spoiler line: scores and period are blanked out. */
  hidden: boolean;
};

/** Just enough of a game anywhere in the league to tell whether it could spoil the standings. */
export type LeagueGame = Pick<Game, "id" | "gameType" | "gameDate" | "startTimeUTC" | "phase">;

export type Skater = {
  id: number;
  firstName: string;
  lastName: string;
  /** C, L, R or D. */
  position: string;
  headshot: string;
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
};

export type Goalie = {
  id: number;
  firstName: string;
  lastName: string;
  headshot: string;
  gamesPlayed: number;
  gamesStarted: number;
  wins: number;
  losses: number;
  otLosses: number;
  /** Null until the goalie has faced a shot. */
  gaa: number | null;
  savePct: number | null;
  goalsAgainst: number;
  shotsAgainst: number;
  saves: number;
  /** Seconds in net this season. */
  timeOnIce: number;
};

/** One team's season totals for everyone who has dressed this season. */
export type TeamStats = { skaters: Skater[]; goalies: Goalie[] };

export type RosterPlayer = {
  id: number;
  firstName: string;
  lastName: string;
  number: number | null;
  /** C, L, R, D or G. */
  position: string;
  headshot: string;
};

/** A skater's scoring in one game. */
export type SkaterLine = {
  playerId: number;
  team: string;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
};

/** A goalie's night. `seconds` is 0 for a backup who never went in. */
export type GoalieLine = {
  playerId: number;
  team: string;
  seconds: number;
  starter: boolean;
  decision: "W" | "L" | "O" | null;
  goalsAgainst: number;
  shotsAgainst: number;
  saves: number;
};

/** Player stats from a finished game, both teams. */
export type BoxScore = { gameId: number; skaters: SkaterLine[]; goalies: GoalieLine[] };
