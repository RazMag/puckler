import type { TeamStanding } from "@/lib/nhl/types";

/** NHL format: top three per division plus two wild cards per conference. */
export const DIVISION_SPOTS = 3;
export const WILD_CARD_SPOTS = 2;

export type PlayoffStatus =
  { kind: "division"; spot: number } | { kind: "wildcard"; spot: number } | { kind: "out"; pointsBehind: number };

export type DivisionTable = {
  name: string;
  conference: string;
  teams: TeamStanding[];
};

export type ConferenceTable = {
  name: string;
  divisions: DivisionTable[];
  /** Teams chasing the two wild cards, best first. */
  wildCardRace: TeamStanding[];
  /** Points held by the last team currently in (WC2). */
  cutLinePoints: number;
};

/** The team currently holding the last wild card in `conference`. */
function lastWildCard(conference: string, standings: readonly TeamStanding[]): TeamStanding | undefined {
  return standings.find((t) => t.conference === conference && t.wildcardRank === WILD_CARD_SPOTS);
}

export function playoffStatus(team: TeamStanding, standings: readonly TeamStanding[]): PlayoffStatus {
  if (team.wildcardRank === 0) return { kind: "division", spot: team.divisionRank };
  if (team.wildcardRank <= WILD_CARD_SPOTS) return { kind: "wildcard", spot: team.wildcardRank };
  const cut = lastWildCard(team.conference, standings);
  return { kind: "out", pointsBehind: Math.max(0, (cut?.points ?? team.points) - team.points) };
}

export function conferenceTables(standings: readonly TeamStanding[]): ConferenceTable[] {
  const conferences = new Map<string, Map<string, TeamStanding[]>>();
  for (const team of standings) {
    const divisions = conferences.get(team.conference) ?? new Map<string, TeamStanding[]>();
    divisions.set(team.division, [...(divisions.get(team.division) ?? []), team]);
    conferences.set(team.conference, divisions);
  }

  return [...conferences.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, divisions]) => ({
      name,
      divisions: [...divisions.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([division, teams]) => ({
          name: division,
          conference: name,
          teams: teams.toSorted((a, b) => a.divisionRank - b.divisionRank),
        })),
      wildCardRace: standings
        .filter((t) => t.conference === name && t.wildcardRank > 0)
        .toSorted((a, b) => a.wildcardRank - b.wildcardRank),
      cutLinePoints: lastWildCard(name, standings)?.points ?? 0,
    }));
}
