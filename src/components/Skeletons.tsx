import { Puck } from "./Puck";

/** Placeholder while live data streams in: a puck sliding over empty ice. */
export function BoardSkeleton({ label = "Resurfacing the ice…" }: { label?: string }) {
  return (
    <div className="grid place-items-center gap-4 py-24 text-ink-soft" role="status">
      <Puck size="lg" className="animate-bounce">
        ·
      </Puck>
      <p className="font-display tracking-wide">{label}</p>
    </div>
  );
}
