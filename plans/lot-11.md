# Plan · Lot 11 · Téléphone et finitions

Issue #19. Pas de changement de base ni de service : tout est dans la présentation (et `globals.css`).

## Choix
### Barre d'onglets et « + Ajouter » (téléphone seulement, sous `md`)
- `MobileTabBar` fixée en bas, trois onglets (cf. `plans/refonte-b.md`) :
  - **Aujourd'hui** → haut de l'accueil (`/#aujourdhui` : bonjour, « À appeler maintenant », relances, ta semaine) ;
  - **Contacts** → `/#mes-contacts` (vue « Liste ») ;
  - **Étapes** → `/?vue=etapes#mes-contacts` (vue « Par étape »).
- La vue Liste / Par étape passe dans l'adresse (`?vue=etapes`), gardée comme `q` et `etape` : c'est ce qui permet à l'onglet « Étapes » de l'ouvrir. L'onglet de la vue en cours porte `aria-current="page"`. Pas de suivi du défilement pour « Aujourd'hui » / « Contacts » (je le signale, non codé).
- **Bouton flottant « + Ajouter »** au-dessus de la barre, à droite ; il ouvre le même formulaire que le bouton de l'en-tête, qui est masqué sur téléphone (`AddContactDialog` prend une variante `floating`).
- La page garde une marge basse sur téléphone pour que la barre ne cache rien ; le message « Annuler » (sonner) remonte au-dessus de la barre.
- **390 px sans défilement horizontal** : je passe les blocs qui débordent (noms et e-mails longs → `truncate`/`break-words`, grilles en `min-w-0`, filtres d'étape qui passent à la ligne). Ce critère ne se mesure pas dans jsdom : je le vérifie dans un navigateur à 390 px (Chrome si l'extension répond, sinon je te le laisse à vérifier).

### Zones à toucher ≥ 44 px
- Sur écran tactile (`pointer-coarse:`), boutons, champs, sélecteurs, onglets, éléments de menu et liens d'action (noms, téléphone, e-mail) font au moins 44 px (`min-h-11`, `min-w-11` pour les icônes). Réglé dans les composants `ui` (adaptation au thème, sans couleur) et dans les liens de l'app. À la souris, rien ne change.

### Listes vides : un message et l'action pour la remplir
| Liste | Message | Action |
|---|---|---|
| Mes contacts (aucun) | « Ta liste est vide » | bouton « Ajouter un contact » |
| Recherche sans résultat | « Aucun contact ne correspond à … » | lien « Effacer la recherche » |
| Filtre d'étape vide | « Aucun contact à l'étape … » | lien « Voir tous les contacts » |
| Notes (aucune) | « Aucune note pour l'instant. » | le formulaire juste au-dessus, cité : « Écris la première ci-dessus. » |
| À relancer aujourd'hui / relances à venir | « Personne à relancer… » | « Fixe une relance depuis la fiche d'un contact. » (pas de bouton : il faut choisir un contact) |
| Colonne d'étape vide (vue Par étape) | « Aucun contact » | aucune (la colonne se remplit en changeant l'étape d'un contact) — je le signale |
- **Squelettes** : déjà en place pour chaque section ; je les vérifie tous et j'ajoute le manquant (aucun aujourd'hui, à confirmer en codant). Le panneau garde `fallback={null}` (lot 9).

### « Réduire les animations »
- Dans `globals.css`, sous `@media (prefers-reduced-motion: reduce)` : transitions et animations ramenées à ~0 sur tous les éléments (dont les squelettes qui pulsent, le panneau, les dialogs et le message « Annuler »), défilement doux coupé.

## Tests (critère → test)
| Critère | Test | Couche |
|---|---|---|
| Téléphone : barre d'onglets en bas, « + Ajouter » flottant | `mobile-tab-bar.test.ts` (3 liens, adresses, `aria-current`, masquée à partir de `md`) ; `add-contact-dialog.test.ts` (variante flottante ouvre le formulaire) ; `contacts-view.test.ts` (`vue=etapes` ouvre « Par étape ») ; `contact-links.test.ts` (`vue` gardé) | présentation |
| 390 px : aucun défilement horizontal | vérification au navigateur (non automatisable en jsdom), décrite dans la PR | présentation (manuel) |
| Zones à toucher ≥ 44 px | `touch-targets.test.ts` : chaque taille de `Button`, `Input`, `SelectTrigger`, `TabsTrigger`, et les liens d'action rendus portent `pointer-coarse:min-h-11` | présentation |
| Chaque liste vide : message + action ; chargements en squelette | `contact-list.test.ts`, `note-list.test.ts`, `due-follow-ups.test.ts`, `week-summary.test.ts` (message et action de chaque état vide) | présentation |
| « Réduire les animations » : aucune transition | `theme.test.ts` : `globals.css` contient la règle `prefers-reduced-motion: reduce` qui coupe `transition-duration` et `animation-duration` sur `*` | présentation |

## Hors lot (signalé, pas codé)
- Suivi du défilement pour allumer « Aujourd'hui » / « Contacts » dans la barre.
- Ctrl K, ajout en une ligne, glisser-déposer entre étapes.

## Constaté en codant
- Squelettes : chaque section de l'accueil en a déjà un ; rien à ajouter.
- Changer de vue (Liste / Par étape) réécrit l'adresse sans recharger (`history.replaceState`), ce que Next suit.
- Le message « Annuler » remonte au-dessus de la barre et de « + Ajouter » sous 600 px (seuil « mobile » de sonner) ; entre 600 et 768 px, il garde sa place habituelle.
- Vérification à 390 px : l'extension Chrome n'a pas répondu, elle reste à faire dans un navigateur.
