# Plan · Refonte « Doux » (direction B)

Choix de l'utilisateur (2026-11-22) : direction **B · Doux** de la proposition
(https://claude.ai/artifact/HNP4gwxYtqPDvT3buEwq59) : grands arrondis, couleurs douces par étape,
gros boutons, pensé pour le téléphone, accueil centré sur la prochaine personne à appeler.

Découpage en 6 lots (6 à 11), livrés un par un avec le skill `lot` (plan détaillé validé, TDD,
une PR par lot). Chaque lot laisse l'app utilisable. Les règles des couches restent les mêmes :
toute règle nouvelle (priorité, statistiques, annulation) vit dans `src/services` et a ses tests unitaires.

## Lot 6 · Thème « Doux »
Remplace le thème « Papier » dans `globals.css` (clair et sombre), sans toucher aux écrans.
- Police Plus Jakarta Sans (texte et titres), arrondis larges, accent violet, une couleur douce par étape.
- `status-badge.tsx` : pastilles arrondies aux couleurs des étapes.
- Page `/design-system` mise à jour.

**Critères**
- Toutes les pages prennent le nouveau thème, en clair et en sombre ; aucune couleur en dur (vérifications de `presentation.md`).
- Chaque étape a sa couleur, distincte des autres, dans les deux thèmes.
- Le texte de chaque pastille et du bouton principal reste lisible : contraste ≥ 4,5:1 (test calculé depuis les tokens).

## Lot 7 · Accueil « À appeler maintenant »
- En haut : « Bonjour » et la date du jour (Paris), avec le nombre de personnes à rappeler.
- Une carte mise en avant : la prochaine personne à appeler, avec Appeler, Accepté, Refusé, Plus tard.
- Filtres en pastilles par étape, avec leur nombre (dans l'URL, pour garder le filtre au rechargement).

**Critères**
- La prochaine personne suit cet ordre : relance en retard (la plus ancienne d'abord), relance du jour, puis jamais appelé (le plus ancien ajout d'abord). Acceptés et refusés n'y sont jamais.
- « Appeler » ouvre le numéro et marque le contact appelé ; Accepté et Refusé enregistrent la réponse.
- « Plus tard » repousse la relance au lendemain et passe à la personne suivante.
- Personne à appeler : un message le dit, sans carte vide.
- Un filtre n'affiche que les contacts de son étape ; les nombres sont justes.

## Lot 8 · Suivi en un geste, avec « Annuler »
- Sur chaque contact, un seul bouton d'étape (menu : À appeler, Appelé · en attente, Accepté, Refusé) à la place des quatre boutons.
- Après chaque changement, un message « Marqué refusé · Annuler » pendant quelques secondes.

**Critères**
- Choisir une étape enregistre l'appel et la réponse correspondants (règles du lot 2 inchangées).
- « Annuler » remet exactement le suivi d'avant.
- Plus de bouton grisé « Annuler l'appel » : repasser en « À appeler » remet la réponse en attente.

## Lot 9 · Fiche dans un panneau
- Toucher un contact ouvre sa fiche par-dessus la liste : par le bas sur téléphone, à droite sur ordinateur.
- La fiche contient coordonnées, étape, relance et notes, comme la page actuelle.

**Critères**
- La liste reste en place derrière le panneau ; Échap ou le bouton Fermer le referme.
- L'adresse change (`/?contact=<id>`) : un rechargement rouvre le même panneau ; `/contacts/<id>` marche toujours.
- Ajouter une note ou changer la relance depuis le panneau met la liste à jour.

## Lot 10 · Ta semaine
- Encadré « Ta semaine » : appels passés, taux d'acceptation, relances des 7 prochains jours.
- **Couche données** : nouvelle colonne `called_at` (date du dernier appel), migration 5. Les contacts déjà appelés n'ont pas de date : ils ne comptent pas dans la semaine.

**Critères**
- « Appels passés » compte les contacts marqués appelés depuis lundi 0 h, heure de Paris.
- Taux d'acceptation = acceptés ÷ (acceptés + refusés), « — » s'il n'y a encore aucune réponse.
- Les chiffres se mettent à jour après chaque changement de suivi.

## Lot 11 · Téléphone et finitions
- Barre d'onglets en bas sur téléphone (Aujourd'hui, Contacts, Étapes) et bouton « + Ajouter » flottant.
- Zones à toucher d'au moins 44 px, transitions courtes (coupées si « réduire les animations »), chargements en squelette, états vides utiles.

**Critères**
- À 390 px de large : aucune barre de défilement horizontale, toutes les actions accessibles au pouce.
- Chaque liste vide affiche un message et l'action pour la remplir.
- Avec « réduire les animations », aucune transition.

## Hors de ces lots (à décider)
Palette Ctrl K, ajout en une ligne, glisser-déposer entre étapes : utiles surtout sur ordinateur.
Ils peuvent devenir les lots 12 et suivants.
