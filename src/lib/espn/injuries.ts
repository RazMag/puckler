import { z } from "zod";

/**
 * League-wide injury report from ESPN's public site API. The NHL web API has
 * no injury data, so this is the one feed that doesn't come from the league.
 * Entries are read leniently: one odd record shouldn't hide the whole report.
 */

const injurySchema = z.object({
  status: z.string(),
  date: z.string(),
  shortComment: z.string().optional(),
  longComment: z.string().optional(),
  athlete: z.object({
    firstName: z.string(),
    lastName: z.string(),
    position: z.object({ abbreviation: z.string() }).optional(),
    team: z.object({ abbreviation: z.string() }).optional(),
  }),
  type: z.object({ name: z.string() }).optional(),
  details: z
    .object({
      type: z.string().optional(),
      side: z.string().optional(),
      detail: z.string().optional(),
      returnDate: z.string().optional(),
    })
    .optional(),
});

export const injuriesResponseSchema = z.object({
  injuries: z.array(z.object({ injuries: z.array(z.unknown()) })),
});

export type InjuriesResponse = z.infer<typeof injuriesResponseSchema>;

export type InjuryStatus = "ir" | "out" | "dtd" | "suspended";

export type Injury = {
  /** NHL abbreviation. */
  team: string;
  firstName: string;
  lastName: string;
  /** C, LW, RW, D or G. */
  position: string | null;
  status: InjuryStatus;
  /** "Lower Body", "Right Knee (Surgery)", "Undisclosed"… */
  ailment: string | null;
  /**
   * ESPN's estimated return day (YYYY-MM-DD). ESPN rolls unknown dates forward
   * to the current day, so only a date after today means anything.
   */
  returnDate: string | null;
  /** One line of news about the injury or suspension. */
  note: string | null;
  /** When ESPN last updated the entry. */
  updatedAt: string;
};

const STATUS: Record<string, InjuryStatus> = {
  INJURY_STATUS_IR: "ir",
  INJURY_STATUS_OUT: "out",
  INJURY_STATUS_DAYTODAY: "dtd",
  INJURY_STATUS_SUSPENSION: "suspended",
};

// Where ESPN's abbreviation differs from the NHL's.
const TEAM_ALIASES: Record<string, string> = { LA: "LAK", NJ: "NJD", SJ: "SJS", TB: "TBL", UTAH: "UTA" };

const UNSPECIFIED = "Not Specified";

function ailmentOf(details: z.infer<typeof injurySchema>["details"]): string | null {
  if (!details?.type) return null;
  const side = details.side && details.side !== UNSPECIFIED ? `${details.side} ` : "";
  const detail = details.detail && details.detail !== UNSPECIFIED ? ` (${details.detail})` : "";
  return `${side}${details.type}${detail}`;
}

// Words that show a note is about the player being out, not a game recap.
const INJURY_NEWS =
  /injur|hurt|surg|suspen|hearing|disciplin|day-to-day|week-to-week|month-to-month|reserve|sideline|indefinite|\bmiss|return|recover|rehab|re-?assess|re-?evaluat|time(line|table)|undisclosed|game-time|questionable|illness|concussion|absen|ruled out|out for|won't play|will not play/i;

function isInjuryNews(text: string | undefined, ailment: string | undefined): text is string {
  if (!text || !/\s/.test(text.trim())) return false; // Many notes only repeat the status code ("ir-nr").
  return INJURY_NEWS.test(text) || (!!ailment && text.toLowerCase().includes(ailment.toLowerCase()));
}

// A period after these isn't the end of a sentence: "St. Louis", "Oct. 13", "J.T. Miller".
const NOT_SENTENCE_END = /\b(?:St|Jr|Sr|Dr|Mr|vs|No|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept?|Oct|Nov|Dec|[A-Z])\.$/;

export function firstSentence(text: string): string {
  for (const end of text.matchAll(/[.!?](?=\s+["“A-Z])/g)) {
    const sentence = text.slice(0, end.index + 1);
    if (!NOT_SENTENCE_END.test(sentence)) return sentence;
  }
  return text.trim();
}

/**
 * ESPN's short comment is the player's latest headline, which is sometimes a
 * game recap ("logged a goal and four PIM…") rather than why they're out. Then
 * the opening line of the long comment usually says it instead.
 */
function noteOf(short: string | undefined, long: string | undefined, ailment: string | undefined): string | null {
  if (isInjuryNews(short, ailment)) return short;
  const opening = long && firstSentence(long);
  return isInjuryNews(opening, ailment) ? opening : null;
}

export function normalizeInjuries(raw: InjuriesResponse): Injury[] {
  return raw.injuries.flatMap((team) =>
    team.injuries.flatMap((entry) => {
      const parsed = injurySchema.safeParse(entry);
      const abbrev = parsed.data?.athlete.team?.abbreviation;
      if (!parsed.success || !abbrev) return [];
      const { athlete, type, details, status, date, shortComment, longComment } = parsed.data;
      return [
        {
          team: TEAM_ALIASES[abbrev] ?? abbrev,
          firstName: athlete.firstName,
          lastName: athlete.lastName,
          position: athlete.position?.abbreviation ?? null,
          // A status ESPN adds later still means the player isn't dressing.
          status: (type && STATUS[type.name]) ?? (status === "Day-To-Day" ? "dtd" : "out"),
          ailment: ailmentOf(details),
          returnDate: details?.returnDate ?? null,
          note: noteOf(shortComment, longComment, details?.type),
          updatedAt: date,
        },
      ];
    }),
  );
}
