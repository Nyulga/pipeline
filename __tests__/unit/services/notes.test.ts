import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NoteRecord } from "@/data/notes-repository";

vi.mock("@/data/notes-repository", () => ({
  insertNoteRecord: vi.fn(),
  selectNoteRecords: vi.fn(),
  selectAllNoteRecords: vi.fn(),
}));

import { insertNoteRecord, selectNoteRecords } from "@/data/notes-repository";
import { addNote, listNotes, validateNoteBody } from "@/services/notes";

const note = (over: Partial<NoteRecord> = {}): NoteRecord => ({
  id: "n1",
  contact_id: "c1",
  body: "Rappeler lundi",
  created_at: "2026-11-21T09:30:00.000Z",
  ...over,
});

beforeEach(() => {
  vi.mocked(insertNoteRecord).mockReset();
  vi.mocked(selectNoteRecords).mockReset();
});

describe("validateNoteBody", () => {
  it("garde le texte, sans les espaces autour", () => {
    expect(validateNoteBody("  Rappeler lundi \n")).toEqual({ ok: true, value: "Rappeler lundi" });
  });

  it("refuse une note vide ou faite d'espaces", () => {
    for (const bad of ["", "   ", "\n\t", null, undefined, 42])
      expect(validateNoteBody(bad)).toEqual({ ok: false, error: "La note ne peut pas être vide." });
  });

  it("refuse une note trop longue", () => {
    expect(validateNoteBody("a".repeat(2001))).toEqual({ ok: false, error: "2000 caractères maximum." });
    expect(validateNoteBody("a".repeat(2000)).ok).toBe(true);
  });
});

describe("addNote", () => {
  it("enregistre la note nettoyée et la renvoie au format du domaine", async () => {
    vi.mocked(insertNoteRecord).mockResolvedValue(note());
    expect(await addNote("c1", " Rappeler lundi ")).toEqual({
      ok: true,
      note: { id: "n1", contactId: "c1", body: "Rappeler lundi", createdAt: "2026-11-21T09:30:00.000Z" },
    });
    expect(insertNoteRecord).toHaveBeenCalledWith("c1", "Rappeler lundi");
  });

  it("une note vide est refusée sans rien écrire", async () => {
    expect(await addNote("c1", "  ")).toEqual({ ok: false, error: "La note ne peut pas être vide." });
    expect(insertNoteRecord).not.toHaveBeenCalled();
  });

  it("signale un contact introuvable", async () => {
    vi.mocked(insertNoteRecord).mockResolvedValue(null);
    expect(await addNote("inconnu", "Texte")).toEqual({ ok: false, error: "Contact introuvable." });
  });
});

describe("listNotes", () => {
  it("rend les notes du contact dans l'ordre de la base (plus récentes d'abord)", async () => {
    vi.mocked(selectNoteRecords).mockResolvedValue([note({ id: "n2" }), note({ id: "n1" })]);
    expect((await listNotes("c1")).map((n) => n.id)).toEqual(["n2", "n1"]);
  });
});
