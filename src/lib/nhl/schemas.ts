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
});

export const clubScheduleResponseSchema = z.object({
  currentSeason: z.number(),
  games: z.array(scheduleGameSchema),
});

export type StandingsResponse = z.infer<typeof standingsResponseSchema>;
export type ClubScheduleResponse = z.infer<typeof clubScheduleResponseSchema>;
