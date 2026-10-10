import { z } from "zod";

/**
 * Only the slices of api-web.nhle.com we actually read. The API is public
 * but undocumented, so parsing here makes a breaking change fail loudly in
 * one place instead of rendering NaN across the site.
 */

const localized = z.object({ default: z.string() });

export const standingSchema = z.object({
  teamAbbrev: localized,
  teamName: localized,
  teamCommonName: localized,
  placeName: localized,
  teamLogo: z.string(),
  conferenceName: z.string(),
  divisionName: z.string(),
  conferenceSequence: z.number(),
  divisionSequence: z.number(),
  leagueSequence: z.number(),
  wildcardSequence: z.number(),
  gamesPlayed: z.number(),
  wins: z.number(),
  losses: z.number(),
  otLosses: z.number(),
  points: z.number(),
  pointPctg: z.number(),
  regulationWins: z.number(),
  goalFor: z.number(),
  goalAgainst: z.number(),
  goalDifferential: z.number(),
  streakCode: z.string().optional(),
  streakCount: z.number().optional(),
  l10Wins: z.number(),
  l10Losses: z.number(),
  l10OtLosses: z.number(),
  clinchIndicator: z.string().optional(),
});

export const standingsResponseSchema = z.object({
  standingsDateTimeUtc: z.string(),
  standings: z.array(standingSchema),
});

const scheduleTeamSchema = z.object({
  abbrev: z.string(),
  commonName: localized.optional(),
  placeName: localized.optional(),
  score: z.number().optional(),
});

export const scheduleGameSchema = z.object({
  id: z.number(),
  season: z.number(),
  gameType: z.number(),
  startTimeUTC: z.string(),
  gameState: z.string(),
  venue: localized.optional(),
  awayTeam: scheduleTeamSchema,
  homeTeam: scheduleTeamSchema,
  periodDescriptor: z.object({ number: z.number(), periodType: z.string() }).optional(),
  gameOutcome: z.object({ lastPeriodType: z.string() }).optional(),
  // nhl.com paths, e.g. "/video/nsh-at-tor-recap-…". Videos appear a few hours after the final horn.
  threeMinRecap: z.string().optional(),
  condensedGame: z.string().optional(),
  gameCenterLink: z.string().optional(),
});

export const clubScheduleResponseSchema = z.object({
  currentSeason: z.number(),
  games: z.array(scheduleGameSchema),
});

const clubSkaterSchema = z.object({
  playerId: z.number(),
  headshot: z.string(),
  firstName: localized,
  lastName: localized,
  positionCode: z.string(),
  gamesPlayed: z.number(),
  goals: z.number(),
  assists: z.number(),
  points: z.number(),
  plusMinus: z.number(),
});

const clubGoalieSchema = z.object({
  playerId: z.number(),
  headshot: z.string(),
  firstName: localized,
  lastName: localized,
  gamesPlayed: z.number(),
  gamesStarted: z.number(),
  wins: z.number(),
  losses: z.number(),
  overtimeLosses: z.number(),
  // Missing for a goalie who hasn't faced a shot yet.
  goalsAgainstAverage: z.number().optional(),
  savePercentage: z.number().optional(),
});

export const clubStatsResponseSchema = z.object({
  skaters: z.array(clubSkaterSchema),
  goalies: z.array(clubGoalieSchema),
});

const rosterPlayerSchema = z.object({
  id: z.number(),
  headshot: z.string(),
  firstName: localized,
  lastName: localized,
  // Fresh call-ups sometimes don't have one yet.
  sweaterNumber: z.number().optional(),
  positionCode: z.string(),
});

export const rosterResponseSchema = z.object({
  forwards: z.array(rosterPlayerSchema),
  defensemen: z.array(rosterPlayerSchema),
  goalies: z.array(rosterPlayerSchema),
});

const boxSkaterSchema = z.object({
  playerId: z.number(),
  goals: z.number(),
  assists: z.number(),
  points: z.number(),
});

const boxTeamSchema = z.object({
  forwards: z.array(boxSkaterSchema),
  defense: z.array(boxSkaterSchema),
});

export const boxscoreResponseSchema = z.object({
  id: z.number(),
  awayTeam: z.object({ abbrev: z.string() }),
  homeTeam: z.object({ abbrev: z.string() }),
  // Absent until the puck drops.
  playerByGameStats: z.object({ awayTeam: boxTeamSchema, homeTeam: boxTeamSchema }).optional(),
});

export type StandingsResponse = z.infer<typeof standingsResponseSchema>;
export type ClubScheduleResponse = z.infer<typeof clubScheduleResponseSchema>;
export type ClubStatsResponse = z.infer<typeof clubStatsResponseSchema>;
export type RosterResponse = z.infer<typeof rosterResponseSchema>;
export type BoxscoreResponse = z.infer<typeof boxscoreResponseSchema>;
