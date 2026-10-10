import { HOT_STREAK, LEADER_COUNT, RECENT_GAMES } from "@/lib/domain/players";
import { SEASON_GAMES } from "@/lib/nhl/league";

/** Hockey terms explained for people new to the NHL; shown as tooltips. */
export const GLOSSARY = {
  gp: {
    title: "Games played",
    text: `How many games the team has played so far this season (${SEASON_GAMES} in total).`,
  },
  w: { title: "Wins", text: "Each win is worth 2 points, whether in regulation, overtime or a shootout." },
  l: { title: "Regulation losses", text: "Losses in the normal 60 minutes. Worth 0 points." },
  ot: {
    title: "Overtime / shootout losses",
    text: "Games lost after a tie at 60 minutes. The team still earns 1 point for getting that far.",
  },
  record: {
    title: "Record (W-L-OT)",
    text: "Wins, regulation losses and overtime/shootout losses. 4-1-2 means 4 wins, 1 loss, 2 OT losses.",
  },
  pts: { title: "Points", text: "2 per win, 1 per overtime or shootout loss. Standings are sorted by points." },
  pct: {
    title: "Points percentage",
    text: "Points earned out of points possible. The fairest comparison when teams have played different numbers of games.",
  },
  gf: { title: "Goals for", text: "Goals the team has scored." },
  ga: { title: "Goals against", text: "Goals the team has allowed." },
  gd: {
    title: "Goal differential",
    text: "Goals scored minus goals allowed. Positive means the team outscores opponents overall.",
  },
  l10: { title: "Last 10 games", text: "Record over the most recent ten games (W-L-OT): who's hot right now." },
  streak: {
    title: "Streak",
    text: "Current run of results: W3 means three wins in a row, L2 two regulation losses, OT1 an overtime loss.",
  },
  hot: { title: "Hot streak", text: "Three or more wins in a row. The goal light is on." },
  pace: {
    title: "Points pace",
    text: `Points the team would finish with over ${SEASON_GAMES} games at its current points percentage. Somewhere in the mid-to-high 90s usually makes the playoffs.`,
  },
  nhlRank: { title: "League rank", text: "Position among all 32 NHL teams." },
  divRank: { title: "Division rank", text: "Position within the team's own 8-team division." },
  ptsBack: { title: "Points back", text: "How far behind the crew leader this team is." },
  divisionSpot: {
    title: "Division spot",
    text: "Top three in the division. If the season ended today, this team would be in the playoffs.",
  },
  wildCard: {
    title: "Wild card",
    text: "After the division top-threes, the two best remaining teams in each conference also make it, whatever their division.",
  },
  out: {
    title: "Out of a playoff spot",
    text: "Below the last wild card right now. The number is how many points behind that team they are.",
  },
  bubble: {
    title: "On the bubble",
    text: "Level on points with the last wild card team but behind on tiebreakers (games played, regulation wins…). One good night changes it.",
  },
  cutLine: {
    title: "Wild card cut line",
    text: "Points held by the team in the conference's last wild card spot: the bar to clear to make the playoffs.",
  },
  topThree: {
    title: "Division spots",
    text: "The top three teams in each division qualify for the playoffs automatically.",
  },
  series: {
    title: "Season series",
    text: "Head-to-head wins in the regular-season games between these two crew teams.",
  },
  finalOt: {
    title: "Decided in overtime",
    text: "Tied after 60 minutes and won with a goal in the 5-minute overtime.",
  },
  finalSo: {
    title: "Decided in a shootout",
    text: "Still tied after overtime, so it went to a penalty-shot shootout.",
  },
  otl: { title: "Overtime loss", text: "Lost after overtime or a shootout. Still worth 1 point." },
  form: {
    title: "Recent form",
    text: "The last few results, oldest on the left: W win, L loss, OT overtime/shootout loss.",
  },
  playerPts: {
    title: "Points (player)",
    text: "One for every goal and one for every assist. The usual way to rank scorers.",
  },
  goals: { title: "Goals", text: "Pucks the player put in the net." },
  assists: {
    title: "Assists",
    text: "Credit for the last one or two teammates to touch the puck before a goal.",
  },
  plusMinus: {
    title: "Plus/minus",
    text: "Even-strength and shorthanded goals scored minus goals allowed while the player was on the ice. Power-play goals don't count.",
  },
  lastGames: {
    title: `Last ${RECENT_GAMES} games`,
    text: "Points in each of the team's latest games, oldest on the left. A dash means the player didn't dress.",
  },
  hotStick: {
    title: "Hot stick",
    text: `A point in each of the player's last ${HOT_STREAK} or more games.`,
  },
  threeStars: {
    title: "Three stars",
    text: `After every NHL game the three best players are named its stars. Here: the top scorers on crew teams over each team's last ${RECENT_GAMES} games.`,
  },
  goalieRecord: {
    title: "Goalie record (W-L-OT)",
    text: "Games the goalie was in net for the result: wins, regulation losses and overtime/shootout losses.",
  },
  svPct: {
    title: "Save percentage",
    text: "Share of shots on goal the goalie stopped. About .900 is average; .920 or better is excellent.",
  },
  gaa: {
    title: "Goals against average",
    text: "Goals allowed per 60 minutes in net. Lower is better; under 2.50 is excellent.",
  },
  keyPlayer: {
    title: "Key player",
    text: `One of the team's top ${LEADER_COUNT} scorers or its starting goalie.`,
  },
  ir: {
    title: "Injured reserve",
    text: "Out for at least a week. The team can fill the roster spot while the player heals.",
  },
  injuryOut: { title: "Out", text: "Won't play the next game, maybe more. No firm timeline yet." },
  dtd: { title: "Day-to-day", text: "A minor knock. Could play any night; it's decided game by game." },
  suspended: {
    title: "Suspended",
    text: "Banned by the league for a set number of games, usually after a dangerous hit.",
  },
  estReturn: {
    title: "Estimated return",
    text: "ESPN's best guess at when the player is back. Injuries often run longer.",
  },
} as const satisfies Record<string, { title: string; text: string }>;

export type GlossaryKey = keyof typeof GLOSSARY;
