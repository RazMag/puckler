import type { Metadata } from "next";
import { Suspense } from "react";
import { Jumbotron } from "@/components/Scoreboard";
import { BoardSkeleton } from "@/components/Skeletons";
import { DivisionBoard } from "./division-board";

export const metadata: Metadata = { title: "Divisions" };

export default function DivisionsPage() {
  return (
    <>
      <Jumbotron kicker="▶ Four rinks · 32 teams" title="Division Rinks">
        Each team is a puck, slid down the ice by its points. The top three in every division make the playoffs, plus
        two <strong className="text-kickplate">wild cards</strong> per conference: the next-best teams regardless of
        division. The dashed red line is the last wild card&apos;s points.
      </Jumbotron>
      <Suspense fallback={<BoardSkeleton label="Flooding the rinks…" />}>
        <DivisionBoard />
      </Suspense>
    </>
  );
}
