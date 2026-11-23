import {
  insertContactRecord,
  selectContactRecordById,
  selectContactRecords,
  updateContactFollowUp,
  updateContactTracking,
  type ContactRecord,
} from "@/data/contacts-repository";
import { selectAllNoteRecords } from "@/data/notes-repository";
import {
  CONTACT_FIELDS,
  isContactResponse,
  type Contact,
  type ContactField,
} from "@/services/contact-model";
import { dueFollowUps, parseFollowUpDate, todayInParis, type DueFollowUp } from "@/services/follow-up";
import { matchesSearch, normalizeForSearch } from "@/services/search";
import { markCalled, markNotCalled, nextCalledAt, parseStage, trackingForStage, withResponse, type Tracking } from "@/services/tracking";

export {
  CONTACT_FIELDS,
  RESPONSES,
  type Contact,
  type ContactField,
  type ContactResponse,
} from "@/services/contact-model";
export type { DueFollowUp, FollowUpState } from "@/services/follow-up";
export { exportFileName, toCsv } from "@/services/csv";

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
    calledAt: r.called_at,
    response: r.response,
    nextFollowUp: r.next_follow_up,
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

/** Un contact par son id (sa fiche), ou null s'il n'existe pas. */
export async function getContact(id: string): Promise<Contact | null> {
  const record = await selectContactRecordById(id);
  return record ? toContact(record) : null;
}

/**
 * Les contacts dont le nom, l'entreprise, le téléphone, l'e-mail ou une note contient `query`,
 * sans tenir compte des majuscules ni des accents, du plus récent au plus ancien. Vide : tous.
 */
export async function searchContacts(query: string): Promise<Contact[]> {
  const contacts = await listContacts();
  if (normalizeForSearch(query) === "") return contacts;
  const notesByContact = new Map<string, string[]>();
  for (const n of await selectAllNoteRecords()) {
    const list = notesByContact.get(n.contact_id) ?? [];
    list.push(n.body);
    notesByContact.set(n.contact_id, list);
  }
  return contacts.filter((c) => matchesSearch(c, notesByContact.get(c.id) ?? [], query));
}

export type ContactExportRow = { contact: Contact; lastNote: string | null };

/** Tous les contacts (du plus récent au plus ancien), chacun avec sa note la plus récente. */
export async function listContactsForExport(): Promise<ContactExportRow[]> {
  const [contacts, notes] = await Promise.all([listContacts(), selectAllNoteRecords()]);
  const lastNote = new Map<string, string>();
  // Les notes arrivent des plus récentes aux plus anciennes : la première vue est la dernière écrite.
  for (const n of notes) if (!lastNote.has(n.contact_id)) lastNote.set(n.contact_id, n.body);
  return contacts.map((contact) => ({ contact, lastNote: lastNote.get(contact.id) ?? null }));
}

export type TrackingResult = { ok: true; contact: Contact } | { ok: false; error: string };

/** Applique une règle de suivi au contact `id` et enregistre le résultat (lecture et écriture atomiques). */
async function updateTracking(id: string, rule: (t: Tracking) => Tracking): Promise<TrackingResult> {
  const updated = await updateContactTracking(id, (current) => {
    const before = toContact(current);
    const next = rule(before);
    return { ...next, calledAt: nextCalledAt(before, next.called, new Date()) };
  });
  if (!updated) return { ok: false, error: "Contact introuvable." };
  return { ok: true, contact: toContact(updated) };
}

/** Marque le contact appelé ou non appelé (« non appelé » remet la réponse à « en attente »). */
export async function setCalled(id: string, called: unknown): Promise<TrackingResult> {
  if (typeof called !== "boolean") return { ok: false, error: "État d'appel inconnu." };
  return updateTracking(id, called ? markCalled : markNotCalled);
}

/** Enregistre la réponse du contact (« accepté » ou « refusé » le marque aussi appelé). */
export async function setResponse(id: string, response: unknown): Promise<TrackingResult> {
  if (!isContactResponse(response)) return { ok: false, error: "Réponse inconnue." };
  return updateTracking(id, (t) => withResponse(t, response));
}

/** Place le contact à une étape : l'appel et la réponse correspondants, en une écriture. */
export async function setStage(id: string, stage: unknown): Promise<TrackingResult> {
  const s = parseStage(stage);
  if (!s) return { ok: false, error: "Étape inconnue." };
  return updateTracking(id, () => trackingForStage(s));
}

/** Fixe la prochaine relance du contact (une valeur vide l'efface). Une date invalide n'écrit rien. */
export async function setFollowUp(id: string, date: unknown): Promise<TrackingResult> {
  const parsed = parseFollowUpDate(date);
  if (!parsed.ok) return parsed;
  const updated = await updateContactFollowUp(id, parsed.value);
  if (!updated) return { ok: false, error: "Contact introuvable." };
  return { ok: true, contact: toContact(updated) };
}

/** « À relancer aujourd'hui » à l'instant `now` : relances du jour (heure de Paris) et en retard. */
export async function listDueFollowUps(now: Date): Promise<DueFollowUp[]> {
  return dueFollowUps(await listContacts(), todayInParis(now));
}
