import { describe, expect, it } from "vitest";
import { closeDb, getDb } from "@/data/db";
import { insertContactRecord, selectContactRecords } from "@/data/contacts-repository";
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
