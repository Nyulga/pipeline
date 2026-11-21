// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { StageBoard } from "@/components/contacts/stage-board";
import type { Contact } from "@/services/contacts";

let n = 0;
const contact = (name: string, called: boolean, response: Contact["response"]): Contact => ({
  id: `c${++n}`,
  name,
  company: null,
  phone: null,
  email: null,
  called,
  response,
  createdAt: "2026-11-19T10:00:00.000Z",
});

const contacts = [
  contact("Ana", false, "enAttente"),
  contact("Bruno", true, "enAttente"),
  contact("Chloé", true, "accepte"),
  contact("David", false, "enAttente"),
];

const show = () => render(createElement(StageBoard, { contacts, renderContact: (c: Contact) => c.name }));

const column = (label: string) => screen.getByRole("region", { name: new RegExp(`^${label}`) });

afterEach(cleanup);

describe("StageBoard : la vue par étape", () => {
  it("affiche les 4 colonnes dans l'ordre du parcours", () => {
    show();
    const regions = screen.getAllByRole("region");
    expect(regions.map((r) => r.getAttribute("data-stage"))).toEqual([
      "aAppeler",
      "appeleEnAttente",
      "accepte",
      "refuse",
    ]);
    for (const label of ["À appeler", "Appelé · en attente", "Accepté", "Refusé"]) expect(column(label)).toBeTruthy();
  });

  it("range chaque contact dans la bonne colonne", () => {
    show();
    const names = (label: string) => within(column(label)).queryAllByRole("listitem").map((li) => li.textContent);
    expect(names("À appeler")).toEqual(["Ana", "David"]);
    expect(names("Appelé · en attente")).toEqual(["Bruno"]);
    expect(names("Accepté")).toEqual(["Chloé"]);
    expect(names("Refusé")).toEqual([]);
  });

  it("affiche le nombre de contacts de chaque colonne", () => {
    show();
    expect(within(column("À appeler")).getByLabelText("2 contacts").textContent).toBe("2");
    expect(within(column("Appelé · en attente")).getByLabelText("1 contact").textContent).toBe("1");
    expect(within(column("Accepté")).getByLabelText("1 contact").textContent).toBe("1");
    expect(within(column("Refusé")).getByLabelText("0 contact").textContent).toBe("0");
  });

  it("indique « Aucun contact » dans une colonne vide", () => {
    show();
    expect(within(column("Refusé")).getByText("Aucun contact")).toBeTruthy();
    expect(within(column("Accepté")).queryByText("Aucun contact")).toBeNull();
  });
});
