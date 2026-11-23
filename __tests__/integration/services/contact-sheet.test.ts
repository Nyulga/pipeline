import { describe, expect, it } from "vitest";
import { getContactSheet } from "@/services/contact-sheet";
import { addContact } from "@/services/contacts";
import { addNote } from "@/services/notes";
import { setupTestDatabase } from "../helpers/test-db";

setupTestDatabase();

describe("getContactSheet : ce que montre la fiche, page ou panneau (lot 9)", () => {
  it("le contact et ses notes, les plus récentes d'abord", async () => {
    const r = await addContact({ name: "Fiche panneau", company: "Atelier" });
    if (!r.ok) throw new Error("ajout impossible");
    await addNote(r.contact.id, "Première");
    await addNote(r.contact.id, "Deuxième");
    const sheet = await getContactSheet(r.contact.id);
    expect(sheet?.contact).toMatchObject({ name: "Fiche panneau", company: "Atelier" });
    expect(sheet?.notes.map((n) => n.body)).toEqual(["Deuxième", "Première"]);
  });

  it("un identifiant inconnu (lien périmé dans ?contact=) donne null", async () => {
    expect(await getContactSheet("n-existe-pas")).toBeNull();
  });
});
