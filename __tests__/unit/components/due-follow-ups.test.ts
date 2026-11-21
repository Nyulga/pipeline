// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { DueFollowUpList } from "@/components/contacts/due-follow-ups";
import { makeContact } from "./helpers/contact";

afterEach(cleanup);

describe("DueFollowUpList : « À relancer aujourd'hui » (lot 3)", () => {
  it("liste chaque contact avec un lien vers sa fiche et l'état de sa relance", () => {
    const retard = makeContact({ id: "r", name: "Hugo Petit", nextFollowUp: "2026-11-18" });
    const jour = makeContact({ id: "j", name: "Claire Martin", nextFollowUp: "2026-11-21" });
    render(
      createElement(DueFollowUpList, {
        items: [
          { contact: retard, state: "enRetard" },
          { contact: jour, state: "aujourdhui" },
        ],
      }),
    );

    const section = screen.getByRole("region", { name: "À relancer aujourd'hui" });
    const items = within(section).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByRole("link", { name: "Hugo Petit" }).getAttribute("href")).toBe("/contacts/r");
    expect(within(items[0]).getByText("En retard", { selector: "[data-slot=badge]" })).toBeTruthy();
    expect(within(items[0]).getByText("Prévue le 18 nov. 2026")).toBeTruthy();
    expect(within(items[1]).getByRole("link", { name: "Claire Martin" }).getAttribute("href")).toBe("/contacts/j");
    expect(within(items[1]).getByText("Aujourd'hui", { selector: "[data-slot=badge]" })).toBeTruthy();
  });

  it("sans relance due, le dit", () => {
    render(createElement(DueFollowUpList, { items: [] }));
    const section = screen.getByRole("region", { name: "À relancer aujourd'hui" });
    expect(within(section).getByText("Personne à relancer aujourd'hui.")).toBeTruthy();
  });
});
