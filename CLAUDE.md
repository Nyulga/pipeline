# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Pipeline

Lis INTENT.md avant toute chose.

CRM de prospection mono-utilisateur. L'intention du produit et les critères d'acceptation sont dans @INTENT.md.

@AGENTS.md

## Règles de travail
- On travaille uniquement sur la branche `dev`. Jamais de commit direct sur `main`.
- Repo GitHub public : aucun secret dans le code ni dans les commits (`.env*` est ignoré, tout comme `*.db` / `*.sqlite`).
- Hors périmètre : authentification, comptes, droits, multi-utilisateur.

## Stack
Next.js 16 (App Router), React 19, TypeScript strict, Tailwind 4, shadcn, Vitest, pnpm. Déploiement sur Vercel.
Base : libSQL (`@libsql/client`). En local, fichier `pipeline.db` à la racine (ignoré par git) ; en ligne, Turso via `DATABASE_URL` et `DATABASE_AUTH_TOKEN`. Schéma et migrations dans `src/data/db.ts` (versionnées par `PRAGMA user_version`).
Découpage en lots et critères d'acceptation : `lots.md`.

- shadcn est configuré en style `base-nova` : les composants reposent sur `@base-ui/react`, **pas Radix**. Ajouter un composant : `pnpm shadcn add <nom>` (atterrit dans `src/components/ui`).
- `cn` vient du paquet `cn` (`src/lib/utils.ts`), pas de `clsx` + `tailwind-merge`.
- Alias d'import : `@/*` → `src/*` (aussi résolu dans Vitest).

## Architecture en 3 couches
- **Présentation** : `src/app`, `src/components`.
- **Service** : `src/services`, pour les règles de suivi (appelé / non appelé ; accepté / refusé / en attente).
- **Données** : `src/data`. Seule couche qui parle à la base. Changer de base ne doit modifier que cette couche.

Sens des dépendances : présentation → service → données. La présentation n'importe jamais `src/data` ni le client libSQL directement.

Défauts métier : un nouveau contact est « non appelé » et « en attente ».

## Tests
Un seul `vitest.config.mts` avec deux projets Vitest (`unit`, `integration`), tous deux en environnement `node`.
- Unitaires : `__tests__/unit/**/*.test.ts`. Les règles de suivi y sont testées.
- Intégration : `__tests__/integration/**/*.test.ts`. Base libSQL réelle dans un fichier temporaire : appeler `setupTestDatabase()` (`__tests__/integration/helpers/test-db.ts`) en tête de fichier.
- Architecture : `__tests__/unit/architecture/layers.test.ts` vérifie la séparation des couches à partir des imports réels.
- Composants : `__tests__/unit/components/*.test.ts`, avec Testing Library ; ces fichiers commencent par `// @vitest-environment jsdom` et rendent le composant avec `createElement` (pas de JSX dans un `.ts`).
- Seuls les fichiers `.test.ts` sont pris en compte (pas `.spec.ts`, pas `.tsx`).

## Commandes
```bash
pnpm dev                    # http://localhost:3000
pnpm build
pnpm lint
pnpm test                   # les deux suites
pnpm test:unit
pnpm test:integration
pnpm test:unit __tests__/unit/<fichier>.test.ts # un seul fichier
pnpm test:unit -t "nom du test"             # un seul test par nom
```
