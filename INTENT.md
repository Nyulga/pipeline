# Intention · Pipeline

## Produit
Un CRM de prospection pour une seule personne : moi.
J'y enregistre mes contacts et je suis où j'en suis avec chacun.
Pour chaque contact, je sais s'il a été appelé ou non, et s'il a accepté ma proposition, refusé, ou s'il n'a pas encore répondu.

## Architecture
Une architecture en 3 couches : présentation, service, données.
Seule la couche données parle à la base.
Une base légère type SQLite, qu'on peut migrer vers un service de base de données en ligne sans toucher au reste de l'app.
Les règles de suivi (appelé, accepté, refusé, en attente) ont des tests unitaires.

## Contraintes
Next.js, composants shadcn, déploiement sur Vercel.
Un seul utilisateur.

## Hors périmètre
Pas d'authentification, pas de comptes, pas de gestion de droits, pas de multi-utilisateur.

## Critères d'acceptation
- J'ajoute un contact, il apparaît dans la liste.
- Je ferme puis rouvre l'app : mes contacts sont toujours là, avec leur suivi.
- Je marque un contact comme appelé, l'information est visible dans la liste.
- Je marque la réponse d'un contact (accepté, refusé ou en attente), l'information est visible dans la liste.
- Un nouveau contact est « non appelé » et « en attente » par défaut.
- Passer à une base en ligne ne modifie que la couche données.
