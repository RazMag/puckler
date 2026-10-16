"use client";

import { useSyncExternalStore } from "react";

const FORMATS = {
  datetime: { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" },
  date: { weekday: "short", month: "short", day: "numeric" },
  time: { hour: "numeric", minute: "2-digit" },
} satisfies Record<string, Intl.DateTimeFormatOptions>;

const subscribe = () => () => {};

function formatIso(iso: string, format: keyof typeof FORMATS | "day"): string {
  const date = new Date(iso);
  if (format !== "day") return new Intl.DateTimeFormat(undefined, FORMATS[format]).format(date);
  // "Sat 17", weekday first whatever the locale's own order.
  const part = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(undefined, options).format(date);
  return `${part({ weekday: "short" })} ${part({ day: "numeric" })}`;
}

/** Formats an ISO timestamp in the viewer's own time zone (server renders a placeholder). */
export function LocalTime({ iso, format = "datetime" }: { iso: string; format?: keyof typeof FORMATS | "day" }) {
  const text = useSyncExternalStore(
    subscribe,
    () => formatIso(iso, format),
    () => null,
  );
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {text ?? " "}
    </time>
  );
}

const dayKey = (iso: string) => new Date(iso).toDateString();

/** The local date of `iso`, or nothing when it falls on the same local day as `after`. */
export function LocalDay({
  iso,
  after,
  format = "date",
}: {
  iso: string;
  after?: string;
  format?: keyof typeof FORMATS | "day";
}) {
  const sameDay = useSyncExternalStore(
    subscribe,
    () => after !== undefined && dayKey(after) === dayKey(iso),
    () => false,
  );
  return sameDay ? null : <LocalTime iso={iso} format={format} />;
}
