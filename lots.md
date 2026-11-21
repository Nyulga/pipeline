# Lots · Pipeline

Découpage du produit décrit dans [INTENT.md](INTENT.md) en 5 lots livrables un par un.
Chaque lot : tests du service écrits d'abord, tests d'intégration sur une vraie base libSQL, vérification dans l'app, commit sur `dev`, validation avant le lot suivant.

L'« étape » d'un contact est son suivi, déduit de *appelé* et de la *réponse* :

| Étape | Appelé | Réponse |
|---|---|---|
| À appeler | non | en attente |
| Appelé · en attente | oui | en attente |
| Accepté | oui | accepté |
| Refusé | oui | refusé |

---

## Lot 1 · Ajouter un contact et voir la liste
Un contact a un nom (obligatoire), une entreprise (texte libre), un téléphone et un e-mail facultatifs.

**Critères d'acceptation**
- J'ajoute un contact, il apparaît dans la liste.
- Un nouveau contact est « non appelé » et « en attente » par défaut.
- Je ferme puis rouvre l'app : mes contacts sont toujours là, avec leur suivi.
- Un nom vide ou un e-mail mal formé est refusé, avec un message sur le champ concerné.

## Lot 2 · Donner une étape à chaque contact et voir les contacts par étape
**Critères d'acceptation**
- Je marque un contact comme appelé, l'information est visible dans la liste.
- Je marque la réponse d'un contact (accepté, refusé ou en attente), l'information est visible dans la liste.
- Donner une réponse « accepté » ou « refusé » marque aussi le contact comme appelé ; le repasser en « non appelé » remet sa réponse à « en attente ».
- Dans la vue par étape, chaque contact apparaît dans la bonne colonne, avec le nombre de contacts par étape.

## Lot 3 · Fixer la prochaine relance et voir « À relancer aujourd'hui »
**Critères d'acceptation**
- Je fixe la prochaine relance d'un contact à une date, elle s'affiche sur sa fiche ; je peux l'effacer.
- Un contact dont la relance est aujourd'hui apparaît dans « À relancer aujourd'hui ».
- Une relance passée y apparaît aussi, signalée en retard.
- Un contact accepté ou refusé n'y apparaît plus.
- « Aujourd'hui » s'entend à l'heure de Paris.

## Lot 4 · Ajouter des notes datées et retrouver un contact
**Critères d'acceptation**
- J'ajoute une note à un contact, elle apparaît sur sa fiche avec sa date, les plus récentes d'abord.
- Une note vide est refusée.
- Je tape une partie du nom, de l'entreprise, du téléphone, de l'e-mail ou d'une note : le contact ressort, sans tenir compte des majuscules ni des accents.

## Lot 5 · Exporter les contacts en CSV
**Critères d'acceptation**
- Je clique sur « Exporter en CSV », je récupère un fichier `pipeline-contacts-AAAA-MM-JJ.csv`.
- Il s'ouvre correctement dans Excel (accents compris) avec tous les contacts : nom, entreprise, téléphone, e-mail, appelé, réponse, étape, prochaine relance, date de création, dernière note.
- Une valeur contenant `;`, des guillemets ou un retour à la ligne ne casse pas le fichier ; une valeur commençant par `=`, `+`, `-` ou `@` n'est pas interprétée comme une formule.
