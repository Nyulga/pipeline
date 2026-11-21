import { insertNoteRecord, selectNoteRecords, type NoteRecord } from "@/data/notes-repository";

/** Une note datée, telle que la voit le reste de l'app. */
export type Note = { id: string; contactId: string; body: string; createdAt: string };

export type NoteResult = { ok: true; note: Note } | { ok: false; error: string };

const MAX_NOTE = 2000;

/** Une note n'est jamais vide ni faite d'espaces ; elle est gardée sans les espaces autour. */
export function validateNoteBody(body: unknown): { ok: true; value: string } | { ok: false; error: string } {
  const value = typeof body === "string" ? body.trim() : "";
  if (value === "") return { ok: false, error: "La note ne peut pas être vide." };
  if (value.length > MAX_NOTE) return { ok: false, error: `${MAX_NOTE} caractères maximum.` };
  return { ok: true, value };
}

export function toNote(r: NoteRecord): Note {
  return { id: r.id, contactId: r.contact_id, body: r.body, createdAt: r.created_at };
}

/** Ajoute une note datée au contact. Une note vide est refusée sans rien écrire. */
export async function addNote(contactId: string, body: unknown): Promise<NoteResult> {
  const checked = validateNoteBody(body);
  if (!checked.ok) return checked;
  const record = await insertNoteRecord(contactId, checked.value);
  if (!record) return { ok: false, error: "Contact introuvable." };
  return { ok: true, note: toNote(record) };
}

/** Les notes du contact, les plus récentes d'abord. */
export async function listNotes(contactId: string): Promise<Note[]> {
  return (await selectNoteRecords(contactId)).map(toNote);
}
