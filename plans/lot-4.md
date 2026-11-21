# Plan · Lot 4 · Ajouter des notes datées et retrouver un contact

Mode autonome demandé : ce plan est écrit puis exécuté sans arrêt de validation. Les lots 3, 4 et 5 sont livrés ensemble dans une seule PR.

## Choix
- **Notes** : un texte libre, daté à l'enregistrement (horodatage ISO UTC, affiché à l'heure de Paris). Pas de modification ni de suppression : hors lot.
- **Note vide** : refusée si elle est vide ou faite d'espaces, et limitée à 2 000 caractères. Le service la refuse, et la base aussi (CHECK).
- **Recherche** : un champ « Rechercher » sur l'accueil, envoyé en `GET /?q=…`. Il marche sans JavaScript, l'URL peut se partager et le bouton retour du navigateur fonctionne.
  - Le filtre est fait par le service, en mémoire : on normalise (minuscules, accents retirés via NFD) le nom, l'entreprise, le téléphone, l'e-mail et toutes les notes du contact. SQLite ne sait ni retirer les accents ni passer en minuscules hors ASCII, et en mono-utilisateur le volume reste faible.
  - Téléphone : on compare aussi les seuls chiffres (« 0612 » trouve « 06 12 34 56 78 »).
  - La section « À relancer aujourd'hui » n'est pas filtrée.

## Données (`src/data`)
- Migration 4 : table `notes` (`id`, `contact_id` → contacts, `body` avec CHECK non vide, `created_at`) et index `(contact_id, created_at)`.
- `notes-repository.ts` :
  - `insertNoteRecord(contactId, body)` renvoie la ligne, ou `null` si le contact est inconnu (`INSERT … SELECT … WHERE EXISTS`) ;
  - `selectNoteRecords(contactId)` renvoie les notes, les plus récentes d'abord ;
  - `selectAllNoteRecords()` sert à la recherche.

## Service (`src/services`)
- `notes.ts` :
  - `validateNoteBody` (pure) : « La note ne peut pas être vide. », « 2000 caractères maximum. » ;
  - `addNote(contactId, body)` : « Contact introuvable. » si besoin ;
  - `listNotes(contactId)`.
- `search.ts` (pur) :
  - `normalizeForSearch(text)` ;
  - `matchesSearch(contact, notes, query)`.
- `contacts.ts` : `searchContacts(query)`. Une requête vide donne tous les contacts.

## Présentation
- `addNoteAction(contactId, body)` appelle `refresh()`.
- `NoteForm` (client) :
  - une zone de texte (`pnpm shadcn add textarea`) et le bouton « Ajouter la note » ;
  - l'erreur s'affiche sur le champ ;
  - le champ est vidé si l'ajout réussit ;
  - « Impossible d'enregistrer, réessaie. » s'affiche si l'enregistrement échoue.
- `NoteList` : les notes, chacune avec sa date (« 21 nov. 2026 à 10:30 »), ou « Aucune note pour l'instant. ». Elle est affichée sur la fiche.
- `ContactSearch` : un formulaire GET avec le champ `q`, prérempli. Sur l'accueil, `ContactList` reçoit `q` et affiche « Aucun contact ne correspond à « … ». » s'il n'y a pas de résultat.

## Critère → tests
| Critère | Tests |
|---|---|
| Note ajoutée → visible sur la fiche avec sa date, les plus récentes d'abord | intégration `data/notes-repository.test.ts` · intégration `services/notes.test.ts` · unitaire `services/notes.test.ts` · composants `note-list.test.ts`, `note-form.test.ts` · `app/actions.test.ts` addNoteAction |
| Note vide refusée | unitaire `services/notes.test.ts` validateNoteBody / addNote · intégration (rien n'est écrit, CHECK en base) · `note-form.test.ts` erreur sur le champ |
| Recherche nom / entreprise / téléphone / e-mail / note, sans casse ni accents | unitaire `services/search.test.ts` · unitaire `services/contacts.test.ts` searchContacts · intégration `services/search.test.ts` · composants `contact-search.test.ts`, et `contact-list` (message s'il n'y a aucun résultat) |

## Preuves

### Rouge (tests écrits, avant le code)
```
 FAIL  |integration| __tests__/integration/app/actions.test.ts [ __tests__/integration/app/actions.test.ts ]
 FAIL  |integration| __tests__/integration/data/notes-repository.test.ts [ __tests__/integration/data/notes-repository.test.ts ]
 FAIL  |integration| __tests__/integration/services/notes.test.ts [ __tests__/integration/services/notes.test.ts ]
 FAIL  |integration| __tests__/integration/services/search.test.ts [ __tests__/integration/services/search.test.ts ]
 FAIL  |unit| __tests__/unit/components/contact-search.test.ts [ __tests__/unit/components/contact-search.test.ts ]
 FAIL  |unit| __tests__/unit/components/note-form.test.ts [ __tests__/unit/components/note-form.test.ts ]
 FAIL  |unit| __tests__/unit/components/note-list.test.ts [ __tests__/unit/components/note-list.test.ts ]
 FAIL  |unit| __tests__/unit/services/notes.test.ts [ __tests__/unit/services/notes.test.ts ]
 FAIL  |unit| __tests__/unit/services/search.test.ts [ __tests__/unit/services/search.test.ts ]
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 5 ⎯⎯⎯⎯⎯⎯⎯
 FAIL  |unit| __tests__/unit/components/contact-list.test.ts > ContactListContent : la liste, filtrée ou non (lot 4) > une recherche sans résultat le dit, avec la recherche
 FAIL  |unit| __tests__/unit/components/contact-list.test.ts > ContactListContent : la liste, filtrée ou non (lot 4) > sans recherche et sans contact, invite à ajouter le premier
 FAIL  |unit| __tests__/unit/components/contact-list.test.ts > ContactListContent : la liste, filtrée ou non (lot 4) > affiche les contacts trouvés
 FAIL  |unit| __tests__/unit/services/contacts.test.ts > searchContacts (lot 4) > filtre sur les champs du contact et ses notes, sans casse ni accents, en gardant l'ordre
 FAIL  |unit| __tests__/unit/services/contacts.test.ts > searchContacts (lot 4) > une recherche vide rend tous les contacts sans lire les notes
 Test Files  11 failed | 19 passed (30)
      Tests  5 failed | 150 passed (155)
```

### Vert (après le code)
```
 Test Files  30 passed (30)
      Tests  197 passed (197)
```
