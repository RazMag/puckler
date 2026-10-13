import { readShield } from "@/lib/spoilers/session";
import { spoilersOn } from "@/lib/spoilers/shield";
import { SpoilerSwitch } from "./SpoilerSwitch";

/** The spoiler switch, set from this viewer's cookie. Render inside Suspense. */
export async function SpoilerControl() {
  return <SpoilerSwitch on={spoilersOn(await readShield())} />;
}
