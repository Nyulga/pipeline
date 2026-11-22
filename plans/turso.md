# Plan · Migration vers Turso

Objectif (INTENT.md, Architecture) : passer de la base SQLite locale à Turso en ligne,
en ne modifiant que la couche données (`src/data`) et la configuration. SQLite reste la base locale.

## Constat de départ
- `getDb()` lit déjà `DATABASE_URL` et `DATABASE_AUTH_TOKEN`, sinon `file:pipeline.db`.
- **Bloquant** : les migrations sont suivies par `PRAGMA user_version`, qui est en **lecture seule
  sur Turso Cloud** (doc Turso, « Limitations »). La première écriture du schéma échouerait en ligne.
- Sur Vercel, si `DATABASE_URL` manque, l'app retomberait sans rien dire sur `file:pipeline.db`,
  un disque éphémère : les contacts seraient perdus à chaque déploiement.
- Plusieurs instances serverless peuvent démarrer ensemble : la version lue hors transaction
  laisserait deux migrations s'exécuter en même temps (`ALTER TABLE` en double → erreur).

## Décisions
1. **Version du schéma dans une table `schema_version`** (une ligne), écrite dans la même transaction
   que les migrations. Une base locale existante (suivie par `user_version`) reprend sa version
   au premier démarrage : rien n'est rejoué, aucune donnée touchée. On n'écrit plus `user_version`.
2. **Migrations dans une transaction d'écriture interactive** : la version est relue *dans* la
   transaction, donc une seconde instance attend puis ne rejoue rien.
3. **`databaseConfig(env)`**, fonction pure et testée :
   - sans `DATABASE_URL` → `file:pipeline.db` en local ;
   - sans `DATABASE_URL` sur Vercel (`VERCEL` défini) → erreur explicite, jamais de repli silencieux ;
   - URL distante (`libsql:`, `https:`, `wss:`) sans `DATABASE_AUTH_TOKEN` → erreur explicite ;
   - les messages d'erreur ne contiennent jamais l'URL ni le jeton.
4. **Commande d'application du schéma** : `pnpm db:migrate` (`src/data/apply-schema.mjs`), qui lance
   les mêmes migrations que l'app. Elle exige `DATABASE_URL` et n'affiche que l'hôte, jamais le jeton.
5. **`.env.example`** commité (noms des variables, sans valeur), via `!.env.example` dans `.gitignore`.

## Hors champ
Services, présentation et tests non liés : inchangés.

## Tests (écrits avant le code)
- `__tests__/integration/data/db-config.test.ts` : les règles de `databaseConfig`.
- `__tests__/integration/data/migrations.test.ts` : la base v1 migrée porte `schema_version = SCHEMA_VERSION`.
- `__tests__/integration/data/migrations-turso.test.ts` : base neuve migrée sans écrire `user_version`,
  migrations concurrentes sans erreur, commande `apply-schema.mjs` (succès, et refus sans `DATABASE_URL`).

## Preuves
Rouge (tests écrits, code pas encore modifié) :
```
 Test Files  3 failed | 32 passed (35)
      Tests  13 failed | 213 passed (226)
```
Vert :
```
 Test Files  35 passed (35)
      Tests  226 passed (226)
```
`pnpm lint`, `tsc --noEmit`, `pnpm build` : sans erreur. Vérification 3 de `.claude/rules/donnees.md`
(aucun secret en dur dans `src/data`) : rien affiché. Aucun fichier de `src/services`, `src/app`
ni `src/components` modifié.
