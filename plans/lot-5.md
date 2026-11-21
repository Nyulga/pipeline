# Plan · Lot 5 · Exporter les contacts en CSV

Mode autonome demandé : ce plan est écrit puis exécuté sans arrêt de validation. Les lots 3, 4 et 5 sont livrés ensemble dans une seule PR.

## Choix
- **Format pensé pour Excel en français** :
  - séparateur `;` : avec la virgule décimale, Excel FR attend `;` ;
  - BOM UTF-8 en tête du fichier, sans quoi Excel lit en Windows-1252 et casse les accents ;
  - fins de ligne CRLF ;
  - dates en `JJ/MM/AAAA` (et `JJ/MM/AAAA HH:MM` pour la création, à l'heure de Paris), qu'Excel FR reconnaît comme des dates.
- **Échappement (RFC 4180)** : une valeur contenant `;`, `"`, CR ou LF est mise entre guillemets, et ses `"` sont doublés.
- **Formules** : une valeur commençant par `=`, `+`, `-`, `@`, une tabulation ou un CR est préfixée d'une apostrophe `'`, la parade recommandée par l'OWASP contre l'injection CSV. L'apostrophe reste visible dans la cellule : c'est le prix de la sécurité, et un `+33…` s'affichera `'+33…`.
- **Nom du fichier** : `pipeline-contacts-AAAA-MM-JJ.csv`, avec le jour à Paris.
- **Libellés** (« Oui », « Accepté », « Appelé · en attente »…) : ils viennent du design system (`status-badge.tsx`), seul endroit où ils sont définis. La route d'export (présentation) les applique. Le service fournit les données et les règles CSV.
- **Ordre** : celui de la liste, du plus récent au plus ancien.

## Données
- Rien de nouveau : `selectContactRecords` et `selectAllNoteRecords` (lot 4) suffisent.

## Service (`src/services`)
- `csv.ts` (pur) :
  - `csvCell(value)` ;
  - `toCsv(rows)`, avec BOM, `;` et CRLF ;
  - `exportFileName(now)`.
- `contacts.ts` : `listContactsForExport()` renvoie `{ contact, lastNote }[]`, où `lastNote` est la note la plus récente, ou null.

## Présentation
- Route `GET /export` (`src/app/export/route.ts`) :
  - appelle `connection()` (sinon prérendue au build avec `cacheComponents`) ;
  - en-têtes `Content-Type: text/csv; charset=utf-8` et `Content-Disposition: attachment; filename="pipeline-contacts-AAAA-MM-JJ.csv"` ;
  - `Cache-Control: no-store`.
- Bouton « Exporter en CSV » dans l'en-tête de l'accueil : un lien `/export` stylé avec `buttonVariants`.

## Critère → tests
| Critère | Tests |
|---|---|
| « Exporter en CSV » → fichier `pipeline-contacts-AAAA-MM-JJ.csv` | unitaire `services/csv.test.ts` exportFileName (heure de Paris) · intégration `app/export.test.ts` en-têtes · composant `export-button.test.ts` |
| Excel (accents) + toutes les colonnes | `csv.test.ts` BOM / `;` / CRLF · `services/contacts.test.ts` listContactsForExport (dernière note) · intégration `app/export.test.ts` : en-tête, une ligne complète |
| `;`, guillemets, retour à la ligne ne cassent rien ; `= + - @` non interprétés | `csv.test.ts` csvCell · intégration `app/export.test.ts` avec un contact piégé |

## Preuves

### Rouge (tests écrits, avant le code)
```
 FAIL  |integration| __tests__/integration/app/export.test.ts [ __tests__/integration/app/export.test.ts ]
 FAIL  |unit| __tests__/unit/components/export-button.test.ts [ __tests__/unit/components/export-button.test.ts ]
 FAIL  |unit| __tests__/unit/services/csv.test.ts [ __tests__/unit/services/csv.test.ts ]
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯
 FAIL  |unit| __tests__/unit/services/contacts.test.ts > listContactsForExport (lot 5) > chaque contact avec sa note la plus récente, ou null
 Test Files  4 failed | 29 passed (33)
      Tests  1 failed | 197 passed (198)
```

### Vert (après le code)
```
 Test Files  33 passed (33)
      Tests  207 passed (207)
```
