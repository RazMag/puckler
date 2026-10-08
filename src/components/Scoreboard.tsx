import type { ReactNode } from "react";

/** Page header styled as the arena jumbotron. */
export function Jumbotron({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return (
    <section className="jumbotron mb-10 -skew-y-1 px-5 pt-7 pb-5 sm:px-8">
      <div className="skew-y-1">
        <p className="led text-xl sm:text-2xl">{kicker}</p>
        <h1 className="font-display text-4xl leading-none tracking-wide sm:text-6xl">{title}</h1>
        {children && <div className="mt-4 text-white/80">{children}</div>}
      </div>
    </section>
  );
}

/** Section title with a painted ice line under it. */
export function SectionHeading({
  children,
  line = "red",
  aside,
}: {
  children: ReactNode;
  line?: "red" | "blue";
  aside?: ReactNode;
}) {
  return (
    <div className="mt-12 mb-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-display text-2xl tracking-wide text-ink sm:text-3xl">{children}</h2>
        {aside && <div className="text-sm font-semibold text-ink-soft">{aside}</div>}
      </div>
      <div className={`mt-2 ${line === "red" ? "red-line" : "blue-line"}`} />
    </div>
  );
}

/** Small LED readout cell: label over value. */
export function LedStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-bold tracking-[0.2em] text-white/50 uppercase">{label}</div>
      <div className="led text-3xl leading-none">{value}</div>
    </div>
  );
}
