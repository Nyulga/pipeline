# Plan · Lot 2 · Donner une étape à chaque contact et voir les contacts par étape

Plan validé avant l'écriture (skill `lot`). Sources : `lots.md` (lot 2), `INTENT.md`, `.claude/rules/`, issue #2.
L'étape d'un contact se déduit de *appelé* + *réponse* : À appeler · Appelé, en attente · Accepté · Refusé.

## Tâches par couche

### Données (`src/data/contacts-repository.ts`)
- `selectContactRecordById(id)` : la ligne, ou `null` si l'id est inconnu.
- `updateContactTracking(id, { called, response })` : un `UPDATE … RETURNING` paramétré. Renvoie la ligne modifiée, ou `null` si l'id est inconnu.
- Aucune migration : `called` et `response` existent depuis le lot 1, et leurs CHECK protègent les valeurs. Aucune règle de suivi dans cette couche.

### Service
- `src/services/tracking.ts` contient des règles pures, sans accès à la base :
  - `stageOf` : l'étape se déduit de appelé + réponse ;
  - `STAGES` : les 4 étapes, dans l'ordre ;
  - `RESPONSES` : les 3 réponses ;
  - `markCalled` : garde la réponse ;
  - `markNotCalled` : remet la réponse à « en attente » ;
  - `withResponse` : « accepté » ou « refusé » marque aussi appelé, « en attente » ne change pas l'appel ;
  - `groupByStage` : les 4 colonnes, toujours présentes, dans l'ordre des contacts ;
  - `isContactResponse`.
- Le type `Contact` est défini dans `tracking.ts` et ré-exporté par `contacts.ts`. Il doit être importable par un composant client sans tirer la couche données, sinon le test d'architecture échoue.
- Dans `src/services/contacts.ts` :
  - `setCalled(id, called)` et `setResponse(id, response)` lisent le contact, appliquent la règle, puis enregistrent ;
  - erreurs renvoyées : « Contact introuvable. » et « Réponse inconnue. ».

### Présentation
- `src/app/actions.ts` : `setCalledAction` et `setResponseAction`. Elles vérifient les entrées (« Requête invalide. » sinon), appellent le service, puis `revalidatePath("/")`.
- `ContactCard` (client) :
  - bouton « Marquer appelé » / « Non appelé » ;
  - sélecteur de réponse `ToggleGroup` ;
  - badges `StatusBadge` ;
  - message d'erreur éventuel sur la carte.
- `StageBoard` : 4 colonnes avec titre, compteur, et « Aucun contact » quand une colonne est vide. Il ne fait qu'afficher ce qu'il reçoit.
- `ContactsView` (client) :
  - onglets « Liste » / « Par étape » ;
  - `useOptimistic` applique les mêmes règles que le service, puis la Server Action est appelée ;
  - si le serveur refuse, l'erreur s'affiche sur la carte.
- `ContactList` (serveur) passe la liste à `ContactsView`.

## Critère → tests → couche

| Critère | Tests | Couche |
|---|---|---|
| **1. Je marque appelé, c'est visible dans la liste** | `unit/services/tracking` « marquer appelé garde la réponse » ; `unit/services/contacts` « setCalled… » | service |
| | `integration/data/contacts-repository` « enregistre appelé + réponse… » · « relit par id… » · « ne modifie que le contact visé » | données |
| | `integration/services/tracking` « je marque appelé, c'est visible dans la liste » · « le suivi persiste après réouverture » | service + données |
| | `integration/app/actions` « setCalledAction… » · « refuse les entrées invalides… » ; `unit/components/contact-card` (badge et bouton) ; `unit/components/contacts-view` « cliquer sur Marquer appelé… » | présentation |
| **2. Je marque la réponse, c'est visible dans la liste** | `unit/services/contacts` « setResponse… » · « réponse inconnue… » | service |
| | `integration/data/contacts-repository` « refuse une réponse hors liste à la mise à jour » | données |
| | `integration/services/tracking` « je marque la réponse… » | service + données |
| | `integration/app/actions` « setResponseAction… » ; `unit/components/contact-card` (sélecteur) ; `unit/components/contacts-view` « une erreur du serveur s'affiche sur la carte » | présentation |
| **3. Accepté ou refusé ⇒ appelé ; non appelé ⇒ en attente** | `unit/services/tracking` « accepté / refusé marque appelé » · « non appelé remet en attente » · « refusé remis en attente reste appelé » · « ne renvoie que le suivi » | service |
| | `integration/services/tracking` « repasser en non appelé remet en attente » | service + données |
| | `unit/components/contacts-view` « choisir Accepté… » · « repasser en Non appelé… » | présentation |
| **4. Vue par étape : bonne colonne, nombre par étape** | `unit/services/tracking` « stageOf » (4 cas) · « STAGES » · « groupByStage » | service |
| | `integration/services/tracking` « chaque contact apparaît dans la bonne colonne » | service + données |
| | `unit/components/stage-board` (colonnes, rangement, compteurs, « Aucun contact ») ; `unit/components/contacts-view` « l'onglet Par étape… » | présentation |

## Décisions validées
1. Repasser un contact « accepté » en « non appelé » efface sa réponse : le critère est appliqué tel quel.
2. Un contact appelé ou refusé, remis « en attente », reste appelé, à l'étape « Appelé · en attente ».
3. « Visible dans la liste » est prouvé par des tests de composants (jsdom) et par des tests sur une vraie base, pas par un test dans un vrai navigateur.
4. Hors lot, signalé mais pas codé : faire respecter « accepté ou refusé ⇒ appelé » par la base, avec un trigger. Ce serait une règle métier dans la couche données.

## Correctifs après revue (PR #7, commit `fix(lot-2)`)
- Si une action serveur échoue (réseau, base injoignable), la page ne plante plus : la carte affiche « Impossible d'enregistrer, réessaie. ». `src/app/error.tsx` sert de filet de sécurité.
- « Annuler l'appel » remplace « Non appelé ». Le bouton est désactivé tant que le contact a une réponse, avec l'explication « Remets d'abord la réponse « En attente ». » (règle pure `canCancelCall`). Le service garde la règle « non appelé ⇒ en attente ».
- La carte montre l'étape dans un seul badge (`StageBadge`). En vue « Par étape », la colonne l'indique déjà.
- Les libellés et les couleurs des étapes sont dans `src/components/status-badge.tsx`. `STAGES` ne garde que l'ordre.
- `src/services/contact-model.ts`, sans accès à la base, regroupe `Contact`, `ContactResponse`, `RESPONSES`, `isContactResponse` et `CONTACT_FIELDS`.
- Le service vérifie « appelé » comme il vérifie la réponse (« État d'appel inconnu. »).

## Correctif suivant (PR #8, commit `fix(lot-2)`)
- La lecture puis l'écriture du suivi se font dans une seule transaction d'écriture (`updateContactTracking(id, compute)`, couche données). Le service fournit le calcul : la règle reste dans le service. Si le calcul échoue, rien n'est écrit.
- Les transactions d'écriture d'un même processus passent l'une après l'autre : en local, le client libSQL est synchrone, et une seconde transaction ouverte en même temps échouerait (`SQLITE_BUSY`).
