# Plan · Lot 9 · Fiche dans un panneau

Issue #17. Pas de changement de base ni de service : la fiche lit ce qu'elle lit déjà (`getContact`, `listNotes`).

## Choix
- **L'adresse porte le panneau** : `/?contact=<id>`, avec la recherche `q` et le filtre `etape` déjà présents. Un rechargement ou un lien partagé rouvre donc le même panneau.
  Pas de route interceptée : un paramètre suffit et garde la liste rendue derrière.
- **Composant** : `sheet` de shadcn (`pnpm shadcn add sheet`). Il repose sur le dialog de base-ui, déjà installé, donc **aucune nouvelle dépendance**.
  - Sur téléphone, le panneau monte du bas, avec une hauteur max de 90 % et un défilement interne.
  - À partir de `md`, il s'ouvre à droite, sur 28 rem de large.
  - Le dialog gère Échap, le focus piégé, le retour du focus et le fond assombri.
- **Ouvrir** : le nom sur la carte devient un lien vers `?contact=<id>`, qui garde `q` et `etape`. Il est suivi sans défilement (`scroll: false`), donc la liste ne bouge pas.
  Un clic avec Ctrl, ou le clic du milieu, ouvre toujours `/contacts/<id>` dans un nouvel onglet, car c'est un vrai lien.
- **Fermer** : Échap, le bouton « Fermer » ou un clic sur le fond. L'adresse revient alors sans `contact`, sans défilement.
- **Contenu** : exactement celui de la fiche actuelle. La partie visible est extraite dans un composant partagé `ContactDetails`, utilisé à la fois par `/contacts/<id>` (qui reste) et par le panneau. On y trouve :
  - les coordonnées ;
  - l'étape ;
  - la relance ;
  - les notes et leur formulaire.
- **Mise à jour** : ajouter une note ou changer la relance appelle déjà `refresh()`. L'accueil se re-rend, et la liste, la carte « À appeler maintenant » et le panneau se mettent à jour ensemble.
- **Identifiant inconnu** dans `?contact=` : le panneau dit « Ce contact n'existe plus » avec un bouton Fermer. Pas de page 404, la liste reste là.

## Présentation
- `src/components/contacts/contact-links.ts` (pur) :
  - `contactPanelHref(params, id)` donne l'adresse qui ouvre le panneau ;
  - `withoutContact(params)` donne l'adresse qui le ferme.
- `ContactDetails` (affichage) et `ContactDetailsLoader` (lecture, sous `Suspense`).
- `ContactPanel` (client) : le `Sheet`, ouvert tant que `contact` est dans l'adresse. Fermer remplace l'adresse.
- `page.tsx` : lit `contact` et rend le panneau par-dessus la liste. `/contacts/[id]/page.tsx` réutilise `ContactDetails`.

## Tests (critère → test)
| Critère | Test | Couche |
|---|---|---|
| Toucher un contact ouvre sa fiche par-dessus la liste, avec coordonnées, étape, relance et notes | `contact-card.test.ts` (le nom mène à `?contact=<id>` en gardant `q` et `etape`) ; `contact-details.test.ts` (nom, entreprise, numéro, e-mail, étape, relance, notes les plus récentes d'abord) ; `contact-panel.test.ts` (ouvert avec son contenu, en dialog) | présentation |
| Échap ou « Fermer » referme le panneau ; la liste reste en place | `contact-panel.test.ts` : Échap et « Fermer » remplacent l'adresse par `withoutContact(...)`, avec `scroll: false` ; `contact-links.test.ts` | présentation |
| `/?contact=<id>` rouvre le panneau au rechargement ; `/contacts/<id>` marche toujours | `contact-links.test.ts` ; intégration : rendu de `ContactDetailsLoader` sur une vraie base, et contact inconnu → message | présentation + service + données |
| Ajouter une note ou changer la relance depuis le panneau met la liste à jour | les actions rafraîchissent déjà la page (`actions.test.ts`, lots 3 et 4) ; `contact-panel.test.ts` : le formulaire de note et celui de relance sont bien dans le panneau | présentation |
