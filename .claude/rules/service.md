---
paths:
  - "src/services/**"
  - "__tests__/unit/services/**"
---

# Couche service

Périmètre : `src/services`.

## Règles
- **Porte les règles métier** du suivi :
  - un nouveau contact est « non appelé » et « en attente » ;
  - appelé / non appelé ;
  - réponse : accepté / refusé / en attente.
  Aucune de ces règles ne vit dans un composant ni dans la couche données.
- **Les tests sont écrits avant le code.** Pour chaque règle :
  1. écrire le test dans `__tests__/unit/services/<nom>.test.ts` ;
  2. le lancer et le voir échouer (rouge) ;
  3. écrire le code minimal qui le fait passer (vert) ;
  4. refactorer, tests toujours verts.
- Dépend uniquement de `@/data/*`, jamais de `react`, `next`, `@/components`, `@/app` ni `@libsql/*`.
- Fonctions pures dès que possible : la règle se teste sans base.
- Un service appelé depuis un composant client (`"use client"`) ne doit pas atteindre la base :
  passer par un composant serveur ou une server action.

## Comment vérifier
```bash
# 1. Séparation des couches
pnpm test:unit __tests__/unit/architecture/layers.test.ts

# 2. Imports interdits signalés par ESLint
pnpm lint

# 3. Chaque service a son fichier de test
for f in src/services/*.ts; do
  t="__tests__/unit/services/$(basename "$f" .ts).test.ts"
  [ -f "$t" ] || echo "Test manquant : $t"
done

# 4. Les tests passent
pnpm test:unit

# 5. Test d'abord : dans l'historique, le test arrive avant le code ou dans le même commit
git log --oneline --name-status -- src/services __tests__/unit/services
```
