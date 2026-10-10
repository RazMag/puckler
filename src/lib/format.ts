/** 1 → "1st", 22 → "22nd", 13 → "13th". */
export function ordinal(n: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${suffixes[(v - 20) % 10] ?? suffixes[v] ?? "th"}`;
}

/** Signed number for differentials: +4, 0, −3. */
export function signed(n: number): string {
  if (n > 0) return `+${n}`;
  if (n < 0) return `−${Math.abs(n)}`;
  return "0";
}

/** .750 style percentage, the way hockey writes it. */
export function pct(n: number): string {
  return n.toFixed(3).replace(/^0/, "");
}

/** "Auston", "Matthews" → "A. Matthews", the way a scoresheet prints names. */
export function shortName(firstName: string, lastName: string): string {
  return firstName ? `${firstName.charAt(0)}. ${lastName}` : lastName;
}

/** NHL position codes (C, L, R, D, G) the way fans say them. */
export function positionLabel(code: string): string {
  return ({ L: "LW", R: "RW" } as Record<string, string>)[code] ?? code;
}

const DAY = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/** "2026-10-17" → "Oct 17". A calendar day, so no time zone shifts it. */
export function dayLabel(isoDate: string): string {
  return DAY.format(new Date(`${isoDate}T00:00:00Z`));
}
