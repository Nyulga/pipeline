# Plan · Lot 6 · Thème « Doux »

Issue #14. Le lot ne change que l'apparence : aucune règle métier, aucune donnée.

## Choix
- **Police** : Plus Jakarta Sans (texte et titres), via `next/font/google`. Elle remplace Fraunces et Source Sans 3.
  IBM Plex Mono reste pour les numéros et les dates, mais en petit et sans majuscules espacées.
- **Arrondis** : `--radius: 1rem`. Les cartes sont à environ 1,4 rem, les boutons et les champs à environ 0,8 rem, les pastilles toutes rondes (`rounded-full`).
- **Couleurs (clair)** :
  - fond lavande très pâle, cartes blanches ;
  - texte encre violet foncé, accent (`primary`) violet ;
  - bordures légères, ombres douces sur les cartes.
- **Couleurs (sombre)** : fond nuit violet, cartes un ton au-dessus, accent violet éclairci.
- **Une couleur douce par étape**, chacune en deux tokens (fond pâle et texte foncé), déclinée en clair et en sombre :

  | Étape | Couleur | Tokens |
  |---|---|---|
  | À appeler | bleu ciel | `info`, `info-muted` |
  | Appelé · en attente | ambre | `warning`, `warning-muted` |
  | Accepté | menthe | `success`, `success-muted` |
  | Refusé | corail | `destructive` et son fond pâle |

  Aujourd'hui, « À appeler » est gris. Il passe en bleu ciel pour être distinct des autres étapes.
  Les statuts (Appelé, En attente…) et les relances gardent les mêmes tokens, recolorés.
- **Pas de nouveau composant** : on retouche les tokens de `globals.css`, les badges de `status-badge.tsx` et quelques classes de mise en forme (`font-heading`, `rounded-sm`) dans les écrans existants.

## Présentation
- `src/app/layout.tsx` : charge Plus Jakarta Sans et Plex Mono ; retire Fraunces et Source Sans 3.
- `src/app/globals.css` : tokens « Doux » en clair et en sombre, avec `--font-sans` et `--font-heading` sur Jakarta et `--radius` à 1rem.
- `src/components/status-badge.tsx` :
  - pastilles `rounded-full` ;
  - « À appeler » en `bg-info-muted text-info` ;
  - « Refusé » sur un fond pâle dédié (`destructive-muted`), plutôt qu'un fond `/10` transparent, pour que le contraste soit garanti.
- `src/app/design-system/page.tsx` : titre « Doux », nuancier et typographie mis à jour, plus une ligne « une couleur par étape ».
- `.claude/rules/presentation.md` : « thème Papier » devient « thème Doux ».

## Service / Données
- Rien.

## Tests (critère → test)
| Critère | Test | Couche |
|---|---|---|
| Nouveau thème, aucune couleur en dur | `__tests__/unit/components/theme.test.ts` lit `globals.css` : police Jakarta sur `--font-sans` et `--font-heading`, `--radius` ≥ 0.75rem, teinte de `primary` violette (hue 270–310), en clair et en sombre. Les grep de `presentation.md` ne renvoient rien. | présentation |
| Chaque étape a sa couleur, distincte | même fichier : pour chaque étape, la couleur de texte de `stageStyles` est un token ; les quatre teintes sont deux à deux éloignées d'au moins 30°, en clair et en sombre. | présentation |
| Contraste ≥ 4,5:1 | même fichier : conversion oklch → sRGB et luminance WCAG, avec un fond translucide composé sur la carte. Il vérifie le texte de chaque pastille (étapes, statuts, relances) sur son fond, `primary-foreground` sur `primary`, `foreground` et `muted-foreground` sur `background` et `card`, dans les deux thèmes. | présentation |
| Pastilles arrondies | `status-badge.test.ts` : le badge rendu porte `rounded-full`. | présentation |

## Rouge attendu
Avec le thème Papier, ces tests doivent échouer :
- la police n'est pas Jakarta ;
- le rayon vaut 0.25rem ;
- la teinte de `primary` vaut 40, pas violet ;
- « À appeler » n'a pas de couleur propre ;
- les pastilles sont en `rounded-sm`.

## Vérification
- `pnpm test`, `pnpm lint` et les grep de `presentation.md`.
- `pnpm build`.
- Rendu de `/`, `/design-system` et d'une fiche, en clair et en sombre.
