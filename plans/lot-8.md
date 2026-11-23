# Plan · Lot 8 · Suivi en un geste, avec « Annuler »

Issue #16. Pas de changement de base : l'étape s'écrit avec l'appel et la réponse existants.

## Règles (service)
- `trackingForStage(stage)` (`tracking.ts`, pur) : l'appel et la réponse de chaque étape.

  | Étape | appelé | réponse |
  |---|---|---|
  | À appeler | non | en attente |
  | Appelé · en attente | oui | en attente |
  | Accepté | oui | accepté |
  | Refusé | oui | refusé |

  C'est l'inverse exact de `stageOf`, ce qui garde les règles du lot 2 : accepté ou refusé implique appelé, et non appelé implique en attente.
- `setStage(id, stage)` (`contacts.ts`) : une seule écriture, appel et réponse ensemble. Une étape inconnue n'écrit rien.
- **« Annuler »** remet l'étape d'avant, avec le même `setStage`. Comme chaque suivi correspond à une seule étape, revenir à l'étape d'avant remet exactement le suivi d'avant.
- `canCancelCall` disparaît : on peut repasser en « À appeler » depuis n'importe quelle étape, et « Annuler » rattrape une erreur.

## Présentation
- **Action serveur** `setStageAction(id, stage)` : même modèle que les autres (id vérifié, puis service, puis rafraîchissement).
- **Carte de contact** :
  - un seul bouton d'étape (la pastille de l'étape et une flèche) ouvre un menu (`dropdown-menu`, déjà présent) avec les 4 étapes, l'étape actuelle cochée ;
  - le bouton « Marquer appelé / Annuler l'appel », le sélecteur de réponse et la phrase grisée « Remets d'abord la réponse… » disparaissent.
- **Message « Annuler »** : après chaque changement d'étape, un message « Claire Martin : Refusé · Annuler » reste affiché 6 secondes.
  - Ce message apparaît depuis la liste, la vue par étape et la carte « À appeler maintenant » (Appeler, Accepté, Refusé).
  - Après « Plus tard », le message est « Relance demain · Annuler » ; « Annuler » remet la relance d'avant.
  - Composant : `sonner` via `pnpm shadcn add sonner`, le composant de notifications de shadcn. C'est **une nouvelle dépendance**. Le `<Toaster>` va dans `layout.tsx`, aux couleurs du thème.
- Mise à jour optimiste et message d'erreur inchangés. « Annuler » passe par le même chemin.

## Données
- Rien de nouveau (`updateContactTracking` suffit).

## Tests (critère → test)
| Critère | Test | Couche |
|---|---|---|
| Un seul bouton d'étape remplace les 4 boutons ; choisir une étape enregistre l'appel et la réponse | `tracking.test.ts` (`trackingForStage` pour chaque étape, aller-retour avec `stageOf`) ; `contact-card.test.ts` (le menu, les 4 étapes, plus de bouton « Marquer appelé » ni de sélecteur) ; `contacts-view.test.ts` (`setStageAction(id, étape)`, étape affichée tout de suite) ; intégration `tracking.test.ts` (`setStage` sur une vraie base, étape inconnue refusée) ; `actions.test.ts` | service, présentation, données |
| Message « … · Annuler » ; « Annuler » remet exactement le suivi d'avant | `contacts-view.test.ts` et `call-focus.test.ts` : le message apparaît, « Annuler » appelle `setStageAction(id, étape d'avant)` (ou `setFollowUpAction(id, relance d'avant)`) ; intégration : aller-retour Accepté → À appeler → Annuler, qui redonne Accepté | présentation, service + données |
| Repasser en « À appeler » remet en attente ; plus de bouton grisé | `tracking.test.ts` ; `contact-card.test.ts` (aucun bouton désactivé, même pour un contact accepté) | service, présentation |

## Après la revue de la PR #22
- **Carte « À appeler maintenant »** : « Annuler » remet aussi la carte comme avant. Avec Appeler, puis Refusé (ou Accepté, ou Plus tard), puis Annuler, la personne revient sur la carte, appelée.
- **Un seul message « Annuler » par contact** (`id` sonner `annuler-<id>`) : un nouveau geste remplace le message précédent, dont l'« Annuler » serait périmé.
- **Pas d'« Annuler »** pour un geste fait pendant qu'un autre geste sur le même contact s'enregistre encore : l'étape « d'avant » ne serait pas sûre.
- **Le menu d'étape se referme** après le choix (`closeOnClick` : par défaut, base-ui le laisse ouvert).
- **Vue compacte** : le nom accessible du bouton contient son texte visible, « Changer d'étape de X (Accepté) » (WCAG 2.5.3).
- **Assumé** : le message « Annuler » survit à un changement de page, puisque le `<Toaster>` est dans le layout. L'écriture se fait et la page se rafraîchit ; seul un éventuel échec ne serait affiché nulle part.
