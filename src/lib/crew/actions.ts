"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { NotEditorError, requireEditor } from "@/lib/auth/session";
import * as store from "./store";
import { memberNameSchema, shorthandSchema, teamAbbrevSchema } from "./types";

export type CrewFormState = { error: string | null; ok: boolean };

const memberForm = z.object({ name: memberNameSchema, team: teamAbbrevSchema, short: shorthandSchema });

function failure(err: unknown): CrewFormState {
  if (err instanceof NotEditorError || err instanceof store.CrewConflictError) {
    return { error: err.message, ok: false };
  }
  throw err;
}

function parseMember(formData: FormData) {
  return memberForm.safeParse({
    name: formData.get("name"),
    team: formData.get("team"),
    short: formData.get("short") ?? "",
  });
}

export async function addMemberAction(_prev: CrewFormState, formData: FormData): Promise<CrewFormState> {
  try {
    await requireEditor();
    const parsed = parseMember(formData);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid entry.", ok: false };
    await store.addMember(parsed.data);
  } catch (err) {
    return failure(err);
  }
  refresh();
  return { error: null, ok: true };
}

export async function updateMemberAction(_prev: CrewFormState, formData: FormData): Promise<CrewFormState> {
  try {
    await requireEditor();
    const id = formData.get("id");
    const parsed = parseMember(formData);
    if (typeof id !== "string") return { error: "Missing player.", ok: false };
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid entry.", ok: false };
    await store.updateMember(id, parsed.data);
  } catch (err) {
    return failure(err);
  }
  refresh();
  return { error: null, ok: true };
}

export async function removeMemberAction(_prev: CrewFormState, formData: FormData): Promise<CrewFormState> {
  try {
    await requireEditor();
    const id = formData.get("id");
    if (typeof id !== "string") return { error: "Missing player.", ok: false };
    await store.removeMember(id);
  } catch (err) {
    return failure(err);
  }
  refresh();
  return { error: null, ok: true };
}
