import { describe, expect, it } from "vitest";
import { addContact, listContacts, setCalled, setResponse } from "@/services/contacts";
import { groupByStage } from "@/services/tracking";
import { setupTestDatabase } from "../helpers/test-db";

setupTestDatabase();

async function newContact(name: string) {
  const r = await addContact({ name });
  if (!r.ok) throw new Error("création impossible");
  return r.contact;
}
const find = async (id: string) => (await listContacts()).find((c) => c.id === id)!;

describe("suivi : service + données (critères du lot 2)", () => {
  it("je marque un contact comme appelé, c'est visible dans la liste", async () => {
    const c = await newContact("Appelé");
    await setCalled(c.id, true);
    expect(await find(c.id)).toMatchObject({ called: true, response: "enAttente" });
  });

  it("je marque la réponse d'un contact, c'est visible dans la liste", async () => {
    const c = await newContact("Réponse");
    await setResponse(c.id, "refuse");
    expect(await find(c.id)).toMatchObject({ called: true, response: "refuse" });
    await setResponse(c.id, "enAttente");
    expect(await find(c.id)).toMatchObject({ called: true, response: "enAttente" });
  });

  it("repasser en « non appelé » remet la réponse à « en attente »", async () => {
    const c = await newContact("Retour arrière");
    await setResponse(c.id, "accepte");
    await setCalled(c.id, false);
    expect(await find(c.id)).toMatchObject({ called: false, response: "enAttente" });
  });

  it("chaque contact apparaît dans la bonne colonne de la vue par étape", async () => {
    const [a, b, c, d] = await Promise.all(["Col A", "Col B", "Col C", "Col D"].map(newContact));
    await setCalled(b.id, true);
    await setResponse(c.id, "accepte");
    await setResponse(d.id, "refuse");
    const groups = groupByStage(await listContacts());
    const ids = (k: keyof typeof groups) => groups[k].map((x) => x.id);
    expect(ids("aAppeler")).toContain(a.id);
    expect(ids("appeleEnAttente")).toContain(b.id);
    expect(ids("accepte")).toContain(c.id);
    expect(ids("refuse")).toContain(d.id);
  });

  it("le suivi persiste après réouverture de la base", async () => {
    const c = await newContact("Persistant");
    await setResponse(c.id, "accepte");
    const { closeDb } = await import("@/data/db");
    await closeDb();
    expect(await find(c.id)).toMatchObject({ called: true, response: "accepte" });
  });
});
