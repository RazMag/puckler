import type { Metadata } from "next";
import { Suspense } from "react";
import { Jumbotron } from "@/components/Scoreboard";
import { BoardSkeleton } from "@/components/Skeletons";
import { FaceoffBoard } from "./faceoff-board";

export const metadata: Metadata = { title: "Faceoffs" };

export default function FaceoffsPage() {
  return (
    <>
      <Jumbotron kicker="▶ Head to head" title="Faceoffs">
        Each crew team&apos;s latest results and what&apos;s next on the schedule, plus every regular-season game where
        two crew picks meet. Times are in your time zone.
      </Jumbotron>
      <Suspense fallback={<BoardSkeleton label="Lining up for the draw…" />}>
        <FaceoffBoard />
      </Suspense>
    </>
  );
}
