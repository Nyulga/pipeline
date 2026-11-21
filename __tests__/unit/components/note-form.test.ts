// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// L'action serveur est remplacée : on teste le formulaire, pas le serveur.
vi.mock("@/app/actions", () => ({ addNoteAction: vi.fn() }));

import { addNoteAction } from "@/app/actions";
import { NoteForm } from "@/components/contacts/note-form";

const field = () => screen.getByLabelText("Nouvelle note") as HTMLTextAreaElement;

async function write(text: string) {
  render(createElement(NoteForm, { contactId: "abc" }));
  fireEvent.change(field(), { target: { value: text } });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Ajouter la note" }));
  });
}

beforeEach(() => {
  vi.mocked(addNoteAction).mockReset();
});
afterEach(cleanup);

describe("NoteForm : ajouter une note sur la fiche (lot 4)", () => {
  it("envoie la note, puis vide le champ", async () => {
    vi.mocked(addNoteAction).mockResolvedValue({ ok: true });
    await write("Rappeler lundi");
    expect(addNoteAction).toHaveBeenCalledWith("abc", "Rappeler lundi");
    expect(field().value).toBe("");
  });

  it("une note refusée (vide) s'affiche sur le champ, la saisie est gardée", async () => {
    vi.mocked(addNoteAction).mockResolvedValue({ ok: false, error: "La note ne peut pas être vide." });
    await write("   ");
    expect(field().getAttribute("aria-invalid")).toBe("true");
    expect(document.getElementById(field().getAttribute("aria-describedby") ?? "")?.textContent).toBe(
      "La note ne peut pas être vide.",
    );
  });

  it("si l'enregistrement échoue, un message le dit et la saisie est gardée", async () => {
    vi.mocked(addNoteAction).mockRejectedValue(new Error("fetch failed"));
    await write("Rappeler lundi");
    expect(screen.getByRole("alert").textContent).toBe("Impossible d'enregistrer, réessaie.");
    expect(field().value).toBe("Rappeler lundi");
  });
});
