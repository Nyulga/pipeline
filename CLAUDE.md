# Pipeline

Lis INTENT.md avant toute chose.

CRM de prospection mono-utilisateur. L'intention du produit est dans @INTENT.md.

@AGENTS.md

## Règles de travail
- On travaille uniquement sur la branche `dev`. Jamais de commit direct sur `main`.
- Repo GitHub public : aucun secret dans le code ni dans les commits (`.env*` est ignoré).
- Hors périmètre : authentification, comptes, droits, multi-utilisateur.

## Stack
Next.js 16 (App Router), TypeScript, Tailwind 4, shadcn, Vitest, pnpm. Déploiement sur Vercel.
Base retenue : libSQL en local, Turso en ligne (pas encore installée).

## Architecture en 3 couches
- **Présentation** : `src/app`, `src/components`.
- **Service** : `src/services`, pour les règles de suivi (appelé / non appelé ; accepté / refusé / en attente).
- **Données** : `src/data`. Seule couche qui parle à la base. Changer de base ne doit modifier que cette couche.

Défauts métier : un nouveau contact est « non appelé » et « en attente ».

## Tests
- Unitaires : `tests/unit/**/*.test.ts`, lancés par `pnpm test:unit`. Les règles de suivi y sont testées.
- Intégration : `tests/integration/**/*.test.ts`, lancés par `pnpm test:integration`.

## Commandes
`pnpm dev` · `pnpm build` · `pnpm lint` · `pnpm test` (lance les deux suites de tests)
