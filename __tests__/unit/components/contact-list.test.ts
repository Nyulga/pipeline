// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions", () => ({ setCalledAction: vi.fn(), setResponseAction: vi.fn() }));

import { ContactListContent } from "@/components/contacts/contact-list";
import { makeContact } from "./helpers/contact";

afterEach(cleanup);

describe("ContactListContent : la liste, filtrée ou non (lot 4)", () => {
  it("une recherche sans résultat le dit, avec la recherche", () => {
    render(createElement(ContactListContent, { contacts: [], query: "martin" }));
    expect(screen.getByText("Aucun contact ne correspond à « martin ».")).toBeTruthy();
  });

  it("sans recherche et sans contact, invite à ajouter le premier", () => {
    render(createElement(ContactListContent, { contacts: [], query: "" }));
    expect(screen.getByText("Ta liste est vide")).toBeTruthy();
  });

  it("affiche les contacts trouvés", () => {
    render(createElement(ContactListContent, { contacts: [makeContact({ name: "Claire Martin" })], query: "martin" }));
    expect(screen.getByRole("listitem", { name: "Claire Martin" })).toBeTruthy();
  });
});

describe("ContactListContent : filtre par étape (lot 7)", () => {
  const contacts = [
    makeContact({ name: "Ana" }),
    makeContact({ name: "Bruno", called: true, response: "accepte" }),
    makeContact({ name: "Chloé", called: true }),
  ];

  it("n'affiche que les contacts de l'étape choisie, et les pastilles comptent tout", () => {
    render(createElement(ContactListContent, { contacts, query: "", stage: "accepte" }));
    expect(screen.getAllByRole("listitem").map((li) => li.getAttribute("aria-label"))).toEqual(["Bruno"]);
    expect(screen.getByRole("link", { name: /^Tous/ }).textContent).toBe("Tous3");
  });

  it("une étape sans contact le dit", () => {
    render(createElement(ContactListContent, { contacts, query: "", stage: "refuse" }));
    expect(screen.getByText("Aucun contact à l'étape « Refusé »."))
      .toBeTruthy();
  });

  it("sans étape, tous les contacts", () => {
    render(createElement(ContactListContent, { contacts, query: "" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });
});

describe("ContactListContent : chaque liste vide propose l'action pour la remplir (lot 11)", () => {
  it("liste vide : un bouton « Ajouter un contact »", () => {
    render(createElement(ContactListContent, { contacts: [], query: "" }));
    expect(screen.getByRole("button", { name: "Ajouter un contact" })).toBeTruthy();
  });

  it("recherche sans résultat : « Effacer la recherche », qui garde le filtre et la vue", () => {
    render(createElement(ContactListContent, { contacts: [], query: "martin", stage: "accepte", view: "etapes" }));
    expect(screen.getByRole("link", { name: "Effacer la recherche" }).getAttribute("href")).toBe("/?etape=accepte&vue=etapes");
  });

  it("étape vide : « Voir tous les contacts », qui garde la recherche et la vue", () => {
    const contacts = [makeContact({ name: "Ana" })];
    render(createElement(ContactListContent, { contacts, query: "an", stage: "refuse", view: "etapes" }));
    expect(screen.getByRole("link", { name: "Voir tous les contacts" }).getAttribute("href")).toBe("/?q=an&vue=etapes");
  });

  it("les pastilles d'étape gardent la vue", () => {
    const contacts = [makeContact({ name: "Ana" })];
    render(createElement(ContactListContent, { contacts, query: "", view: "etapes" }));
    expect(screen.getByRole("link", { name: /^Accepté/ }).getAttribute("href")).toBe("/?etape=accepte&vue=etapes");
  });
});
