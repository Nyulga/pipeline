import { describe, expect, it } from "vitest";
import { addContact, searchContacts } from "@/services/contacts";
import { addNote } from "@/services/notes";
import { setupTestDatabase } from "../helpers/test-db";

setupTestDatabase();

describe("recherche : service + données (critère du lot 4)", () => {
  it("retrouve un contact par nom, entreprise, téléphone, e-mail ou note, sans casse ni accents", async () => {
    const r = await addContact({
      name: "Hélène Dupré",
      company: "Café Éole",
      phone: "06 12 34 56 78",
      email: "helene@eole.fr",
    });
    if (!r.ok) throw new Error("ajout impossible");
    await addContact({ name: "Autre Personne" });
    await addNote(r.contact.id, "Intéressée par l'offre Été");

    for (const q of ["helene", "DUPRE", "cafe eole", "0612", "34 56", "@EOLE.fr", "offre ete"])
      expect((await searchContacts(q)).map((c) => c.name), q).toEqual(["Hélène Dupré"]);
  });

  it("une recherche vide rend tous les contacts", async () => {
    expect((await searchContacts("  ")).length).toBeGreaterThanOrEqual(2);
  });
});
