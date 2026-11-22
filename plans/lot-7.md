# Plan · Lot 7 · Accueil « À appeler maintenant »

Issue #15. Pas de changement de base : tout s'appuie sur l'appel, la réponse et la relance existants.

## Règles (service, pures, testées)
- **File d'appel** `callQueue(contacts, today)` (`src/services/call-queue.ts`) : ne prend que les contacts « en attente », dans cet ordre :
  1. relance en retard, la plus ancienne d'abord ;
  2. relance du jour ;
  3. jamais appelé et sans relance prévue, le plus ancien ajout d'abord.

  En cas d'égalité, on départage par nom. Restent hors de la file : les acceptés et les refusés, un contact déjà appelé sans relance due, et un contact dont la relance est dans le futur. Ce dernier cas est celui d'un « Plus tard ».
- **Lendemain** `nextDay(day)` : AAAA-MM-JJ + 1 jour, y compris en fin de mois, en fin d'année et le 29 février. « Plus tard » enregistre la relance au lendemain du jour à Paris.
- **Filtre d'étape** `parseStage(value)` (`tracking.ts`) : une étape connue, sinon null. Une valeur inconnue dans l'adresse revient à « Tous ».
- **Date d'accueil** `formatGreetingDate(now)` : « lundi 23 novembre », à l'heure de Paris.

## Présentation
- **En-tête** :
  - « Bonjour » ;
  - la date du jour ;
  - « 3 personnes à rappeler », « 1 personne à rappeler » ou « Personne à rappeler » (compte de la file).
- **Carte « À appeler maintenant »** (composant client `CallFocus`) : la première personne de la file, avec nom, entreprise, numéro et état (relance en retard, du jour, ou jamais appelé).
  - **Appeler** : lien `tel:` vers le numéro, et le contact est marqué appelé. S'il n'a pas de numéro, le bouton devient « Marquer appelé ».
    La carte **reste sur la même personne** pour qu'on note l'issue de l'appel. Sans ça, un contact jamais appelé disparaîtrait de la carte au moment où l'on décroche.
  - **Accepté** et **Refusé** : enregistrent la réponse, et la carte passe à la personne suivante.
  - **Plus tard** : relance au lendemain, et la carte passe à la suivante.
  - En dessous : « Ensuite : Claire Martin, Thomas Bernard… » (les 3 suivants).
  - File vide : « Personne à appeler pour l'instant. » et un bouton « Ajouter un contact ». Jamais de carte vide.
  - Mise à jour optimiste et message d'erreur, comme `ContactsView` (mêmes actions serveur, rien de nouveau dans `actions.ts`).
- **Filtres en pastilles** au-dessus de la liste : Tous · À appeler · Appelé · en attente · Accepté · Refusé, chacun avec son nombre.
  - Ce sont des liens `?etape=…` qui gardent la recherche `q`.
  - Les nombres portent sur les contacts de la recherche en cours.
- « À relancer aujourd'hui » (lot 3) reste en place, sous la carte.

## Données
- Rien de nouveau. Test d'intégration du parcours « Plus tard » sur une vraie base : `setFollowUp` au lendemain, puis le contact sort de la file du jour et y revient le lendemain.

## Tests (critère → test)
| Critère | Test | Couche |
|---|---|---|
| « Bonjour », date (Paris), nombre à rappeler | `greeting.test.ts` : 23 h 30 UTC le 22/11 donne « lundi 23 novembre » ; singulier, pluriel et zéro | présentation + service |
| Ordre de la prochaine personne, acceptés et refusés exclus | `call-queue.test.ts` : chaque groupe, l'ordre interne, toutes les exclusions | service |
| Appeler ouvre le numéro et marque appelé ; Accepté / Refusé enregistrent | `call-focus.test.ts` : `href="tel:…"`, actions appelées avec les bons arguments, la carte reste après « Appeler » | présentation |
| « Plus tard » : lendemain et personne suivante | `call-queue.test.ts` (`nextDay`), `call-focus.test.ts` (action avec le lendemain, la suivante s'affiche), intégration `call-queue.test.ts` | service, présentation, données |
| Personne à appeler : message, pas de carte vide | `call-focus.test.ts` | présentation |
| Filtre : seuls les contacts de l'étape, nombres justes, gardé dans l'adresse | `stage-filter.test.ts` (liens `?etape=` avec `q`, nombres) ; `contact-list.test.ts` (liste filtrée) ; `tracking.test.ts` (`parseStage`) | présentation + service |

## Après la revue de la PR #21
- La recherche garde le filtre d'étape : un champ caché `etape` est envoyé avec la recherche, et « Effacer la recherche » garde l'étape.
- `CallFocus` : chaque changement local a sa propre entrée.
  - Une nouvelle liste du serveur ne retire que les changements déjà enregistrés ; ceux en cours restent.
  - Un échec n'annule que son propre changement.
  - Le nombre à rappeler compte la personne affichée.
- **Assumé** : un contact appelé, en attente et sans relance sort de la file au rechargement. C'est la règle choisie : c'est à l'utilisateur de lui fixer une relance (« Plus tard » ou fiche). Le lot 8, avec « Annuler », et le panneau du lot 9 rendront cela plus visible.
