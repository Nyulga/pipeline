import {
  insertContactRecord,
  selectContactRecordById,
  selectContactRecords,
  updateContactTracking,
  type ContactRecord,
} from "@/data/contacts-repository";
import {
  isContactResponse,
  markCalled,
  markNotCalled,
  withResponse,
  type Contact,
  type Tracking,
} from "@/services/tracking";

import { CONTACT_FIELDS, type ContactField } from "@/services/contact-fields";

export type { Contact, ContactResponse } from "@/services/tracking";
export { CONTACT_FIELDS, type ContactField } from "@/services/contact-fields";

export type ContactInput = Partial<Record<ContactField, string | null>>;
export type ContactErrors = Partial<Record<ContactField, string>>;

type CleanInput = { name: string; company: string | null; phone: string | null; email: string | null };

const MAX: Record<ContactField, number> = { name: 120, company: 120, phone: 40, email: 254 };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clean = (v: string | null | undefined) => {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
};

export function validateContactInput(
  input: ContactInput,
): { ok: true; value: CleanInput } | { ok: false; errors: ContactErrors } {
  const value = {
    name: clean(input.name) ?? "",
    company: clean(input.company),
    phone: clean(input.phone),
    email: clean(input.email),
  };
  const errors: ContactErrors = {};

  if (!value.name) errors.name = "Le nom est obligatoire.";
  for (const field of CONTACT_FIELDS) {
    const v = value[field];
    if (!errors[field] && v && v.length > MAX[field])
      errors[field] = `${MAX[field]} caractères maximum.`;
  }
  if (!errors.email && value.email && !EMAIL.test(value.email))
    errors.email = "Adresse e-mail invalide.";

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}

function toContact(r: ContactRecord): Contact {
  if (!isContactResponse(r.response))
    throw new Error(`Réponse inconnue en base pour le contact ${r.id} : ${r.response}`);
  return {
    id: r.id,
    name: r.name,
    company: r.company,
    phone: r.phone,
    email: r.email,
    called: r.called === 1,
    response: r.response,
    createdAt: r.created_at,
  };
}

export type AddContactResult = { ok: true; contact: Contact } | { ok: false; errors: ContactErrors };

/** Ajoute un contact. Règle métier : il est créé « non appelé » et « en attente ». */
export async function addContact(input: ContactInput): Promise<AddContactResult> {
  const checked = validateContactInput(input);
  if (!checked.ok) return checked;
  const record = await insertContactRecord({ ...checked.value, called: false, response: "enAttente" });
  return { ok: true, contact: toContact(record) };
}

/** Tous les contacts, du plus récent au plus ancien. */
export async function listContacts(): Promise<Contact[]> {
  return (await selectContactRecords()).map(toContact);
}

export type TrackingResult = { ok: true; contact: Contact } | { ok: false; error: string };

/** Applique une règle de suivi au contact `id` et enregistre le résultat. */
async function updateTracking(id: string, rule: (t: Tracking) => Tracking): Promise<TrackingResult> {
  const record = await selectContactRecordById(id);
  if (!record) return { ok: false, error: "Contact introuvable." };
  const updated = await updateContactTracking(id, rule(toContact(record)));
  if (!updated) return { ok: false, error: "Contact introuvable." };
  return { ok: true, contact: toContact(updated) };
}

/** Marque le contact appelé ou non appelé (« non appelé » remet la réponse à « en attente »). */
export function setCalled(id: string, called: boolean): Promise<TrackingResult> {
  return updateTracking(id, called ? markCalled : markNotCalled);
}

/** Enregistre la réponse du contact (« accepté » ou « refusé » le marque aussi appelé). */
export async function setResponse(id: string, response: unknown): Promise<TrackingResult> {
  if (!isContactResponse(response)) return { ok: false, error: "Réponse inconnue." };
  return updateTracking(id, (t) => withResponse(t, response));
}
