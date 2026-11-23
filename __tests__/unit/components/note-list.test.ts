// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { NoteList } from "@/components/contacts/note-list";

afterEach(cleanup);

describe("NoteList : les notes de la fiche (lot 4)", () => {
  it("affiche chaque note avec sa date à l'heure de Paris, dans l'ordre reçu (plus récentes d'abord)", () => {
    render(
      createElement(NoteList, {
        notes: [
          { id: "n2", contactId: "c", body: "Rappeler lundi", createdAt: "2026-11-21T09:30:00.000Z" },
          { id: "n1", contactId: "c", body: "Premier appel", createdAt: "2026-07-01T22:05:00.000Z" },
        ],
      }),
    );
    const items = screen.getAllByRole("listitem");
    expect(items.map((li) => li.querySelector("p")?.textContent)).toEqual(["Rappeler lundi", "Premier appel"]);
    expect(items[0].querySelector("time")?.textContent).toBe("21 nov. 2026 à 10:30");
    expect(items[0].querySelector("time")?.getAttribute("dateTime")).toBe("2026-11-21T09:30:00.000Z");
    // 22 h 05 UTC en été : déjà le 2 juillet à Paris.
    expect(items[1].querySelector("time")?.textContent).toBe("2 juil. 2026 à 00:05");
  });

  it("sans note, le dit", () => {
    render(createElement(NoteList, { notes: [] }));
    expect(screen.getByText("Aucune note pour l'instant.", { exact: false })).toBeTruthy();
    // L'action pour la remplir : le formulaire juste au-dessus (lot 11).
    expect(screen.getByText(/Écris la première ci-dessus\./)).toBeTruthy();
  });
});
