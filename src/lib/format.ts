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
