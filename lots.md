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

---

# Refonte « Doux » (lots 6 à 11)
Plan d'ensemble : `plans/refonte-b.md`.

## Lot 6 · Thème « Doux »
Remplace le thème « Papier » (clair et sombre) : police Plus Jakarta Sans, arrondis larges, accent violet, une couleur douce par étape. Page `/design-system` mise à jour.

**Critères d'acceptation**
- Toutes les pages prennent le nouveau thème, en clair et en sombre ; aucune couleur en dur.
- Chaque étape a sa couleur, distincte des autres, dans les deux thèmes.
- Le texte de chaque pastille et du bouton principal reste lisible : contraste ≥ 4,5:1.

## Lot 7 · Accueil « À appeler maintenant »
**Critères d'acceptation**
- En haut : « Bonjour », la date du jour (Paris) et le nombre de personnes à rappeler.
- Une carte met en avant la prochaine personne à appeler, dans cet ordre : relance en retard (la plus ancienne d'abord), relance du jour, puis jamais appelé (le plus ancien ajout d'abord). Acceptés et refusés n'y sont jamais.
- « Appeler » ouvre le numéro et marque le contact appelé ; « Accepté » et « Refusé » enregistrent la réponse.
- « Plus tard » repousse la relance au lendemain et passe à la personne suivante.
- Personne à appeler : un message le dit, sans carte vide.
- Des filtres par étape, avec leur nombre, n'affichent que les contacts de l'étape ; le filtre est gardé dans l'adresse.

## Lot 8 · Suivi en un geste, avec « Annuler »
**Critères d'acceptation**
- Sur chaque contact, un seul bouton d'étape (À appeler, Appelé · en attente, Accepté, Refusé) remplace les quatre boutons ; choisir une étape enregistre l'appel et la réponse correspondants.
- Après chaque changement, un message « Claire Martin : Refusé · Annuler » reste affiché quelques secondes ; « Annuler » remet exactement le suivi d'avant.
- Repasser en « À appeler » remet la réponse en attente ; plus de bouton grisé.

## Lot 9 · Fiche dans un panneau
**Critères d'acceptation**
- Toucher un contact ouvre sa fiche par-dessus la liste (par le bas sur téléphone, à droite sur ordinateur), avec coordonnées, étape, relance et notes.
- Échap ou « Fermer » referme le panneau ; la liste reste en place.
- L'adresse devient `/?contact=<id>` : un rechargement rouvre le panneau ; `/contacts/<id>` marche toujours.
- Ajouter une note ou changer la relance depuis le panneau met la liste à jour.

## Lot 10 · Ta semaine
**Critères d'acceptation**
- « Appels passés » compte les contacts marqués appelés depuis lundi 0 h, heure de Paris (nouvelle colonne `called_at`, migration 5 ; les appels d'avant n'ont pas de date et ne comptent pas).
- Taux d'acceptation = acceptés ÷ (acceptés + refusés), « — » sans aucune réponse.
- Relances des 7 prochains jours.
- Les chiffres se mettent à jour après chaque changement de suivi.

## Lot 11 · Téléphone et finitions
**Critères d'acceptation**
- Sur téléphone : barre d'onglets en bas et bouton « + Ajouter » flottant ; à 390 px, aucune barre de défilement horizontale.
- Zones à toucher d'au moins 44 px.
- Chaque liste vide affiche un message et l'action pour la remplir ; chargements en squelette.
- Avec « réduire les animations », aucune transition.
