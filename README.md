# Pipeline

CRM de prospection mono-utilisateur. Voir [INTENT.md](./INTENT.md).

## Stack

Next.js (App Router), TypeScript, Tailwind, shadcn, Vitest, pnpm. Base : libSQL (fichier local en dev, Turso en production).

## Structure

- `src/app`, `src/components` : présentation
- `src/services` : règles métier
- `src/data` : accès à la base (seule couche qui parle à la base)
- `tests/unit`, `tests/integration` : tests

## Commandes

```bash
pnpm install
pnpm dev               # http://localhost:3000
pnpm build
pnpm lint
pnpm test              # tous les tests
pnpm test:unit
pnpm test:integration
```
