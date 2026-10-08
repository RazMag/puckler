"use client";

import { useActionState } from "react";
import { Jersey } from "@/components/Jersey";
import { TeamLogo } from "@/components/TeamLogo";
import { addMemberAction, removeMemberAction, updateMemberAction, type CrewFormState } from "@/lib/crew/actions";
import { MAX_NAME_LENGTH, type CrewMember } from "@/lib/crew/types";
import { ALL_TEAMS } from "@/lib/nhl/teams";

const initial: CrewFormState = { error: null, ok: false };

const TEAMS_BY_NAME = ALL_TEAMS.toSorted((a, b) => a.name.localeCompare(b.name));

const inputClass =
  "w-full border-2 border-boards/20 bg-white px-3 py-2 font-semibold outline-none focus:border-red-line";

export function CrewEditor({ crew }: { crew: CrewMember[] }) {
  const owners = new Map(crew.map((m) => [m.team, m]));

  return (
    <div className="space-y-12">
      <AddMember owners={owners} />
      {crew.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-2xl">The roster</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {crew.map((member, i) => (
              <MemberCard key={member.id} member={member} number={i + 1} owners={owners} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function AddMember({ owners }: { owners: ReadonlyMap<string, CrewMember> }) {
  const [state, action, pending] = useActionState(addMemberAction, initial);

  return (
    <form action={action} className="rounded-sm bg-white/80 p-5 shadow-md ring-1 ring-black/5">
      <h2 className="font-display text-2xl">Draft a team</h2>
      <label className="mt-4 block max-w-sm">
        <span className="text-xs font-extrabold tracking-[0.2em] text-ink-soft uppercase">Name on the jersey</span>
        <input
          name="name"
          required
          maxLength={MAX_NAME_LENGTH}
          placeholder="e.g. Raz"
          className={`mt-1 ${inputClass}`}
        />
      </label>

      <fieldset className="mt-5">
        <legend className="text-xs font-extrabold tracking-[0.2em] text-ink-soft uppercase">Pick a team</legend>
        <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
          {TEAMS_BY_NAME.map((team) => {
            const owner = owners.get(team.abbrev);
            return (
              <label
                key={team.abbrev}
                title={owner ? `${team.name} — taken by ${owner.name}` : team.name}
                className={`group relative flex flex-col items-center gap-1 rounded-sm p-1.5 text-center ${
                  owner ? "cursor-not-allowed opacity-45 grayscale" : "cursor-pointer hover:bg-ice-deep/60"
                }`}
              >
                <input
                  type="radio"
                  name="team"
                  value={team.abbrev}
                  required
                  disabled={!!owner}
                  aria-label={owner ? `${team.name}, taken by ${owner.name}` : team.name}
                  className="peer sr-only"
                />
                <span className="grid size-14 place-items-center rounded-full bg-white shadow-[0_3px_0_0_rgb(0_0_0/0.35)] ring-2 ring-transparent transition peer-checked:scale-110 peer-checked:ring-red-line peer-focus-visible:ring-blue-line">
                  <TeamLogo team={team.abbrev} size={44} />
                </span>
                <span className="text-[11px] leading-tight font-bold">{owner ? owner.name : team.abbrev}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {state.error && (
        <p role="alert" className="mt-4 font-semibold text-red-line">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-5 -skew-x-12 bg-red-line px-6 py-3 font-display text-lg text-white shadow-[4px_4px_0_0_#000] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      >
        <span className="inline-block skew-x-12">{pending ? "Signing…" : "Sign the contract"}</span>
      </button>
    </form>
  );
}

function MemberCard({
  member,
  number,
  owners,
}: {
  member: CrewMember;
  number: number;
  owners: ReadonlyMap<string, CrewMember>;
}) {
  const [updateState, update, updating] = useActionState(updateMemberAction, initial);
  const [removeState, remove, removing] = useActionState(removeMemberAction, initial);
  const error = updateState.error ?? removeState.error;

  return (
    <li className="flex gap-3 rounded-sm bg-white/80 p-3 shadow-md ring-1 ring-black/5">
      <Jersey team={member.team} name={member.name} number={number} className="w-24 shrink-0" />
      <div className="min-w-0 flex-1">
        <form action={update} className="space-y-2">
          <input type="hidden" name="id" value={member.id} />
          <input
            name="name"
            required
            maxLength={MAX_NAME_LENGTH}
            defaultValue={member.name}
            aria-label="Name"
            className={inputClass}
          />
          <select name="team" defaultValue={member.team} aria-label="Team" className={inputClass}>
            {TEAMS_BY_NAME.map((team) => {
              const owner = owners.get(team.abbrev);
              const taken = owner !== undefined && owner.id !== member.id;
              return (
                <option key={team.abbrev} value={team.abbrev} disabled={taken}>
                  {team.name}
                  {taken ? ` (${owner.name})` : ""}
                </option>
              );
            })}
          </select>
          <button
            type="submit"
            disabled={updating}
            className="w-full bg-boards py-1.5 text-sm font-bold tracking-wider text-white uppercase disabled:opacity-60"
          >
            {updating ? "Saving…" : "Save"}
          </button>
        </form>
        <form
          action={remove}
          onSubmit={(e) => {
            if (!window.confirm(`Remove ${member.name} from the crew?`)) e.preventDefault();
          }}
          className="mt-1"
        >
          <input type="hidden" name="id" value={member.id} />
          <button
            type="submit"
            disabled={removing}
            className="w-full py-1 text-xs font-bold tracking-wider text-red-line uppercase hover:underline disabled:opacity-60"
          >
            {removing ? "Clearing waivers…" : "Send down to the minors"}
          </button>
        </form>
        {error && (
          <p role="alert" className="mt-1 text-sm font-semibold text-red-line">
            {error}
          </p>
        )}
      </div>
    </li>
  );
}
