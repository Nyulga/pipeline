# Plan · Lot 3 · Fixer la prochaine relance et voir « À relancer aujourd'hui »

Mode autonome demandé : ce plan est écrit puis exécuté sans arrêt de validation. Les lots 3, 4 et 5 sont livrés ensemble dans une seule PR.

## Choix
- **La fiche contact** n'existait pas encore. Elle arrive à `/contacts/[id]` : coordonnées, étape, et la prochaine relance avec son formulaire. Le lot 4 y ajoutera les notes. Sur les cartes, le nom devient un lien vers la fiche.
- **Date de relance** : un jour, sans heure (`AAAA-MM-JJ`), saisi avec `<input type="date">`.
- **« Aujourd'hui »** : le jour calendaire à Paris (`Intl`, fuseau `Europe/Paris`), calculé côté serveur à chaque requête.
- **Contacts concernés** : tout contact qui a une relance tombant aujourd'hui ou avant, sauf ceux qui ont la réponse « accepté » ou « refusé ».
- **Ordre** : du plus en retard au plus récent, puis par nom.

## Données (`src/data`)
- Migration 3 : `contacts.next_follow_up TEXT NULL`. Une contrainte CHECK impose le format `AAAA-MM-JJ`, et un index accélère la recherche.
- `ContactRecord.next_follow_up`, et `updateContactFollowUp(id, date | null)` qui renvoie la ligne, ou `null` si l'id est inconnu.

## Service (`src/services`)
- `follow-up.ts` contient des fonctions pures :
  - `todayInParis(now)` ;
  - `parseFollowUpDate(value)` : une date réelle au format `AAAA-MM-JJ`, ou vide pour effacer ;
  - `followUpState(contact, today)`, qui vaut `"aujourdhui"`, `"enRetard"` ou `null` ;
  - `dueFollowUps(contacts, today)`.
- `contacts.ts` :
  - `Contact.nextFollowUp` ;
  - `getContact(id)` ;
  - `setFollowUp(id, date)`, qui rejette une date invalide sans rien écrire et répond « Contact introuvable. » si besoin ;
  - `listDueFollowUps(now)`.

## Présentation
- `setFollowUpAction(id, date)` appelle `refresh()`.
- `FollowUpBadge` (« Aujourd'hui », « En retard ») vit dans `status-badge.tsx`.
- `DueFollowUpList` est la liste présentée, et `DueFollowUps` le composant serveur qui la remplit. La section « À relancer aujourd'hui » s'affiche en haut de l'accueil.
- `FollowUpForm` (client) :
  - affiche « Prochaine relance : 3 déc. 2026 » ou « Aucune relance prévue » ;
  - propose « Enregistrer » et « Effacer » ;
  - affiche les erreurs sur le champ ;
  - affiche « Impossible d'enregistrer, réessaie. » si l'enregistrement échoue.
- La page `/contacts/[id]` passe par `<Suspense>` et `connection()`. Un id inconnu donne `notFound()`.

## Critère → tests
| Critère | Tests |
|---|---|
| Je fixe la relance, elle s'affiche sur la fiche ; je peux l'effacer | intégration `services/follow-up.test.ts` « je fixe… » et « je l'efface » · `data/contacts-repository.test.ts` « relance » · unitaire `services/contacts.test.ts` setFollowUp · composant `follow-up-form.test.ts` · `app/actions.test.ts` setFollowUpAction |
| Relance aujourd'hui → « À relancer aujourd'hui » | unitaire `follow-up.test.ts` followUpState / dueFollowUps · intégration `services/follow-up.test.ts` · composant `due-follow-ups.test.ts` |
| Relance passée : présente, signalée en retard | mêmes fichiers, cas « en retard » · `status-badge.test.ts` FollowUpBadge |
| Accepté ou refusé : n'y apparaît plus | `follow-up.test.ts` et intégration, cas accepté / refusé |
| « Aujourd'hui » à l'heure de Paris | `follow-up.test.ts` todayInParis : 23 h 30 UTC en hiver et 22 h 30 UTC en été donnent déjà le lendemain ; 22 h 59 UTC en hiver, c'est encore le jour même |

## Preuves

### Rouge (tests écrits, avant le code)
```
 FAIL  |unit| __tests__/unit/components/due-follow-ups.test.ts [ __tests__/unit/components/due-follow-ups.test.ts ]
 FAIL  |unit| __tests__/unit/components/follow-up-form.test.ts [ __tests__/unit/components/follow-up-form.test.ts ]
 FAIL  |unit| __tests__/unit/services/follow-up.test.ts [ __tests__/unit/services/follow-up.test.ts ]
⎯⎯⎯⎯⎯⎯ Failed Tests 23 ⎯⎯⎯⎯⎯⎯⎯
 FAIL  |integration| __tests__/integration/app/actions.test.ts > setFollowUpAction (lot 3) > fixe puis efface la prochaine relance, et rafraîchit la page
 FAIL  |integration| __tests__/integration/app/actions.test.ts > setFollowUpAction (lot 3) > refuse un id ou une date invalides sans rien écrire ni rafraîchir
 FAIL  |integration| __tests__/integration/data/contacts-repository.test.ts > relance (lot 3) > un nouveau contact n'a pas de relance
 FAIL  |integration| __tests__/integration/data/contacts-repository.test.ts > relance (lot 3) > enregistre puis efface la prochaine relance
 FAIL  |integration| __tests__/integration/data/contacts-repository.test.ts > relance (lot 3) > renvoie null pour un id inconnu
 FAIL  |integration| __tests__/integration/data/contacts-repository.test.ts > relance (lot 3) > garde la relance quand le suivi change
 FAIL  |integration| __tests__/integration/data/migrations.test.ts > migrations > migre une base de la version 1 en gardant ses contacts et leur suivi
 FAIL  |integration| __tests__/integration/data/migrations.test.ts > migration 3 · prochaine relance (lot 3) > refuse une relance qui n'est pas au format AAAA-MM-JJ
 FAIL  |integration| __tests__/integration/services/follow-up.test.ts > prochaine relance : service + données (critères du lot 3) > je fixe la prochaine relance d'un contact à une date, elle s'affiche sur sa fiche
 FAIL  |integration| __tests__/integration/services/follow-up.test.ts > prochaine relance : service + données (critères du lot 3) > je peux l'effacer
 FAIL  |integration| __tests__/integration/services/follow-up.test.ts > prochaine relance : service + données (critères du lot 3) > une date invalide n'écrit rien
 FAIL  |integration| __tests__/integration/services/follow-up.test.ts > prochaine relance : service + données (critères du lot 3) > « À relancer aujourd'hui » : relance du jour, relance passée en retard, jamais d'accepté ni de refusé
 FAIL  |unit| __tests__/unit/components/contact-card.test.ts > ContactCard : la fiche (lot 3) > le nom mène à la fiche du contact
 FAIL  |unit| __tests__/unit/components/contact-card.test.ts > ContactCard : la fiche (lot 3) > montre la prochaine relance quand il y en a une
 FAIL  |unit| __tests__/unit/components/status-badge.test.ts > FollowUpBadge : l'état d'une relance (lot 3) > « Aujourd'hui » et « En retard », chacun avec sa couleur du thème
 FAIL  |unit| __tests__/unit/components/status-badge.test.ts > FollowUpBadge : l'état d'une relance (lot 3) > affiche le libellé dans un badge
 FAIL  |unit| __tests__/unit/services/contacts.test.ts > getContact (fiche) > renvoie le contact avec sa prochaine relance
 FAIL  |unit| __tests__/unit/services/contacts.test.ts > getContact (fiche) > renvoie null pour un id inconnu
 FAIL  |unit| __tests__/unit/services/contacts.test.ts > setFollowUp (lot 3) > fixe la prochaine relance à une date
 FAIL  |unit| __tests__/unit/services/contacts.test.ts > setFollowUp (lot 3) > une date vide efface la relance
 FAIL  |unit| __tests__/unit/services/contacts.test.ts > setFollowUp (lot 3) > refuse une date invalide sans rien écrire
 FAIL  |unit| __tests__/unit/services/contacts.test.ts > setFollowUp (lot 3) > signale un contact introuvable
 FAIL  |unit| __tests__/unit/services/contacts.test.ts > listDueFollowUps (lot 3) > garde les relances du jour (heure de Paris) et en retard, hors acceptés et refusés
 Test Files  10 failed | 11 passed (21)
      Tests  23 failed | 115 passed (138)
```

### Vert (après le code)
```
 Test Files  21 passed (21)
      Tests  158 passed (158)
```
