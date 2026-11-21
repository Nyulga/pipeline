# Revue · Lots 3, 4 et 5 (avant PR)

Une revue de correction indépendante a été faite sur `origin/main...HEAD`, au niveau high. Elle a été suivie d'une relecture des décisions, couche par couche. Chaque constat a été vérifié par un test avant d'être corrigé ou écarté.

## Constats de la revue
| # | Constat | Gravité | Issue |
|---|---|---|---|
| 1 | Une note écrite pendant un changement de suivi échouerait (SQLITE_BUSY) | importante | **Non reproduit.** Un test de garde lance 30 écritures concurrentes (suivi, notes, contacts) : toutes passent, car une écriture simple attend le verrou. Le test est gardé, le code n'a pas changé. |
| 2 | « Enregistrer » avec une date incomplète (champ vide) effaçait la relance | importante | **Corrigé** (`fix(lot-3)`) : le message « Choisis une date complète. » s'affiche ; seul « Effacer » efface. |
| 3 | Après « Effacer la recherche », le champ gardait l'ancien texte | mineure | **Corrigé** (`fix(lot-4)`) : `key={query}`. |
| 4 | Fiche inconnue : HTTP 200 au lieu de 404 | mineure | **Accepté.** La page 404 s'affiche bien (avec `noindex`), mais en flux sous `<Suspense>`. Un vrai 404 obligerait à lire la base hors Suspense, ce que `cacheComponents` interdit sans mise en cache. L'app est mono-utilisateur et n'est pas indexée. |
| 5 | CSV : `'+33 6…` garde une apostrophe visible dans Excel | mineure | **Accepté.** C'est la parade OWASP contre l'injection de formules. Sans elle, Excel lirait `+33 6 12` comme une formule et afficherait une erreur. |
| 6 | Recherche : « coeur » ne trouvait pas « Cœur », ni les espaces multiples | mineure | **Corrigé** (`fix(lot-4)`) : ligatures œ/æ dépliées, espaces resserrés. |
| 7 | La base acceptait `2026-02-30` (CHECK par GLOB) | mineure | **Corrigé** (`fix(lot-3)`) : `CHECK (date(x) IS x)`. |

## Décisions, couche par couche

### Données
- **Relance = `TEXT` AAAA-MM-JJ** : un jour sans heure, comparable par ordre alphabétique, que SQLite valide avec `date()`. On le garde. Un horodatage introduirait des problèmes de fuseau pour une information qui n'a pas d'heure.
- **Table `notes` avec clé étrangère et `ON DELETE CASCADE`** : vérifié, libSQL active `foreign_keys` par défaut. On garde, prêt pour une future suppression de contact.
- **Migration 3 modifiée avant publication** : elle n'a jamais été déployée (main est en v2). En revanche, un `pipeline.db` local déjà passé en v3 ou v4 garde l'ancien CHECK par GLOB. Ce n'est pas grave, puisque le service valide la date de toute façon.
- **Écritures sérialisées dans le processus (`oneWriteAtATime`)** : utile en local, où le client est synchrone. Sur Vercel et Turso, plusieurs instances écrivent en parallèle et c'est Turso qui arbitre. Pas de changement nécessaire.

### Service
- **Recherche en mémoire** (tous les contacts et toutes les notes à chaque requête) : simple, et correcte pour les accents, ce que SQLite ne sait pas faire seul. Elle convient tant qu'il y a moins de quelques milliers de contacts. *Meilleure option si le volume grossit* : un index FTS5 (`unicode61 remove_diacritics 2`) dans la couche données, sans toucher au service. Pas utile aujourd'hui.
- **« Aujourd'hui » à Paris, calculé côté serveur à chaque requête** : on le garde. C'est la règle du lot, et le fuseau du navigateur ne compte pas.
- **Un contact accepté ou refusé garde sa date de relance** : il sort de « À relancer aujourd'hui », mais sa carte et sa fiche affichent encore la date. *Décision à prendre* : effacer la relance automatiquement au passage en accepté ou refusé, ou bien la garder et seulement cesser de l'afficher. Ce n'est pas codé, car c'est hors critères.
- **Libellés du CSV** : ils viennent du design system, que la route d'export (présentation) applique. Le service ne garde que les règles du format. Cela respecte la règle « libellés définis une seule fois ».

### Présentation
- **Recherche par formulaire GET (`/?q=`)** : elle marche sans JavaScript, l'URL se partage et le bouton retour du navigateur fonctionne. *Amélioration possible* : filtrer à la frappe (anti-rebond + `router.replace`). C'est du confort, pas un critère.
- **Relance et notes sans mise à jour optimiste** : l'écran attend la réponse du serveur, soit une fraction de seconde. On le garde, parce que l'optimiste ajoute de la complexité sans gain notable sur un formulaire.
- **Export par simple lien `/export` (`download`)** : le navigateur fait le téléchargement, sans JavaScript. On le garde.
- **Section « À relancer aujourd'hui » toujours affichée**, même vide (« Personne à relancer aujourd'hui. ») : elle rassure, et on la garde.

## Hors lot, à signaler
- Le `main` local est resté sur le commit d'initialisation (`git pull` à faire de ton côté si tu t'en sers).
