import { z } from "zod";
import { isTeamAbbrev } from "@/lib/nhl/teams";

export const MAX_NAME_LENGTH = 20;

export const memberNameSchema = z
  .string()
  .trim()
  .min(1, "Every player needs a name on the back of the jersey.")
  .max(MAX_NAME_LENGTH, `Keep it under ${MAX_NAME_LENGTH + 1} letters — it has to fit on a jersey.`);

export const MAX_SHORTHAND_LENGTH = 3;

/** The few letters shown where a full name won't fit. Blank means "use my initials". */
export const shorthandSchema = z
  .string()
  .trim()
  .max(MAX_SHORTHAND_LENGTH, `A shorthand is ${MAX_SHORTHAND_LENGTH} letters at most.`)
  .regex(/^[\p{L}\p{N}]*$/u, "Letters and numbers only in a shorthand.")
  .transform((v) => (v ? v.toUpperCase() : undefined));

export const teamAbbrevSchema = z.string().refine((v) => isTeamAbbrev(v), "Pick a real NHL team.");

// Stored picks are read leniently: a renamed franchise shouldn't take the site down.
export const crewMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  team: z.string(),
  short: z.string().optional(),
});

export const crewFileSchema = z.object({
  version: z.literal(1),
  members: z.array(crewMemberSchema),
});

export type CrewMember = z.infer<typeof crewMemberSchema>;
