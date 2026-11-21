import { createClient } from "@libsql/client";
import { describe, expect, it } from "vitest";
import { getDb } from "@/data/db";
import { selectContactRecords } from "@/data/contacts-repository";
import { setupTestDatabase } from "../helpers/test-db";

setupTestDatabase();

// Une base telle que la crée la version 1 (lot 1 d'origine), avec des contacts dedans.
const V1_SCHEMA = [
  `CREATE TABLE contacts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT,
    phone TEXT,
    email TEXT,
    called INTEGER NOT NULL DEFAULT 0 CHECK (called IN (0, 1)),
    response TEXT NOT NULL DEFAULT 'enAttente' CHECK (response IN ('accepte', 'refuse', 'enAttente')),
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX contacts_created_at ON contacts (created_at)`,
  `INSERT INTO contacts (id, name, company, called, response, created_at)
   VALUES ('v1-a', 'Claire Martin', 'Atelier Nord', 1, 'accepte', '2026-11-01T09:00:00.000Z'),
          ('v1-b', 'Hugo Petit', NULL, 0, 'enAttente', '2026-11-02T09:00:00.000Z')`,
  `PRAGMA user_version = 1`,
];

describe("migrations", () => {
  it("migre une base de la version 1 en gardant ses contacts et leur suivi", async () => {
    const v1 = createClient({ url: process.env.DATABASE_URL! });
    await v1.batch(V1_SCHEMA, "write");
    v1.close();

    const db = await getDb();
    const { rows } = await db.execute("PRAGMA user_version");
    expect(Number(rows[0].user_version)).toBe(2);

    const records = await selectContactRecords();
    expect(records.map((r) => [r.id, r.name, r.called, r.response])).toEqual([
      ["v1-b", "Hugo Petit", 0, "enAttente"],
      ["v1-a", "Claire Martin", 1, "accepte"],
    ]);
  });

  it("après migration, un nom vide est refusé", async () => {
    const db = await getDb();
    await expect(
      db.execute(`INSERT INTO contacts (id, name, created_at) VALUES ('x', ' ', '2026-11-03T09:00:00.000Z')`),
    ).rejects.toThrow();
  });
});
