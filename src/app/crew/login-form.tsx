"use client";

import { useActionState } from "react";
import { login, logout, type LoginState } from "@/lib/auth/actions";

const initial: LoginState = { error: null };

export function LoginForm() {
  const [state, action, pending] = useActionState(login, initial);

  return (
    <form action={action} className="jumbotron space-y-4 px-6 pt-8 pb-6">
      <h2 className="font-display text-2xl">Crew only</h2>
      <p className="text-white/70">Enter the crew password to change the picks. Anyone can watch.</p>
      <label className="block">
        <span className="text-xs font-bold tracking-[0.2em] text-white/50 uppercase">Password</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="mt-1 w-full border-2 border-white/20 bg-black/40 px-3 py-2 font-led text-2xl text-led outline-none focus:border-led"
        />
      </label>
      {state.error && (
        <p role="alert" className="font-semibold text-goal">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full -skew-x-12 bg-red-line py-3 font-display text-lg text-white shadow-[4px_4px_0_0_#000] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      >
        <span className="inline-block skew-x-12">{pending ? "Checking…" : "Hit the ice"}</span>
      </button>
    </form>
  );
}

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="-skew-x-12 border-2 border-boards px-4 py-1.5 text-sm font-bold tracking-wider uppercase hover:bg-boards hover:text-white"
      >
        <span className="inline-block skew-x-12">Lock the room</span>
      </button>
    </form>
  );
}
