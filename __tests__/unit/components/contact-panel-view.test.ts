// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), back: vi.fn() }) }));
vi.mock("@/app/actions", () => ({ setFollowUpAction: vi.fn(), addNoteAction: vi.fn() }));

import { ContactPanelView } from "@/components/contacts/contact-panel-view";
import { makeContact } from "./helpers/contact";

afterEach(cleanup);

describe("ContactPanelView : ce que montre le panneau de l'accueil (revue de la PR #23)", () => {
  it("un contact inconnu (lien périmé) : un message, pas de page d'erreur", () => {
    render(createElement(ContactPanelView, { sheet: null, closeHref: "/" }));
    const dialog = screen.getByRole("dialog", { name: "Contact introuvable" });
    expect(within(dialog).getByText("Ce contact n'existe plus.")).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: "Fermer" })).toBeTruthy();
  });

  it("un contact : son nom en titre, sa fiche, et « Notes » un niveau sous le titre", () => {
    const contact = makeContact({ id: "x", name: "Claire Martin", company: "Atelier Nord" });
    render(createElement(ContactPanelView, { sheet: { contact, notes: [] }, closeHref: "/" }));
    const dialog = screen.getByRole("dialog", { name: "Claire Martin" });
    expect(within(dialog).getByText("Atelier Nord")).toBeTruthy();
    expect(within(dialog).getByRole("heading", { level: 3, name: "Notes" })).toBeTruthy();
  });
});
