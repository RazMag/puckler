import type { Metadata } from "next";
import { Suspense } from "react";
import { Jersey } from "@/components/Jersey";
import { Jumbotron } from "@/components/Scoreboard";
import { BoardSkeleton } from "@/components/Skeletons";
import { editingConfigured, isEditor } from "@/lib/auth/session";
import { readCrew } from "@/lib/crew/store";
import { CrewEditor } from "./crew-editor";
import { LoginForm, LogoutButton } from "./login-form";

export const metadata: Metadata = { title: "Draft Room" };

export default function DraftRoomPage() {
  return (
    <>
      <Jumbotron kicker="▶ Locker room" title="Draft Room">
        Put your name on a jersey and claim a team. One team per player — first come, first served.
      </Jumbotron>
      <Suspense fallback={<BoardSkeleton label="Unlocking the locker room…" />}>
        <DraftRoom />
      </Suspense>
    </>
  );
}

async function DraftRoom() {
  const [editor, crew] = await Promise.all([isEditor(), readCrew()]);

  if (!editingConfigured()) {
    return (
      <p className="jumbotron px-6 py-8 text-center">
        <span className="led text-2xl">EDITING DISABLED</span>
        <br />
        Set <code>CREW_PASSWORD</code> and <code>SESSION_SECRET</code> on the server to open the draft.
      </p>
    );
  }

  if (!editor) {
    return (
      <div className="grid gap-10 md:grid-cols-[minmax(0,22rem)_1fr]">
        <LoginForm />
        <section aria-label="Current crew">
          <h2 className="mb-3 font-display text-xl">On the bench</h2>
          {crew.length === 0 ? (
            <p className="font-semibold text-ink-soft">Nobody yet — unlock the room to draft the first team.</p>
          ) : (
            <ul className="grid grid-cols-3 gap-4 sm:grid-cols-4">
              {crew.map((m, i) => (
                <li key={m.id}>
                  <Jersey team={m.team} name={m.name} number={i + 1} className="w-full" />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex justify-end">
        <LogoutButton />
      </div>
      <CrewEditor crew={crew} />
    </>
  );
}
