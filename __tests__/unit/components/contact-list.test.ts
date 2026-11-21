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
