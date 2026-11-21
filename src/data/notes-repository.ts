import { getDb } from "./db";

/** Ligne brute de la table notes. */
export type NoteRecord = {
  id: string;
  contact_id: string;
  body: string;
  created_at: string;
};

const COLUMNS = "id, contact_id, body, created_at";

function toRecord(row: Record<string, unknown>): NoteRecord {
  return {
    id: String(row.id),
    contact_id: String(row.contact_id),
    body: String(row.body),
    created_at: String(row.created_at),
  };
}

/**
 * Ajoute une note datée au contact `contactId`. Renvoie la ligne, ou null si le contact est inconnu
 * (l'insertion n'a lieu que si le contact existe : rien n'est écrit sinon).
 */
export async function insertNoteRecord(contactId: string, body: string): Promise<NoteRecord | null> {
  const db = await getDb();
  const { rows } = await db.execute({
    sql: `INSERT INTO notes (${COLUMNS})
          SELECT ?, id, ?, ? FROM contacts WHERE id = ?
          RETURNING ${COLUMNS}`,
    args: [crypto.randomUUID(), body, new Date().toISOString(), contactId],
  });
  return rows[0] ? toRecord(rows[0] as Record<string, unknown>) : null;
}

/** Les notes d'un contact, les plus récentes d'abord. */
export async function selectNoteRecords(contactId: string): Promise<NoteRecord[]> {
  const db = await getDb();
  const { rows } = await db.execute({
    sql: `SELECT ${COLUMNS} FROM notes WHERE contact_id = ? ORDER BY created_at DESC, rowid DESC`,
    args: [contactId],
  });
  return rows.map((r) => toRecord(r as Record<string, unknown>));
}

/** Toutes les notes, les plus récentes d'abord (recherche, export). */
export async function selectAllNoteRecords(): Promise<NoteRecord[]> {
  const db = await getDb();
  const { rows } = await db.execute(`SELECT ${COLUMNS} FROM notes ORDER BY created_at DESC, rowid DESC`);
  return rows.map((r) => toRecord(r as Record<string, unknown>));
}
