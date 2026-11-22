// Applique le schéma (les migrations de db.ts) sur la base de DATABASE_URL.
// Usage : pnpm db:migrate, avec DATABASE_URL et DATABASE_AUTH_TOKEN dans l'environnement.
// N'affiche jamais le jeton, seulement l'hôte de la base.
import { createClient } from "@libsql/client";
import { databaseConfig, migrate, readSchemaVersion } from "./db.ts";

if (!process.env.DATABASE_URL?.trim()) {
  console.error("DATABASE_URL manquante : indique la base sur laquelle appliquer le schéma.");
  process.exit(1);
}

let client;
try {
  const config = databaseConfig(process.env);
  const where = config.url.startsWith("file:") ? "le fichier local" : new URL(config.url).host;
  client = createClient(config);
  const before = await readSchemaVersion(client);
  await migrate(client);
  const after = await readSchemaVersion(client);
  console.log(
    before === after
      ? `Schéma déjà à jour sur ${where} : version ${after}.`
      : `Schéma appliqué sur ${where} : version ${before} → version ${after}.`,
  );
} catch (e) {
  console.error(`Échec : ${e instanceof Error ? e.message : String(e)}`);
  process.exitCode = 1;
} finally {
  client?.close();
}
