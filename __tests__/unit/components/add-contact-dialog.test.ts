// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// L'action serveur est remplacée : on teste la fenêtre, pas le serveur.
vi.mock("@/app/actions", () => ({ addContactAction: vi.fn() }));

import { addContactAction } from "@/app/actions";
import { AddContactDialog } from "@/components/contacts/add-contact-dialog";

async function openAndSubmit(name: string) {
  render(createElement(AddContactDialog));
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Ajouter un contact" }));
  });
  fireEvent.change(screen.getByLabelText(/^Nom/), { target: { value: name } });
  await act(async () => {
    fireEvent.submit(screen.getByRole("button", { name: "Ajouter" }).closest("form")!);
  });
}

// Corps entre accolades : une fonction renvoyée par beforeEach serait exécutée par Vitest
// comme nettoyage après le test (ici, la fausse action elle-même).
beforeEach(() => {
  vi.mocked(addContactAction).mockReset();
});
afterEach(cleanup);

describe("AddContactDialog : ajouter un contact", () => {
  it("si l'enregistrement échoue (base injoignable), la fenêtre reste ouverte avec la saisie et un message", async () => {
    vi.mocked(addContactAction).mockRejectedValue(new Error("fetch failed"));

    await openAndSubmit("Inès Faure");

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByLabelText(/^Nom/)).toHaveProperty("value", "Inès Faure");
    expect(screen.getByRole("alert").textContent).toBe("Impossible d'enregistrer, réessaie.");
  });

  it("si l'ajout réussit, la fenêtre se ferme", async () => {
    vi.mocked(addContactAction).mockResolvedValue({ ok: true, errors: {} });

    await openAndSubmit("Inès Faure");

    expect(addContactAction).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("si la saisie est refusée, la fenêtre reste ouverte avec le message sous le champ", async () => {
    vi.mocked(addContactAction).mockResolvedValue({ ok: false, errors: { name: "Le nom est obligatoire." } });

    await openAndSubmit(" ");

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Le nom est obligatoire.")).toBeTruthy();
    expect(screen.queryByText("Impossible d'enregistrer, réessaie.")).toBeNull();
  });
});

describe("AddContactDialog : bouton flottant du téléphone (lot 11)", () => {
  it("la variante flottante ouvre le même formulaire", async () => {
    render(createElement(AddContactDialog, { variant: "floating" }));
    const button = screen.getByRole("button", { name: "Ajouter un contact" });
    expect(button.className).toContain("fixed");
    expect(button.className).toContain("md:hidden");
    await act(async () => {
      fireEvent.click(button);
    });
    expect(screen.getByRole("dialog", { name: "Nouveau contact" })).toBeTruthy();
  });

  it("le bouton de l'en-tête est masqué sur téléphone", () => {
    render(createElement(AddContactDialog, { variant: "header" }));
    const cls = screen.getByRole("button", { name: "Ajouter un contact" }).className;
    expect(cls).toContain("hidden");
    expect(cls).toContain("md:inline-flex");
  });

  it("par défaut, un bouton ordinaire (liste vide)", () => {
    render(createElement(AddContactDialog));
    const cls = screen.getByRole("button", { name: "Ajouter un contact" }).className;
    expect(cls).not.toContain("fixed");
    expect(cls).not.toMatch(/(^|\s)hidden/);
  });
});
