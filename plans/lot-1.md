# Plan · Lot 1 · Ajouter un contact et voir la liste

## Contexte
Plan demandé couche par couche, avec, pour chaque critère d'acceptation de `lots.md`, le test qui le prouve.
Sources lues : `lots.md` (lot 1), `INTENT.md`, `.claude/rules/{presentation,service,donnees}.md`.
**État réel : le lot 1 est déjà livré sur `dev` (commit `40247b3`, issue #1 ouverte).** Ce plan décrit donc ce que le lot contient et quel test prouve chaque critère. Il ne reste à écrire que le petit complément listé à la fin, si tu le valides.

## Tâches par couche

### Données (`src/data`), seule couche qui parle à la base
Règle `.claude/rules/donnees.md` : le client `@libsql/client`, le SQL et la connexion ne vivent qu'ici. Cette couche n'importe ni service, ni composant, ni app. Elle ne contient aucune règle métier et aucun secret. Ses tests d'intégration sont dans `__tests__/integration/data/`.

**D1 · Connexion, `src/data/db.ts`**
- `pnpm add @libsql/client`.
- `getDb()` : un client unique, recréé si l'URL change (utile aux tests).
  - URL : `process.env.DATABASE_URL ?? "file:pipeline.db"`. En local, c'est un fichier à la racine, ignoré par git (`*.db`).
  - Jeton : `authToken: process.env.DATABASE_AUTH_TOKEN`, utilisé seulement en ligne.
  - Passer à Turso = renseigner ces 2 variables dans `.env*` ou sur Vercel. Aucune autre ligne de l'app ne change.
- `closeDb()` : ferme le client. Sert aux tests de persistance.

**D2 · Schéma et migrations, `src/data/db.ts`**
- La liste `MIGRATIONS` est versionnée par `PRAGMA user_version`. Au premier accès, seules les migrations pas encore appliquées tournent. Les lots 3 et 4 y ajouteront les leurs.
- La migration 1 crée la table `contacts` :

| Colonne | Type / contrainte | Rôle |
|---|---|---|
| `id` | TEXT PRIMARY KEY | UUID (`crypto.randomUUID`) |
| `name` | TEXT NOT NULL | nom |
| `company` | TEXT, nullable | entreprise, texte libre |
| `phone` | TEXT, nullable | téléphone |
| `email` | TEXT, nullable | e-mail |
| `called` | INTEGER NOT NULL DEFAULT 0, CHECK (0,1) | appelé |
| `response` | TEXT NOT NULL DEFAULT 'enAttente', CHECK IN ('accepte','refuse','enAttente') | réponse |
| `created_at` | TEXT NOT NULL (ISO 8601) | date de création |

- L'index sur `created_at` sert au tri de la liste.
- Les défauts et les CHECK protègent la base même si un appel passe à côté du service. La règle métier, elle, reste dans le service.

**D3 · Dépôt, `src/data/contacts-repository.ts`**
- `ContactRecord` : la forme brute d'une ligne (`called: number`, `response: string`, `created_at`).
- `NewContactRecord` : ce que le service envoie (name, company, phone, email, called, response).
- `insertContactRecord(r)` : `INSERT … RETURNING *`, génère l'id et la date, renvoie la ligne créée.
- `selectContactRecords()` : `ORDER BY created_at DESC, rowid DESC`, du plus récent au plus ancien, stable même à date égale.
- Requêtes paramétrées uniquement (`args`), jamais de SQL construit en concaténant des chaînes.

**D4 · Tests de la couche données**, dans `__tests__/integration/data/contacts-repository.test.ts`, sur une vraie base libSQL dans un fichier temporaire via `setupTestDatabase()` :
- « crée le schéma à la première connexion » (la table existe, `user_version` = 1) ;
- « insère un contact et le relit, avec id et date de création » ;
- « liste du plus récent au plus ancien » ;
- « refuse une réponse hors liste (contrainte de la table) » ;
- « conserve les contacts après fermeture et réouverture de la base » (`closeDb()`, puis nouveau client sur le même fichier).

**D5 · Contrôles propres aux données** (« Comment vérifier » de `donnees.md`) :
- test d'architecture : les paquets de base ne sont importés que dans `src/data` ;
- `pnpm lint` ;
- grep des secrets : `authToken`, `libsql://` ou `turso.io` ne doivent apparaître que sous forme de `process.env` ;
- `pnpm test:integration`.

### Service (`src/services`), tests écrits avant le code
3. `validateContactInput` : enlève les espaces autour des valeurs. Le nom est obligatoire (120 caractères max). Le format de l'e-mail est vérifié s'il est rempli. Un champ facultatif vide devient `null`. Les erreurs sont renvoyées par champ.
4. `addContact` : pose les défauts **non appelé + en attente**, puis appelle le dépôt. `listContacts` : convertit chaque enregistrement en `Contact` (appelé 0/1 devient un booléen) et refuse une réponse inconnue venue de la base.
5. Les types utiles à la présentation (`Contact`, `ContactResponse`) sont exposés par le service.

### Présentation (`src/app`, `src/components`), service uniquement, tokens Papier
6. `app/actions.ts` (`"use server"`) : `addContactAction` prend le formulaire, appelle `addContact`, rafraîchit la page avec `revalidatePath("/")` et renvoie `{ok, errors}`.
7. `AddContactDialog` (client) : fenêtre shadcn avec les champs Input et Label, gérée par `useActionState`. Elle affiche un message sous chaque champ en erreur et se ferme quand l'ajout réussit.
8. `page.tsx` et `ContactList` (serveur, `await connection()` sous `<Suspense>`) : cartes `ContactCard` avec `StatusBadge` appelé et réponse, affichage dédié quand la liste est vide, squelette pendant le chargement.

### Transverse
9. Tests d'architecture et ESLint par couche : la présentation ne peut pas atteindre la base, et un composant client n'atteint la base que via une Server Function.

## Critère d'acceptation → test qui le prouve

Chaque critère est prouvé à plusieurs niveaux : données (D4), service, et action du formulaire.

| Critère (lots.md) | Test |
|---|---|
| *(données)* Le schéma existe et protège les valeurs | `data/contacts-repository.test.ts` « crée le schéma… » et « refuse une réponse hors liste » |
| J'ajoute un contact, il apparaît dans la liste | intégration `services/contacts.test.ts` « j'ajoute un contact, il apparaît dans la liste », et `app/actions.test.ts` « ajoute le contact et rafraîchit la liste » |
| Un nouveau contact est « non appelé » et « en attente » | unitaire `services/contacts.test.ts` « crée un contact « non appelé » et « en attente » par défaut », et intégration du même nom (sur la vraie base) |
| Je ferme puis rouvre l'app : contacts toujours là, avec leur suivi | intégration `services/contacts.test.ts` « je ferme puis rouvre l'app… », et `data/contacts-repository.test.ts` « conserve les contacts après fermeture et réouverture » ; vérifié aussi à la main en redémarrant le serveur |
| Nom vide ou e-mail mal formé refusé, avec message sur le champ | unitaires « exige un nom », « vérifie le format de l'e-mail », « signale toutes les erreurs d'un coup » ; intégration `app/actions.test.ts` « renvoie les erreurs par champ sans rien écrire » et « une saisie invalide n'ajoute rien » |
| (INTENT) Passer à une base en ligne ne modifie que la couche données | `unit/architecture/layers.test.ts` (paquets de base de données importés seulement dans `src/data`, aucun chemin de la présentation vers la base) ; la connexion ne lit que des variables d'environnement |

## Trou restant (proposé, rien d'écrit sans ta validation)
Tous les tests sont en environnement `node`, en `.test.ts` uniquement. Rien ne vérifie donc automatiquement que le message s'affiche **sous le bon champ** dans la fenêtre. Aujourd'hui, seul le contrat de l'action le garantit (`errors.name`, `errors.email`). Complément proposé : un test d'intégration qui vérifie que les clés d'erreur renvoyées correspondent exactement aux noms (`name`) des champs du formulaire. Pour ça, les noms de champs seraient définis une seule fois, exportés par le service, et réutilisés par la fenêtre. Ça n'ajoute pas d'environnement navigateur à la configuration.

## Fichier de plan dans le repo
Dès la sortie du mode plan : écrire ce plan tel quel dans **`plans/lot-1.md`** à la racine du repo (rendu formation, à côté de `lots.md`). Rien d'autre n'est modifié tant que le complément ci-dessus n'est pas validé. Commit + push sur `dev` seulement si tu le demandes.

## Vérification
1. `pnpm test` (unit + intégration), `pnpm lint`, `pnpm build`.
2. Les commandes « Comment vérifier » des trois règles : test d'architecture, greps couleurs et secrets, un test par service.
3. Dans l'app sur http://localhost:3000 : ajouter un contact, essayer un nom vide et un e-mail mal formé, redémarrer le serveur, vérifier que le contact est toujours là, en clair et en sombre.

## Décisions validées avant l'exécution
- **Données** : migration 2 avec deux triggers qui refusent un nom vide, à l'ajout et à la modification. Un nom fait seulement d'espaces, de tabulations ou de retours à la ligne est aussi refusé (`trim(name, ' ' || char(9,10,13))`). Test de migration en plus : une base en version 1 avec des contacts passe en version 2 sans rien perdre (`__tests__/integration/data/migrations.test.ts`).
- **Service** : `CONTACT_FIELDS` vit dans `src/services/contact-fields.ts`, un module qui ne touche pas la base, pour que le formulaire client puisse l'importer. `contacts.ts` le ré-exporte. `ContactField` se déduit de cette liste, et la validation la parcourt.
- **Présentation** : `ContactFormFields` (`src/components/contacts/contact-form-fields.tsx`) affiche un champ par entrée de `CONTACT_FIELDS`. Il est testé avec Testing Library et jsdom : chaque champ est trouvé par son libellé, et chaque message d'erreur est rattaché à son champ par `aria-describedby`. L'action du formulaire lit les champs à partir de `CONTACT_FIELDS`.
- **Exécution** : les tests des trois couches d'abord, puis la suite rouge, puis le code jusqu'au vert, et un seul commit `feat(lot-1): Ajouter un contact et voir la liste`.
