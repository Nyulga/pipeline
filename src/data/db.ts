import { createClient, type Client } from "@libsql/client";

// Local : fichier libSQL (pipeline.db, ignoré par git).
// En ligne : URL et jeton Turso via les variables d'environnement.
// Passer de l'un à l'autre ne change que cette configuration.

/** Migrations versionnées : chaque entrée s'exécute une fois, dans l'ordre. */
const MIGRATIONS: string[][] = [
  // 1 · contacts (lot 1)
  [
    `CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT,
      phone TEXT,
      email TEXT,
      called INTEGER NOT NULL DEFAULT 0 CHECK (called IN (0, 1)),
      response TEXT NOT NULL DEFAULT 'enAttente' CHECK (response IN ('accepte', 'refuse', 'enAttente')),
      created_at TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS contacts_created_at ON contacts (created_at)`,
  ],
];

async function migrate(db: Client) {
  const { rows } = await db.execute("PRAGMA user_version");
  const current = Number(rows[0]?.user_version ?? 0);
  for (let v = current; v < MIGRATIONS.length; v++) {
    await db.batch([...MIGRATIONS[v], `PRAGMA user_version = ${v + 1}`], "write");
  }
}

let ready: { url: string; db: Promise<Client> } | null = null;

/** Client unique, migré au premier accès. Recréé si DATABASE_URL change (tests). */
export function getDb(): Promise<Client> {
  const url = process.env.DATABASE_URL ?? "file:pipeline.db";
  if (ready?.url !== url) {
    const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
    ready = { url, db: migrate(client).then(() => client) };
    ready.db.catch(() => (ready = null));
  }
  return ready.db;
}

/** Ferme la connexion courante (tests d'intégration). */
export async function closeDb() {
  if (!ready) return;
  const db = await ready.db.catch(() => null);
  ready = null;
  db?.close();
}
