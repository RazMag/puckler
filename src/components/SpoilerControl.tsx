import { getLeagueWeek } from "@/lib/nhl/api";
import { readShield } from "@/lib/spoilers/session";
import { spoilersOffAt, spoilersOn } from "@/lib/spoilers/shield";
import { SpoilerSwitch } from "./SpoilerSwitch";

/** The spoiler switch, set from this viewer's cookie and the games since. Render inside Suspense. */
export async function SpoilerControl() {
  const shield = await readShield();
  // The week from yesterday reaches today, so it holds every game the shield can cover.
  const league = await getLeagueWeek(shield.since);
  return <SpoilerSwitch on={spoilersOn(shield, league)} offAt={spoilersOffAt(shield, league, new Date())} />;
}
