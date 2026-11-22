// Migrations compatibles Turso : la version du schéma vit dans une table,
// car PRAGMA user_version est en lecture seule sur Turso Cloud.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createClient } from "@libsql/client";
import { afterAll, describe, expect, it } from "vitest";
import { SCHEMA_VERSION, migrate, readSchemaVersion } from "@/data/db";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pipeline-turso-"));
const fileUrl = (name: string) => "file:" + path.join(dir, name).split(path.sep).join("/");

afterAll(() => {
  try {
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  } catch {}
});

describe("migrations sans PRAGMA user_version", () => {
  it("une base neuve est migrée, sa version est dans schema_version, user_version n'est pas écrit", async () => {
    const db = createClient({ url: fileUrl("neuve.db") });
    await migrate(db);
    expect(await readSchemaVersion(db)).toBe(SCHEMA_VERSION);
    const { rows } = await db.execute("PRAGMA user_version");
    expect(Number(rows[0].user_version)).toBe(0);
    await migrate(db); // relancer ne rejoue rien
    expect(await readSchemaVersion(db)).toBe(SCHEMA_VERSION);
    db.close();
  });

  it("une base locale complète d'avant schema_version (user_version à jour) ne rejoue rien et garde ses données", async () => {
    const db = createClient({ url: fileUrl("ancienne.db") });
    await migrate(db);
    await db.batch(
      [
        "DROP TABLE schema_version",
        `PRAGMA user_version = ${SCHEMA_VERSION}`,
        "INSERT INTO contacts (id, name, created_at) VALUES ('old', 'Claire Martin', '2026-11-01T09:00:00.000Z')",
      ],
      "write",
    );
    await expect(migrate(db)).resolves.toBeUndefined(); // sans repli : ALTER TABLE rejoué → « duplicate column »
    expect(await readSchemaVersion(db)).toBe(SCHEMA_VERSION);
    const { rows } = await db.execute("SELECT name FROM contacts");
    expect(rows.map((r) => r.name)).toEqual(["Claire Martin"]);
    db.close();
  });

  it("deux instances qui démarrent ensemble ne rejouent pas les migrations", async () => {
    const url = fileUrl("concurrente.db");
    const a = createClient({ url });
    const b = createClient({ url });
    await Promise.all([migrate(a), migrate(b)]);
    expect(await readSchemaVersion(a)).toBe(SCHEMA_VERSION);
    a.close();
    b.close();
  });
});

describe("commande d'application du schéma (pnpm db:migrate)", () => {
  const script = path.join(process.cwd(), "src", "data", "apply-schema.mjs");
  const run = (env: Record<string, string | undefined>) =>
    spawnSync(process.execPath, [script], {
      env: { NODE_ENV: "test", PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, ...env },
      encoding: "utf8",
    });

  it("applique le schéma sur la base de DATABASE_URL et donne la version", async () => {
    const url = fileUrl("commande.db");
    const out = run({ DATABASE_URL: url });
    expect(out.stderr).not.toMatch(/Error/);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(`version ${SCHEMA_VERSION}`);
    const db = createClient({ url });
    expect(await readSchemaVersion(db)).toBe(SCHEMA_VERSION);
    db.close();
  });

  it("refuse de tourner sans DATABASE_URL, et n'affiche jamais le jeton", () => {
    const out = run({ DATABASE_AUTH_TOKEN: "jeton-secret-42" });
    expect(out.status).not.toBe(0);
    expect(out.stderr).toContain("DATABASE_URL");
    expect(out.stdout + out.stderr).not.toContain("jeton-secret-42");
  });
});
