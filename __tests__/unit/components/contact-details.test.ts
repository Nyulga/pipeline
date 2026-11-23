// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions", () => ({ setFollowUpAction: vi.fn(), addNoteAction: vi.fn() }));

import { ContactDetails } from "@/components/contacts/contact-details";
import { makeContact } from "./helpers/contact";

afterEach(cleanup);

const claire = makeContact({
  id: "cl",
  name: "Claire Martin",
  company: "Atelier Nord",
  phone: "06 12 34 56 78",
  email: "claire@ateliernord.fr",
  called: true,
  nextFollowUp: "2026-12-03",
});
const notes = [
  { id: "n2", contactId: "cl", body: "Rappeler lundi", createdAt: "2026-11-21T09:30:00.000Z" },
  { id: "n1", contactId: "cl", body: "Premier appel", createdAt: "2026-11-01T09:30:00.000Z" },
];

describe("ContactDetails : le contenu de la fiche, page ou panneau (lot 9)", () => {
  it("coordonnées, entreprise et étape", () => {
    render(createElement(ContactDetails, { contact: claire, notes }));
    expect(screen.getByText("Atelier Nord")).toBeTruthy();
    expect(screen.getByRole("link", { name: /06 12 34 56 78/ }).getAttribute("href")).toBe("tel:0612345678");
    expect(screen.getByRole("link", { name: /claire@ateliernord\.fr/ }).getAttribute("href")).toBe(
      "mailto:claire@ateliernord.fr",
    );
    expect(screen.getByText("Appelé · en attente", { selector: "[data-slot=badge]" })).toBeTruthy();
  });

  it("la relance, avec son formulaire", () => {
    render(createElement(ContactDetails, { contact: claire, notes }));
    const relance = screen.getByRole("region", { name: "Prochaine relance" });
    expect(within(relance).getByDisplayValue("2026-12-03")).toBeTruthy();
  });

  it("les notes, les plus récentes d'abord, avec le formulaire d'ajout", () => {
    render(createElement(ContactDetails, { contact: claire, notes }));
    const section = screen.getByRole("region", { name: "Notes" });
    expect(within(section).getAllByRole("listitem").map((li) => li.querySelector("p")?.textContent)).toEqual([
      "Rappeler lundi",
      "Premier appel",
    ]);
    expect(within(section).getByRole("textbox")).toBeTruthy();
  });

  it("sans entreprise, le dit", () => {
    render(createElement(ContactDetails, { contact: makeContact({ name: "Inès" }), notes: [] }));
    expect(screen.getByText("Sans entreprise")).toBeTruthy();
  });
});
