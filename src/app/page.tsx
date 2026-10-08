import { Suspense } from "react";
import { Jumbotron } from "@/components/Scoreboard";
import { BoardSkeleton } from "@/components/Skeletons";
import { CrewStandings } from "./crew-standings";

export default function StandingsPage() {
  return (
    <>
      <Jumbotron kicker="▶ The crew race" title="Crew Standings">
        Every pick, ranked by its team&apos;s place in the NHL. A win is worth 2 points, an overtime or shootout loss
        still earns 1, a regulation loss gets nothing.
      </Jumbotron>
      <Suspense fallback={<BoardSkeleton />}>
        <CrewStandings />
      </Suspense>
    </>
  );
}
