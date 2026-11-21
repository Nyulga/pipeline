import { describe, expect, it } from "vitest";
import { addContact } from "@/services/contacts";
import { addNote, listNotes } from "@/services/notes";
import { setupTestDatabase } from "../helpers/test-db";

setupTestDatabase();

async function created(name: string) {
  const r = await addContact({ name });
  if (!r.ok) throw new Error("ajout impossible");
  return r.contact;
}

describe("notes : service + données (critères du lot 4)", () => {
  it("j'ajoute une note, elle apparaît sur la fiche avec sa date, les plus récentes d'abord", async () => {
    const c = await created("Fiche avec notes");
    await addNote(c.id, "Appel de découverte");
    await addNote(c.id, "  Rappeler lundi  ");
    const notes = await listNotes(c.id);
    expect(notes.map((n) => n.body)).toEqual(["Rappeler lundi", "Appel de découverte"]);
    expect(Number.isNaN(Date.parse(notes[0].createdAt))).toBe(false);
  });

  it("une note vide est refusée et rien n'est écrit", async () => {
    const c = await created("Note vide refusée");
    expect(await addNote(c.id, "   ")).toEqual({ ok: false, error: "La note ne peut pas être vide." });
    expect(await listNotes(c.id)).toEqual([]);
  });
});
