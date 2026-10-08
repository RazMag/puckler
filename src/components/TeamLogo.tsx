import Image from "next/image";
import { teamLogo, teamMeta } from "@/lib/nhl/teams";

export function TeamLogo({
  team,
  size = 32,
  variant = "light",
  className,
}: {
  team: string;
  size?: number;
  variant?: "light" | "dark";
  /** Must set both width and height when given (e.g. `size-6`). */
  className?: string;
}) {
  return (
    <Image
      src={teamLogo(team, variant)}
      alt={teamMeta(team).name}
      width={size}
      height={size}
      unoptimized
      // Logos aren't square: pin both sides and letterbox, unless the caller sizes it.
      className={`object-contain ${className ?? ""}`}
      style={className ? undefined : { width: size, height: size }}
    />
  );
}
