import Image from "next/image";
import { initials } from "@/lib/domain/crew-standings";
import { teamMeta } from "@/lib/nhl/teams";

/** A player's NHL mugshot in a team-colored ring, or their initials when there's no photo. */
export function Headshot({
  src,
  name,
  team,
  size = 40,
}: {
  src: string | null;
  name: string;
  team: string;
  size?: number;
}) {
  const style = { width: size, height: size, boxShadow: `0 0 0 2px ${teamMeta(team).primary}` };
  // Decorative: the name is always printed right beside it.
  return src ? (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      unoptimized
      className="shrink-0 rounded-full bg-white"
      style={style}
    />
  ) : (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-full bg-white font-display text-xs text-ink-soft"
      style={style}
    >
      {initials(name)}
    </span>
  );
}
