import Link from "next/link";
import { Puck } from "./Puck";

/** Shown when nobody has drafted a team yet. */
export function EmptyCrew() {
  return (
    <section className="jumbotron mx-auto max-w-2xl px-6 py-12 text-center">
      <Puck size="lg" className="mx-auto mb-6">
        0
      </Puck>
      <h2 className="font-display text-3xl">The bench is empty</h2>
      <p className="mx-auto mt-3 max-w-md text-white/70">
        Nobody has drafted a team yet. Head to the draft room, put your name on a jersey and pick your club.
      </p>
      <Link
        href="/crew"
        className="mt-8 inline-block -skew-x-12 bg-red-line px-6 py-3 font-display text-lg text-white shadow-[4px_4px_0_0_#000] transition-transform hover:-translate-y-0.5"
      >
        <span className="inline-block skew-x-12">Drop the puck →</span>
      </Link>
    </section>
  );
}
