import type { Metadata } from "next";
import { Suspense } from "react";
import { Jumbotron } from "@/components/Scoreboard";
import { BoardSkeleton } from "@/components/Skeletons";
import { PlayerBoard } from "./player-board";

export const metadata: Metadata = { title: "Players" };

export default function PlayersPage() {
  return (
    <>
      <Jumbotron kicker="▶ The locker room" title="Players">
        Who&apos;s carrying each crew team: the top scorers, who&apos;s on a heater, who&apos;s in net, and who&apos;s
        stuck in the trainer&apos;s room. Injury news comes from ESPN.
      </Jumbotron>
      <Suspense fallback={<BoardSkeleton label="Taping up the sticks…" />}>
        <PlayerBoard />
      </Suspense>
    </>
  );
}
