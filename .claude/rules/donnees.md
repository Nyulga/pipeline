---
paths:
  - "src/data/**"
  - "__tests__/integration/data/**"
---

# Couche données

Périmètre : `src/data`.

## Règles
- **Seule couche qui parle à la base.** Le client libSQL (`@libsql/client`), les requêtes SQL
  et la connexion ne vivent qu'ici.
- Base : libSQL en local, Turso en ligne. Le passage à Turso ne doit modifier que cette couche,
  via la configuration (variables d'environnement), jamais les services ni la présentation.
- N'importe jamais `@/services`, `@/components` ni `@/app`.
- Expose des fonctions de dépôt typées (ex. `listContacts`, `insertContact`).
  Pas de règle métier ici, juste lire et écrire.
- Aucun secret dans le code : URL et jeton Turso dans `.env*` (ignoré par git).
- Couverte par des tests d'intégration dans `__tests__/integration/data/`.

## Comment vérifier
```bash
# 1. Séparation des couches (dont : client de base importé uniquement ici)
pnpm test:unit __tests__/unit/architecture/layers.test.ts

# 2. Imports interdits signalés par ESLint
pnpm lint

# 3. Aucun secret en dur — doit ne rien afficher
grep -rnEi "(authToken|libsql://|turso\.io)" src/data | grep -v "process\.env"

# 4. Les tests d'intégration passent
pnpm test:integration
```
