"use client";

import { useOptimistic, useTransition } from "react";
import { setSpoilers } from "@/lib/spoilers/actions";

const HELP = {
  on: "Spoilers on: everything that started before you flipped this shows. Later games stay taped over until you flip it again.",
  off: "Spoilers off: last night's games and anything since are taped over. Flip this on once you're caught up.",
};

/** The header switch: off keeps last night's results taped over, on means "I'm caught up". */
export function SpoilerSwitch({ on, disabled = false }: { on: boolean; disabled?: boolean }) {
  const [shown, setShown] = useOptimistic(on);
  const [pending, startTransition] = useTransition();

  const toggle = () =>
    startTransition(async () => {
      setShown(!shown);
      await setSpoilers(!shown);
    });

  return (
    <button
      type="button"
      role="switch"
      aria-checked={shown}
      aria-label="Spoilers"
      title={shown ? HELP.on : HELP.off}
      disabled={disabled}
      onClick={toggle}
      className="group flex shrink-0 cursor-pointer items-center gap-2 rounded-sm py-1 outline-offset-4 focus-visible:outline-2 focus-visible:outline-kickplate disabled:cursor-wait"
    >
      <GoalLight lit={shown} />
      <span
        className={`text-[13px] font-bold tracking-wider uppercase transition-colors sm:text-sm ${
          shown ? "text-white" : "text-white/75 group-hover:text-white"
        }`}
      >
        Spoilers
      </span>
      <span
        className={`relative grid h-6 w-[3.25rem] -skew-x-12 items-center shadow-[2px_2px_0_0_#000] transition-colors ${
          shown ? "bg-red-line" : "tape-white"
        } ${pending ? "opacity-80" : ""}`}
      >
        <span
          className={`skew-x-12 px-1.5 font-display text-[10px] leading-none ${
            shown ? "justify-self-start text-white" : "justify-self-end text-ink/70"
          }`}
        >
          {shown ? "ON" : "OFF"}
        </span>
        <span
          aria-hidden="true"
          className={`absolute top-1/2 left-0.5 size-5 -translate-y-1/2 skew-x-12 rounded-full bg-[radial-gradient(circle_at_35%_30%,#3a404c,#0b0d12_62%)] shadow-[inset_0_0_0_2px_#000,0_2px_0_0_#000] transition-transform duration-300 ease-[cubic-bezier(0.2,0.9,0.3,1.2)] ${
            shown ? "translate-x-[1.75rem]" : ""
          }`}
        />
      </span>
    </button>
  );
}

/** The red lamp behind the net: lit when the scores are showing. */
function GoalLight({ lit }: { lit: boolean }) {
  return (
    <svg
      viewBox="0 0 20 24"
      aria-hidden="true"
      className={`h-6 w-5 transition-[filter] duration-300 ${lit ? "drop-shadow-[0_0_6px_rgb(255_38_38/0.9)]" : ""}`}
    >
      <path d="M3 15a7 7 0 0 1 14 0z" fill={lit ? "var(--color-goal)" : "#3a404c"} />
      <path d="M6 12a4 4 0 0 1 3-3.6" stroke="#fff" strokeOpacity={lit ? 0.7 : 0.25} strokeWidth="1.5" fill="none" />
      <rect x="1.5" y="15" width="17" height="3" fill="#c7cfd9" />
      <rect x="4" y="18" width="12" height="4" fill="#4a5871" />
    </svg>
  );
}
