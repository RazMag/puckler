/**
 * Static metadata the NHL API doesn't provide: team colors for jerseys,
 * sticks and pucks. Division/conference come from live standings so a
 * realignment never needs a code change here.
 */
export type TeamMeta = {
  abbrev: string;
  name: string;
  /** Jersey body / stick shaft. */
  primary: string;
  /** Trim, stripes and lettering. */
  secondary: string;
};

const TEAMS = [
  { abbrev: "ANA", name: "Anaheim Ducks", primary: "#F47A38", secondary: "#000000" },
  { abbrev: "BOS", name: "Boston Bruins", primary: "#000000", secondary: "#FFB81C" },
  { abbrev: "BUF", name: "Buffalo Sabres", primary: "#003087", secondary: "#FFB81C" },
  { abbrev: "CAR", name: "Carolina Hurricanes", primary: "#CE1126", secondary: "#000000" },
  { abbrev: "CBJ", name: "Columbus Blue Jackets", primary: "#002654", secondary: "#CE1126" },
  { abbrev: "CGY", name: "Calgary Flames", primary: "#C8102E", secondary: "#F1BE48" },
  { abbrev: "CHI", name: "Chicago Blackhawks", primary: "#CF0A2C", secondary: "#000000" },
  { abbrev: "COL", name: "Colorado Avalanche", primary: "#6F263D", secondary: "#236192" },
  { abbrev: "DAL", name: "Dallas Stars", primary: "#006847", secondary: "#8F8F8C" },
  { abbrev: "DET", name: "Detroit Red Wings", primary: "#CE1126", secondary: "#FFFFFF" },
  { abbrev: "EDM", name: "Edmonton Oilers", primary: "#041E42", secondary: "#FF4C00" },
  { abbrev: "FLA", name: "Florida Panthers", primary: "#C8102E", secondary: "#B9975B" },
  { abbrev: "LAK", name: "Los Angeles Kings", primary: "#111111", secondary: "#A2AAAD" },
  { abbrev: "MIN", name: "Minnesota Wild", primary: "#154734", secondary: "#A6192E" },
  { abbrev: "MTL", name: "Montréal Canadiens", primary: "#AF1E2D", secondary: "#192168" },
  { abbrev: "NJD", name: "New Jersey Devils", primary: "#CE1126", secondary: "#000000" },
  { abbrev: "NSH", name: "Nashville Predators", primary: "#FFB81C", secondary: "#041E42" },
  { abbrev: "NYI", name: "New York Islanders", primary: "#00539B", secondary: "#F47D30" },
  { abbrev: "NYR", name: "New York Rangers", primary: "#0038A8", secondary: "#CE1126" },
  { abbrev: "OTT", name: "Ottawa Senators", primary: "#C52032", secondary: "#C2912C" },
  { abbrev: "PHI", name: "Philadelphia Flyers", primary: "#F74902", secondary: "#000000" },
  { abbrev: "PIT", name: "Pittsburgh Penguins", primary: "#000000", secondary: "#FCB514" },
  { abbrev: "SEA", name: "Seattle Kraken", primary: "#001628", secondary: "#99D9D9" },
  { abbrev: "SJS", name: "San Jose Sharks", primary: "#006D75", secondary: "#EA7200" },
  { abbrev: "STL", name: "St. Louis Blues", primary: "#002F87", secondary: "#FCB514" },
  { abbrev: "TBL", name: "Tampa Bay Lightning", primary: "#002868", secondary: "#FFFFFF" },
  { abbrev: "TOR", name: "Toronto Maple Leafs", primary: "#00205B", secondary: "#FFFFFF" },
  { abbrev: "UTA", name: "Utah Mammoth", primary: "#010101", secondary: "#6CACE4" },
  { abbrev: "VAN", name: "Vancouver Canucks", primary: "#00205B", secondary: "#00843D" },
  { abbrev: "VGK", name: "Vegas Golden Knights", primary: "#333F42", secondary: "#B4975A" },
  { abbrev: "WPG", name: "Winnipeg Jets", primary: "#041E42", secondary: "#AC162C" },
  { abbrev: "WSH", name: "Washington Capitals", primary: "#C8102E", secondary: "#041E42" },
] as const satisfies readonly TeamMeta[];

export type TeamAbbrev = (typeof TEAMS)[number]["abbrev"];

export const ALL_TEAMS: readonly TeamMeta[] = TEAMS;

const BY_ABBREV = new Map<string, TeamMeta>(TEAMS.map((t) => [t.abbrev, t]));

export function isTeamAbbrev(value: string): value is TeamAbbrev {
  return BY_ABBREV.has(value);
}

const FALLBACK: TeamMeta = { abbrev: "NHL", name: "Unknown", primary: "#0B1220", secondary: "#FFFFFF" };

export function teamMeta(abbrev: string): TeamMeta {
  return BY_ABBREV.get(abbrev) ?? { ...FALLBACK, abbrev, name: abbrev };
}

export function teamLogo(abbrev: string, variant: "light" | "dark" = "light"): string {
  return `https://assets.nhle.com/logos/nhl/svg/${abbrev}_${variant}.svg`;
}

/** Black or white, whichever reads better on `hex`. */
export function inkOn(hex: string): "#000000" | "#FFFFFF" {
  const n = Number.parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.179 ? "#000000" : "#FFFFFF";
}
