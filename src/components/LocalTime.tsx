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
