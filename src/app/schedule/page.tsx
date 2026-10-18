import type { Metadata } from "next";
import { Suspense } from "react";
import { Jumbotron } from "@/components/Scoreboard";
import { BoardSkeleton } from "@/components/Skeletons";
import { SeasonCalendar } from "./season-calendar";

export const metadata: Metadata = { title: "Schedule" };

export default function SchedulePage({ searchParams }: PageProps<"/schedule">) {
  return (
    <>
      <Jumbotron kicker="▶ The long haul" title="Season Calendar">
        Every game the crew&apos;s picks have left this season, a month to a wall, with crew faceoffs in red. Follow one
        pick or show only the faceoffs.
      </Jumbotron>
      <Suspense fallback={<BoardSkeleton label="Hanging the calendar…" />}>
        <SeasonCalendar searchParams={searchParams} />
      </Suspense>
    </>
  );
}
