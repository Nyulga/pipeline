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
