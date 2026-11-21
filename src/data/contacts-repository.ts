import { getDb } from "./db";

/** Ligne brute de la table contacts. */
export type ContactRecord = {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  called: number;
  response: string;
  created_at: string;
};

export type NewContactRecord = {
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  called: boolean;
  response: string;
};

const COLUMNS = "id, name, company, phone, email, called, response, created_at";

function toRecord(row: Record<string, unknown>): ContactRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    company: row.company == null ? null : String(row.company),
    phone: row.phone == null ? null : String(row.phone),
    email: row.email == null ? null : String(row.email),
    called: Number(row.called),
    response: String(row.response),
    created_at: String(row.created_at),
  };
}

export async function insertContactRecord(input: NewContactRecord): Promise<ContactRecord> {
  const db = await getDb();
  const { rows } = await db.execute({
    sql: `INSERT INTO contacts (${COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING ${COLUMNS}`,
    args: [
      crypto.randomUUID(),
      input.name,
      input.company,
      input.phone,
      input.email,
      input.called ? 1 : 0,
      input.response,
      new Date().toISOString(),
    ],
  });
  return toRecord(rows[0]);
}

/** Tous les contacts, du plus récent au plus ancien. */
export async function selectContactRecords(): Promise<ContactRecord[]> {
  const db = await getDb();
  const { rows } = await db.execute(
    `SELECT ${COLUMNS} FROM contacts ORDER BY created_at DESC, rowid DESC`,
  );
  return rows.map((r) => toRecord(r as Record<string, unknown>));
}

/** Un contact par son id, ou null s'il n'existe pas. */
export async function selectContactRecordById(id: string): Promise<ContactRecord | null> {
  const db = await getDb();
  const { rows } = await db.execute({ sql: `SELECT ${COLUMNS} FROM contacts WHERE id = ?`, args: [id] });
  return rows[0] ? toRecord(rows[0] as Record<string, unknown>) : null;
}

export type TrackingRecord = { called: boolean; response: string };

/**
 * Lit le contact `id`, calcule son nouveau suivi avec `compute` (fourni par le service, qui porte la règle)
 * puis l'enregistre, le tout dans une seule transaction d'écriture : aucune autre écriture ne peut
 * s'intercaler entre la lecture et l'écriture. Renvoie la ligne modifiée, ou null si l'id est inconnu.
 * Si `compute` lève une erreur, rien n'est écrit.
 */
export function updateContactTracking(
  id: string,
  compute: (current: ContactRecord) => TrackingRecord,
): Promise<ContactRecord | null> {
  return oneWriteAtATime(() => trackingTransaction(id, compute));
}

// Transactions d'écriture de ce processus, l'une après l'autre. En local, le client libSQL est
// synchrone : une seconde transaction ouverte pendant la première échouerait (SQLITE_BUSY)
// au lieu d'attendre son tour.
let writes: Promise<unknown> = Promise.resolve();
function oneWriteAtATime<T>(run: () => Promise<T>): Promise<T> {
  const result = writes.then(run, run);
  writes = result.catch(() => undefined);
  return result;
}

async function trackingTransaction(
  id: string,
  compute: (current: ContactRecord) => TrackingRecord,
): Promise<ContactRecord | null> {
  const db = await getDb();
  const tx = await db.transaction("write");
  try {
    const { rows } = await tx.execute({ sql: `SELECT ${COLUMNS} FROM contacts WHERE id = ?`, args: [id] });
    if (!rows[0]) return null;
    const t = compute(toRecord(rows[0] as Record<string, unknown>));
    const { rows: updated } = await tx.execute({
      sql: `UPDATE contacts SET called = ?, response = ? WHERE id = ? RETURNING ${COLUMNS}`,
      args: [t.called ? 1 : 0, t.response, id],
    });
    await tx.commit();
    return toRecord(updated[0] as Record<string, unknown>);
  } finally {
    // Sans commit (id inconnu, erreur), fermer la transaction l'annule.
    tx.close();
  }
}
