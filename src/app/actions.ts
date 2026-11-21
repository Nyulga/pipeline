"use server";

import { revalidatePath } from "next/cache";
import {
  CONTACT_FIELDS,
  addContact,
  setCalled,
  setResponse,
  type ContactErrors,
} from "@/services/contacts";

export type AddContactState = { ok: boolean; errors: ContactErrors };

const field = (fd: FormData, name: string) => {
  const v = fd.get(name);
  return typeof v === "string" ? v : null;
};

/** Ajoute un contact depuis le formulaire, puis rafraîchit la liste. */
export async function addContactAction(formData: FormData): Promise<AddContactState> {
  const result = await addContact(Object.fromEntries(CONTACT_FIELDS.map((f) => [f, field(formData, f)])));
  if (!result.ok) return { ok: false, errors: result.errors };
  revalidatePath("/");
  return { ok: true, errors: {} };
}

export type TrackingActionState = { ok: true } | { ok: false; error: string };

const INVALID: TrackingActionState = { ok: false, error: "Requête invalide." };

/** Marque un contact appelé / non appelé, puis rafraîchit la liste. */
export async function setCalledAction(id: unknown, called: unknown): Promise<TrackingActionState> {
  if (typeof id !== "string" || typeof called !== "boolean") return INVALID;
  const r = await setCalled(id, called);
  if (!r.ok) return r;
  revalidatePath("/");
  return { ok: true };
}

/** Enregistre la réponse d'un contact, puis rafraîchit la liste. */
export async function setResponseAction(id: unknown, response: unknown): Promise<TrackingActionState> {
  if (typeof id !== "string") return INVALID;
  const r = await setResponse(id, response);
  if (!r.ok) return r;
  revalidatePath("/");
  return { ok: true };
}
