# Plan · Lot 9 · Fiche dans un panneau

Issue #17. Pas de changement de base. Un petit service, `getContactSheet`, rassemble le contact et ses notes ; il sert à la page et au panneau.

## Choix
- **L'adresse porte le panneau** : `/?contact=<id>`, avec la recherche `q` et le filtre `etape` déjà présents. Un rechargement ou un lien partagé rouvre donc le même panneau.
  Pas de route interceptée : un paramètre suffit et garde la liste rendue derrière.
- **Composant** : `sheet` de shadcn (`pnpm shadcn add sheet`). Il repose sur le dialog de base-ui, déjà installé, donc **aucune nouvelle dépendance**.
  - Sur téléphone, le panneau monte du bas, avec une hauteur max de 90 % et un défilement interne.
  - À partir de `md`, il s'ouvre à droite, sur 28 rem de large.
  - Le dialog gère Échap, le focus piégé, le retour du focus et le fond assombri.
- **Ouvrir** : le nom sur la carte devient un lien vers `?contact=<id>`, qui garde `q` et `etape`. Il est suivi sans défilement (`scroll: false`), donc la liste ne bouge pas.
  Un clic avec Ctrl, ou le clic du milieu, ouvre `/?contact=<id>` dans un nouvel onglet : la liste, avec le panneau ouvert.
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

## Après la revue de la PR #23
- **Fermer sans attendre** : le panneau disparaît tout de suite (état local), puis l'adresse suit.
- **Historique** : un panneau ouvert par un clic dans l'app se ferme avec `router.back()`, donc Retour ne bégaie pas. Ouvert par un lien partagé ou un rechargement, il se ferme avec `router.replace` (`panel-history.ts`, `PanelLink`).
- **« À relancer aujourd'hui »** ouvre aussi le panneau, en gardant la recherche et le filtre.
- **Contact inconnu** : le rendu du panneau est extrait dans `ContactPanelView`, qui est testé (message « Ce contact n'existe plus »).
- **Finitions** :
  - une clé par contact sur le panneau ;
  - l'en-tête et « Fermer » restent collés en haut ;
  - sur ordinateur, le panneau entre par la droite ;
  - « Notes » passe en `h3` dans le panneau.
- **Liens** : `telHref` et `mailtoHref` sont partagés. `mailto:` encode l'adresse, pour qu'un `?` ou un `&` saisi n'ajoute pas de destinataire caché (point du contrôle de sécurité).
- **Assumé** :
  - pas de squelette pendant le chargement du panneau, sinon un panneau vide clignoterait à chaque chargement de l'accueil ;
  - le retour du focus après fermeture est laissé au dialog de base-ui, à vérifier dans un navigateur ;
  - `bg-black/10` du fond de `sheet` est le style d'origine de shadcn, déjà présent dans `dialog`.
