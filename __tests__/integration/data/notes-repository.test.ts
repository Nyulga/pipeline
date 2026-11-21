import { describe, expect, it } from "vitest";
import { getDb } from "@/data/db";
import { insertContactRecord, updateContactTracking } from "@/data/contacts-repository";
import { insertNoteRecord, selectAllNoteRecords, selectNoteRecords } from "@/data/notes-repository";
import { setupTestDatabase } from "../helpers/test-db";

setupTestDatabase();

const base = { company: null, phone: null, email: null, called: false, response: "enAttente" };

describe("notes-repository (libSQL réel, lot 4)", () => {
  it("enregistre une note datée et la relit, les plus récentes d'abord", async () => {
    const c = await insertContactRecord({ ...base, name: "Avec notes" });
    const first = await insertNoteRecord(c.id, "Première");
    const second = await insertNoteRecord(c.id, "Seconde");
    expect(first).toMatchObject({ contact_id: c.id, body: "Première" });
    expect(Number.isNaN(Date.parse(first!.created_at))).toBe(false);
    expect((await selectNoteRecords(c.id)).map((n) => n.id)).toEqual([second!.id, first!.id]);
  });

  it("renvoie null pour un contact inconnu, sans rien écrire", async () => {
    expect(await insertNoteRecord("inconnu", "Perdue")).toBeNull();
    expect((await selectAllNoteRecords()).some((n) => n.body === "Perdue")).toBe(false);
  });

  it("la base refuse une note vide ou faite d'espaces", async () => {
    const c = await insertContactRecord({ ...base, name: "Note vide" });
    await expect(insertNoteRecord(c.id, "  \n ")).rejects.toThrow();
    const db = await getDb();
    await expect(
      db.execute({
        sql: "INSERT INTO notes (id, contact_id, body, created_at) VALUES ('x', ?, '', '2026-11-21')",
        args: [c.id],
      }),
    ).rejects.toThrow();
  });

  it("une note ajoutée pendant un changement de suivi n'échoue pas (écritures l'une après l'autre)", async () => {
    const c = await insertContactRecord({ ...base, name: "Concurrence" });
    const writes = Array.from({ length: 10 }, (_, i) => [
      updateContactTracking(c.id, () => ({ called: i % 2 === 0, response: "enAttente" })),
      insertNoteRecord(c.id, `note ${i}`),
      insertContactRecord({ ...base, name: `Concurrent ${i}` }),
    ]).flat();
    await expect(Promise.all(writes)).resolves.toBeDefined();
    expect(await selectNoteRecords(c.id)).toHaveLength(10);
  });

  it("ne mélange pas les notes de deux contacts", async () => {
    const a = await insertContactRecord({ ...base, name: "A" });
    const b = await insertContactRecord({ ...base, name: "B" });
    await insertNoteRecord(a.id, "pour A");
    expect(await selectNoteRecords(b.id)).toEqual([]);
  });
});
