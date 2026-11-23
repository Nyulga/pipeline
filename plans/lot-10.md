# Plan · Lot 10 · Ta semaine

Issue #18. Une section « Ta semaine » sur l'accueil, sous « À relancer aujourd'hui », avec trois chiffres : appels passés, taux d'acceptation, relances des 7 prochains jours.

## Choix
- **Date d'appel** : nouvelle colonne `called_at` (instant ISO, UTC), migration 5. Les contacts déjà appelés gardent `NULL` et ne comptent pas.
- **Règle de `called_at`**, pure et dans le service (`nextCalledAt(avant, après, maintenant)`) :
  - passer de « non appelé » à « appelé » (Appeler, Appelé · en attente, Accepté, Refusé) : `called_at = maintenant` ;
  - rester appelé (en attente → accepté, accepté → refusé…) : la date ne bouge pas ;
  - repasser « À appeler » : `called_at = NULL`. Le contact n'est plus appelé, il ne compte plus.
  - Calculée dans la même transaction que le suivi : `TrackingRecord` gagne `calledAt`.
- **« Depuis lundi 0 h, heure de Paris »** : `weekStartInParis(now)` donne l'instant UTC du lundi 0 h à Paris, juste aussi les semaines du changement d'heure. Appels passés = contacts appelés avec `called_at >= cet instant`.
- **Taux d'acceptation** : acceptés ÷ (acceptés + refusés), sur **tous** les contacts, car une réponse n'a pas de date. Arrondi à l'entier (« 67 % ») ; « — » sans aucune réponse.
- **Relances des 7 prochains jours** : relances prévues d'aujourd'hui à J+6 (heure de Paris). Un nombre, puis la liste des noms avec leur jour ; chaque nom ouvre le panneau (lot 9). Les relances en retard restent dans « À relancer aujourd'hui ».
- **Mise à jour** : chaque action de suivi appelle déjà `refresh()` ; la section se relit avec l'accueil.
- **Turso** : la migration 5 s'applique d'elle-même au premier accès (`migrate` dans `getDb`) ; je la passe aussi avec `pnpm db:migrate` après la fusion si tu veux, sans jamais afficher le jeton.

## Couches
- **Données** (`db.ts`, `contacts-repository.ts`) : migration 5 (`ALTER TABLE contacts ADD COLUMN called_at TEXT`), `called_at` lu et écrit par `updateContactTracking`.
- **Service** : `contact-model` expose `calledAt` ; `tracking.ts` : `nextCalledAt` ; nouveau `week.ts` : `weekStartInParis`, `weekSummary(contacts, now)` (pur) et `getWeekSummary(now)`.
- **Présentation** : `week-summary.tsx` (section sous `Suspense`, avec squelette), chiffres en `Card`, aucune couleur en dur.

## Tests (critère → test)
| Critère | Test | Couche |
|---|---|---|
| Appels passés depuis lundi 0 h, Paris ; appels sans date exclus | `unit/services/week.test.ts` : `weekStartInParis` (lundi, dimanche soir, semaine du passage à l'heure d'été et d'hiver) ; `weekSummary` compte ≥ lundi, ignore avant lundi et `NULL` ; `unit/services/tracking.test.ts` : `nextCalledAt` (pose, garde, efface) ; intégration : migration 5 sur une base v4 (lignes gardées, `called_at` NULL), `setStage` pose puis efface `called_at` | service + données |
| Taux = acceptés ÷ (acceptés + refusés), « — » sinon | `week.test.ts` (2/3 → 67, aucun → null) ; `week-summary.test.ts` (« 67 % », « — ») | service + présentation |
| Relances des 7 prochains jours | `week.test.ts` : aujourd'hui et J+6 comptent, J+7 et hier non ; `week-summary.test.ts` : nombre et noms avec lien `?contact=` | service + présentation |
| Les chiffres se mettent à jour après chaque changement | intégration : `getWeekSummary` avant/après `setStage` ; les actions appellent `refresh()` (`actions.test.ts`) | service + données |

## Hors lot (à signaler, pas à coder)
- « Annuler » d'un « À appeler » remet un contact appelé avec la date d'**annulation** (la date d'origine est perdue). Il compte toujours dans la semaine, sauf si l'appel d'origine datait d'avant lundi.
