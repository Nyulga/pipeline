import { createClient, type Client, type Config, type Transaction } from "@libsql/client";

// Local : fichier SQLite (pipeline.db, ignoré par git).
// En ligne : Turso, via DATABASE_URL et DATABASE_AUTH_TOKEN.
// Passer de l'un à l'autre ne change que ces variables d'environnement.

type Env = Readonly<Record<string, string | undefined>>;

/**
 * Connexion à ouvrir selon l'environnement. Sur Vercel, le disque est éphémère :
 * pas de repli silencieux sur un fichier local. Les erreurs ne citent jamais les valeurs.
 */
export function databaseConfig(env: Env): Config {
  const url = env.DATABASE_URL?.trim() || "";
  const token = env.DATABASE_AUTH_TOKEN?.trim() || "";
  const local = url === "" || url === ":memory:" || /^file:/i.test(url);
  if (env.VERCEL && local)
    throw new Error("DATABASE_URL manquante ou locale : sur Vercel, définis l'URL de la base Turso (le disque y est éphémère).");
  if (url === "") return { url: "file:pipeline.db" };
  if (local) return { url };
  if (token === "" && /^(libsql|https|wss):/i.test(url))
    throw new Error("DATABASE_AUTH_TOKEN manquant : une base Turso en ligne demande son jeton d'accès.");
  return token === "" ? { url } : { url, authToken: token };
}

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
  // 2 · un nom ne peut pas être vide ni fait d'espaces (SQLite n'ajoute pas de CHECK
  // à une table existante : des triggers évitent de la reconstruire).
  [
    `CREATE TRIGGER IF NOT EXISTS contacts_name_not_blank_insert
     BEFORE INSERT ON contacts
     WHEN trim(NEW.name, ' ' || char(9, 10, 13)) = ''
     BEGIN SELECT RAISE(ABORT, 'contacts.name ne peut pas être vide'); END`,
    `CREATE TRIGGER IF NOT EXISTS contacts_name_not_blank_update
     BEFORE UPDATE OF name ON contacts
     WHEN trim(NEW.name, ' ' || char(9, 10, 13)) = ''
     BEGIN SELECT RAISE(ABORT, 'contacts.name ne peut pas être vide'); END`,
  ],
  // 3 · prochaine relance (lot 3) : un jour réel AAAA-MM-JJ, ou NULL. date(x) IS x refuse
  // aussi bien « 03/12/2026 » que « 2026-02-30 » (date() renvoie NULL ou une autre date).
  [
    `ALTER TABLE contacts ADD COLUMN next_follow_up TEXT
       CHECK (next_follow_up IS NULL OR date(next_follow_up) IS next_follow_up)`,
    `CREATE INDEX IF NOT EXISTS contacts_next_follow_up ON contacts (next_follow_up)`,
  ],
  // 4 · notes datées (lot 4) : jamais vides, rattachées à un contact.
  [
    `CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      contact_id TEXT NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
      body TEXT NOT NULL CHECK (trim(body, ' ' || char(9, 10, 13)) <> ''),
      created_at TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS notes_contact_created ON notes (contact_id, created_at)`,
  ],
  // 5 · date de l'appel (lot 10) : un instant ISO (UTC), ou NULL. Les appels d'avant n'en ont pas.
  [`ALTER TABLE contacts ADD COLUMN called_at TEXT`],
];

/** Version du schéma une fois toutes les migrations passées. */
export const SCHEMA_VERSION = MIGRATIONS.length;

/**
 * Version du schéma, rangée dans la table schema_version : PRAGMA user_version est en
 * lecture seule sur Turso Cloud. Une base locale d'avant cette table (suivie par
 * user_version) garde sa version : rien n'est rejoué.
 */
export async function readSchemaVersion(db: Client | Transaction): Promise<number> {
  const table = await db.execute("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'schema_version'");
  if (table.rows.length > 0) {
    const { rows } = await db.execute("SELECT version FROM schema_version");
    if (rows.length > 0) return Number(rows[0].version);
  }
  const { rows } = await db.execute("PRAGMA user_version");
  return Number(rows[0]?.user_version ?? 0);
}

/** Ouvre une transaction d'écriture ; si une autre instance tient déjà le verrou, attend son tour. */
async function beginWrite(db: Client, attempts = 50): Promise<Transaction> {
  for (let i = 1; ; i++) {
    try {
      return await db.transaction("write");
    } catch (e) {
      if ((e as { code?: string }).code !== "SQLITE_BUSY" || i >= attempts) throw e;
      await new Promise((r) => setTimeout(r, 20 * i));
    }
  }
}

/**
 * Applique les migrations manquantes dans une seule transaction d'écriture. La version est
 * relue dans la transaction : deux instances qui démarrent ensemble ne rejouent rien.
 */
export async function migrate(db: Client): Promise<void> {
  if ((await readSchemaVersion(db)) >= MIGRATIONS.length) return;
  const tx = await beginWrite(db);
  try {
    const current = await readSchemaVersion(tx);
    if (current >= MIGRATIONS.length) return;
    for (let v = current; v < MIGRATIONS.length; v++) for (const sql of MIGRATIONS[v]) await tx.execute(sql);
    await tx.execute("CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)");
    await tx.execute("DELETE FROM schema_version");
    await tx.execute({ sql: "INSERT INTO schema_version (version) VALUES (?)", args: [MIGRATIONS.length] });
    await tx.commit();
  } finally {
    tx.close();
  }
}

let ready: { url: string; db: Promise<Client> } | null = null;

/** Client unique, migré au premier accès. Recréé si DATABASE_URL change (tests). */
export function getDb(): Promise<Client> {
  const config = databaseConfig(process.env);
  if (ready?.url !== config.url) {
    const client = createClient(config);
    ready = { url: config.url, db: migrate(client).then(() => client) };
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
