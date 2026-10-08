"use client";

import { useEffect } from "react";
import { Puck } from "@/components/Puck";

export default function ZamboniError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="jumbotron mx-auto mt-6 max-w-xl px-6 py-12 text-center" role="alert">
      <Puck size="lg" className="mx-auto mb-6">
        !
      </Puck>
      <p className="led text-2xl">STOPPAGE IN PLAY</p>
      <h2 className="mt-2 font-display text-3xl">Zamboni on the ice</h2>
      <p className="mx-auto mt-3 max-w-md text-white/70">
        We couldn&apos;t reach the NHL scoreboard just now. Give it a moment and try again.
      </p>
      <button
        type="button"
        onClick={retry}
        className="mt-8 -skew-x-12 bg-red-line px-6 py-3 font-display text-lg text-white shadow-[4px_4px_0_0_#000]"
      >
        <span className="inline-block skew-x-12">Drop the puck again</span>
      </button>
    </section>
  );
}
