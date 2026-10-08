import { z } from "zod";
import { isTeamAbbrev } from "@/lib/nhl/teams";

export const MAX_NAME_LENGTH = 20;

export const memberNameSchema = z
  .string()
  .trim()
  .min(1, "Every player needs a name on the back of the jersey.")
  .max(MAX_NAME_LENGTH, `Keep it under ${MAX_NAME_LENGTH + 1} letters — it has to fit on a jersey.`);

export const teamAbbrevSchema = z.string().refine((v) => isTeamAbbrev(v), "Pick a real NHL team.");

// Stored picks are read leniently: a renamed franchise shouldn't take the site down.
export const crewMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  team: z.string(),
});

export const crewFileSchema = z.object({
  version: z.literal(1),
  members: z.array(crewMemberSchema),
});

export type CrewMember = z.infer<typeof crewMemberSchema>;
