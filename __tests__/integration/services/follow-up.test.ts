import { describe, expect, it } from "vitest";
import { addContact, getContact, listDueFollowUps, setFollowUp, setResponse } from "@/services/contacts";
import { setupTestDatabase } from "../helpers/test-db";

setupTestDatabase();

async function created(name: string) {
  const r = await addContact({ name });
  if (!r.ok) throw new Error("ajout impossible");
  return r.contact;
}

// Le 21 novembre 2026 à 10 h, heure de Paris.
const NOW = new Date("2026-11-21T09:00:00Z");

describe("prochaine relance : service + données (critères du lot 3)", () => {
  it("je fixe la prochaine relance d'un contact à une date, elle s'affiche sur sa fiche", async () => {
    const c = await created("Relance fiche");
    expect(await setFollowUp(c.id, "2026-12-03")).toMatchObject({ ok: true });
    expect((await getContact(c.id))?.nextFollowUp).toBe("2026-12-03");
  });

  it("je peux l'effacer", async () => {
    const c = await created("Relance effacée");
    await setFollowUp(c.id, "2026-12-03");
    await setFollowUp(c.id, "");
    expect((await getContact(c.id))?.nextFollowUp).toBeNull();
  });

  it("une date invalide n'écrit rien", async () => {
    const c = await created("Relance invalide");
    await setFollowUp(c.id, "2026-12-03");
    expect(await setFollowUp(c.id, "2026-02-30")).toEqual({ ok: false, error: "Date invalide." });
    expect((await getContact(c.id))?.nextFollowUp).toBe("2026-12-03");
  });

  it("« À relancer aujourd'hui » : relance du jour, relance passée en retard, jamais d'accepté ni de refusé", async () => {
    const jour = await created("Relance du jour");
    const retard = await created("Relance en retard");
    const futur = await created("Relance à venir");
    const accepte = await created("Relance acceptée");
    const refuse = await created("Relance refusée");
    await setFollowUp(jour.id, "2026-11-21");
    await setFollowUp(retard.id, "2026-11-18");
    await setFollowUp(futur.id, "2026-11-22");
    await setFollowUp(accepte.id, "2026-11-21");
    await setFollowUp(refuse.id, "2026-11-18");
    await setResponse(accepte.id, "accepte");
    await setResponse(refuse.id, "refuse");

    const due = (await listDueFollowUps(NOW)).map((d) => [d.contact.name, d.state]);
    expect(due).toEqual([
      ["Relance en retard", "enRetard"],
      ["Relance du jour", "aujourdhui"],
    ]);
  });
});
