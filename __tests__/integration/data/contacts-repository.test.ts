import { describe, expect, it } from "vitest";
import { closeDb, getDb } from "@/data/db";
import {
  insertContactRecord,
  selectContactRecordById,
  selectContactRecords,
  updateContactTracking,
} from "@/data/contacts-repository";
import { setupTestDatabase } from "../helpers/test-db";

setupTestDatabase();

const base = { company: null, phone: null, email: null, called: false, response: "enAttente" };

describe("contacts-repository (libSQL réel)", () => {
  it("crée le schéma à la première connexion", async () => {
    const db = await getDb();
    const { rows } = await db.execute("PRAGMA user_version");
    expect(Number(rows[0].user_version)).toBeGreaterThanOrEqual(1);
  });

  it("insère un contact et le relit, avec id et date de création", async () => {
    const created = await insertContactRecord({ ...base, name: "Claire Martin", company: "Atelier Nord" });
    expect(created).toMatchObject({ name: "Claire Martin", company: "Atelier Nord", called: 0, response: "enAttente" });
    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(Number.isNaN(Date.parse(created.created_at))).toBe(false);
    expect((await selectContactRecords()).map((r) => r.id)).toContain(created.id);
  });

  it("liste du plus récent au plus ancien", async () => {
    await insertContactRecord({ ...base, name: "Premier" });
    await insertContactRecord({ ...base, name: "Second" });
    const names = (await selectContactRecords()).map((r) => r.name);
    expect(names.indexOf("Second")).toBeLessThan(names.indexOf("Premier"));
  });

  it("refuse une réponse hors liste (contrainte de la table)", async () => {
    await expect(insertContactRecord({ ...base, name: "X", response: "peut-etre" })).rejects.toThrow();
  });

  it("refuse un nom vide ou fait d'espaces (contrainte de la table)", async () => {
    await expect(insertContactRecord({ ...base, name: "" })).rejects.toThrow();
    await expect(insertContactRecord({ ...base, name: "   " })).rejects.toThrow();
    await expect(insertContactRecord({ ...base, name: "\t\n \r" })).rejects.toThrow();
    const c = await insertContactRecord({ ...base, name: "Nom valide" });
    const db = await getDb();
    await expect(db.execute({ sql: "UPDATE contacts SET name = '' WHERE id = ?", args: [c.id] })).rejects.toThrow();
  });

  it("conserve les contacts après fermeture et réouverture de la base", async () => {
    await insertContactRecord({ ...base, name: "Persistant" });
    await closeDb();
    const names = (await selectContactRecords()).map((r) => r.name);
    expect(names).toContain("Persistant");
  });
});

describe("suivi (lot 2)", () => {
  it("relit un contact par son id, ou null s'il n'existe pas", async () => {
    const c = await insertContactRecord({ ...base, name: "Par id" });
    expect((await selectContactRecordById(c.id))?.name).toBe("Par id");
    expect(await selectContactRecordById("inconnu")).toBeNull();
  });

  it("enregistre appelé + réponse, et renvoie null pour un id inconnu", async () => {
    const c = await insertContactRecord({ ...base, name: "Suivi" });
    const u = await updateContactTracking(c.id, () => ({ called: true, response: "accepte" }));
    expect(u).toMatchObject({ id: c.id, called: 1, response: "accepte" });
    expect((await selectContactRecordById(c.id))?.response).toBe("accepte");
    expect(await updateContactTracking("inconnu", () => ({ called: true, response: "refuse" }))).toBeNull();
  });

  it("ne modifie que le contact visé", async () => {
    const a = await insertContactRecord({ ...base, name: "Visé" });
    const b = await insertContactRecord({ ...base, name: "Voisin" });
    await updateContactTracking(a.id, () => ({ called: true, response: "refuse" }));
    expect(await selectContactRecordById(b.id)).toMatchObject({ called: 0, response: "enAttente" });
  });

  it("calcule le nouveau suivi à partir de la ligne lue dans la même transaction", async () => {
    const c = await insertContactRecord({ ...base, name: "Lu puis écrit", called: true });
    const seen: unknown[] = [];
    const u = await updateContactTracking(c.id, (current) => {
      seen.push([current.called, current.response]);
      return { called: current.called === 1, response: "refuse" };
    });
    expect(seen).toEqual([[1, "enAttente"]]);
    expect(u).toMatchObject({ called: 1, response: "refuse" });
  });

  it("n'appelle pas le calcul pour un id inconnu", async () => {
    let calls = 0;
    expect(await updateContactTracking("inconnu", () => (calls++, { called: true, response: "refuse" }))).toBeNull();
    expect(calls).toBe(0);
  });

  it("si le calcul échoue, rien n'est écrit et la base reste utilisable", async () => {
    const c = await insertContactRecord({ ...base, name: "Annulé" });
    await expect(
      updateContactTracking(c.id, () => {
        throw new Error("règle impossible");
      }),
    ).rejects.toThrow("règle impossible");
    expect(await selectContactRecordById(c.id)).toMatchObject({ called: 0, response: "enAttente" });
    const u = await updateContactTracking(c.id, () => ({ called: true, response: "accepte" }));
    expect(u).toMatchObject({ response: "accepte" });
  });

  it("deux mises à jour lancées en même temps s'appliquent l'une après l'autre", async () => {
    const c = await insertContactRecord({ ...base, name: "Concurrence" });
    // Chaque calcul part de la ligne lue : si les deux lisaient avant d'écrire, l'une serait perdue.
    const bump = (r: { response: string }) => ({
      called: true,
      response: r.response === "enAttente" ? "accepte" : "refuse",
    });
    await Promise.all([updateContactTracking(c.id, bump), updateContactTracking(c.id, bump)]);
    expect(await selectContactRecordById(c.id)).toMatchObject({ called: 1, response: "refuse" });
  });

  it("refuse une réponse hors liste à la mise à jour (contrainte de la table)", async () => {
    const c = await insertContactRecord({ ...base, name: "Contrainte" });
    await expect(updateContactTracking(c.id, () => ({ called: true, response: "peut-etre" }))).rejects.toThrow();
  });
});
