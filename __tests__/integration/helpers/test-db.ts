// Base libSQL réelle dans un fichier temporaire, propre à chaque fichier de test.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll } from "vitest";
import { closeDb } from "@/data/db";

export function setupTestDatabase() {
  let dir = "";
  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "pipeline-db-"));
    process.env.DATABASE_URL = "file:" + path.join(dir, "test.db").split(path.sep).join("/");
  });
  afterAll(async () => {
    await closeDb();
    delete process.env.DATABASE_URL;
    // Sous Windows, libSQL relâche le fichier avec un léger délai : on réessaie,
    // et un dossier temporaire résiduel ne doit pas faire échouer la suite.
    try {
      fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
    } catch {}
  });
}
