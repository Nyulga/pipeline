import { describe, expect, it } from "vitest";
import { closeDb } from "@/data/db";
import { addContact, listContacts } from "@/services/contacts";
import { setupTestDatabase } from "../helpers/test-db";

setupTestDatabase();

describe("contacts : service + données (critères du lot 1)", () => {
  it("j'ajoute un contact, il apparaît dans la liste", async () => {
    const r = await addContact({ name: "  Thomas Bernard ", company: "Boulangerie du Port", email: "thomas@port.fr" });
    expect(r.ok).toBe(true);
    const list = await listContacts();
    expect(list[0]).toMatchObject({ name: "Thomas Bernard", company: "Boulangerie du Port", email: "thomas@port.fr" });
  });

  it("un nouveau contact est « non appelé » et « en attente »", async () => {
    const r = await addContact({ name: "Inès Morel" });
    expect(r.ok && { called: r.contact.called, response: r.contact.response }).toEqual({ called: false, response: "enAttente" });
  });

  it("je ferme puis rouvre l'app : mes contacts sont toujours là, avec leur suivi", async () => {
    await addContact({ name: "Léa Fontaine" });
    await closeDb();
    const lea = (await listContacts()).find((c) => c.name === "Léa Fontaine");
    expect(lea).toMatchObject({ called: false, response: "enAttente" });
  });

  it("une saisie invalide n'ajoute rien", async () => {
    const before = (await listContacts()).length;
    const r = await addContact({ name: " ", email: "faux" });
    expect(r).toEqual({ ok: false, errors: { name: "Le nom est obligatoire.", email: "Adresse e-mail invalide." } });
    expect((await listContacts()).length).toBe(before);
  });
});
