"use client";

import { useSyncExternalStore } from "react";

const FORMATS = {
  datetime: { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" },
  date: { weekday: "short", month: "short", day: "numeric" },
  time: { hour: "numeric", minute: "2-digit" },
} satisfies Record<string, Intl.DateTimeFormatOptions>;

const subscribe = () => () => {};

/** Formats an ISO timestamp in the viewer's own time zone (server renders a placeholder). */
export function LocalTime({ iso, format = "datetime" }: { iso: string; format?: keyof typeof FORMATS }) {
  const text = useSyncExternalStore(
    subscribe,
    () => new Intl.DateTimeFormat(undefined, FORMATS[format]).format(new Date(iso)),
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
export function LocalDay({ iso, after }: { iso: string; after?: string }) {
  const sameDay = useSyncExternalStore(
    subscribe,
    () => after !== undefined && dayKey(after) === dayKey(iso),
    () => false,
  );
  return sameDay ? null : <LocalTime iso={iso} format="date" />;
}
