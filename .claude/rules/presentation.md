---
paths:
  - "src/app/**"
  - "src/components/**"
---

# Couche présentation

Périmètre : `src/app`, `src/components`.

## Règles
- **N'appelle que la couche service.** Les données et actions passent par `@/services/*`.
  Jamais d'import de `@/data/*` ni du client libSQL (`@libsql/*`), y compris pour un simple type.
  Un type dont la présentation a besoin est exposé (ou ré-exporté) par le service.
- **N'utilise que les composants du design system** : les composants shadcn de
  `src/components/ui` et ceux construits dessus (ex. `StatusBadge`, `StageBadge`).
  Besoin d'un composant manquant : `pnpm shadcn add <nom>`, pas d'élément maison stylé à la main.
- **Aucune couleur en dur.** Uniquement les tokens du thème Doux :
  `bg-primary`, `text-muted-foreground`, `border-border`, `text-success`, `bg-warning-muted`…
  Interdits : hex (`#c4622d`), `rgb()`, `hsl()`, `oklch()` et les palettes Tailwind
  (`bg-red-500`, `text-gray-600`, `bg-black`…).
  Les couleurs ne se définissent que dans `src/app/globals.css`, en clair et en sombre.
- Statuts de suivi et étapes : toujours via `StatusBadge` / `StageBadge` (`src/components/status-badge.tsx`), jamais un badge recoloré à la main. Libellés et couleurs des statuts et des étapes ne se définissent que là.
- Exception : `src/components/ui` est généré par shadcn. On ne l'édite que pour l'adapter au thème,
  sans y ajouter de couleur en dur.

## Comment vérifier
```bash
# 1. Séparation des couches (imports directs, indirects, dynamiques, composants client)
pnpm test:unit __tests__/unit/architecture/layers.test.ts

# 2. Imports interdits signalés par ESLint
pnpm lint

# 3. Aucune couleur littérale — doit ne rien afficher
grep -rnE "#[0-9a-fA-F]{3,8}\b|\b(rgba?|hsla?|oklch)\(" src/app src/components \
  --include=*.ts --include=*.tsx --exclude-dir=ui

# 4. Aucune couleur de palette Tailwind — doit ne rien afficher
grep -rnE "\b(bg|text|border|ring|fill|stroke|from|to|via|outline|shadow)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)\b" \
  src/app src/components --exclude-dir=ui

# 5. Rendu : /design-system et /simulation, en clair puis en sombre
pnpm build
```
