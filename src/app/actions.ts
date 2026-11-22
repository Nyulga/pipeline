"use server";

import { refresh } from "next/cache";
import {
  CONTACT_FIELDS,
  addContact,
  setCalled,
  setFollowUp,
  setResponse,
  setStage,
  type ContactErrors,
} from "@/services/contacts";
import { addNote } from "@/services/notes";

// Après une écriture, refresh() renvoie la page affichée re-rendue dans la même réponse.
// La liste n'est pas en cache (lue à chaque requête) : il n'y a rien à invalider, et
// refresh() vaut pour toute page affichée (accueil, future fiche contact) sans la nommer.

export type AddContactState = { ok: boolean; errors: ContactErrors };

const field = (fd: FormData, name: string) => {
  const v = fd.get(name);
  return typeof v === "string" ? v : null;
};

/** Ajoute un contact depuis le formulaire, puis rafraîchit la page affichée. */
export async function addContactAction(formData: FormData): Promise<AddContactState> {
  const result = await addContact(Object.fromEntries(CONTACT_FIELDS.map((f) => [f, field(formData, f)])));
  if (!result.ok) return { ok: false, errors: result.errors };
  refresh();
  return { ok: true, errors: {} };
}

export type TrackingActionState = { ok: true } | { ok: false; error: string };

const INVALID: TrackingActionState = { ok: false, error: "Requête invalide." };

/** Marque un contact appelé / non appelé, puis rafraîchit la page affichée. */
export async function setCalledAction(id: unknown, called: unknown): Promise<TrackingActionState> {
  if (typeof id !== "string") return INVALID;
  const r = await setCalled(id, called);
  if (!r.ok) return r;
  refresh();
  return { ok: true };
}

/** Enregistre la réponse d'un contact, puis rafraîchit la page affichée. */
export async function setResponseAction(id: unknown, response: unknown): Promise<TrackingActionState> {
  if (typeof id !== "string") return INVALID;
  const r = await setResponse(id, response);
  if (!r.ok) return r;
  refresh();
  return { ok: true };
}

/** Place un contact à une étape (appel et réponse ensemble), puis rafraîchit la page affichée. */
export async function setStageAction(id: unknown, stage: unknown): Promise<TrackingActionState> {
  if (typeof id !== "string") return INVALID;
  const r = await setStage(id, stage);
  if (!r.ok) return r;
  refresh();
  return { ok: true };
}

/** Fixe (ou efface, avec une date vide) la prochaine relance d'un contact, puis rafraîchit la page affichée. */
export async function setFollowUpAction(id: unknown, date: unknown): Promise<TrackingActionState> {
  if (typeof id !== "string") return INVALID;
  const r = await setFollowUp(id, date);
  if (!r.ok) return r;
  refresh();
  return { ok: true };
}

/** Ajoute une note datée à un contact, puis rafraîchit la page affichée. */
export async function addNoteAction(contactId: unknown, body: unknown): Promise<TrackingActionState> {
  if (typeof contactId !== "string") return INVALID;
  const r = await addNote(contactId, body);
  if (!r.ok) return r;
  refresh();
  return { ok: true };
}
