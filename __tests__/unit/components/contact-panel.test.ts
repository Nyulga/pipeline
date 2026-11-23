// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

import { ContactPanel } from "@/components/contacts/contact-panel";

beforeEach(() => replace.mockReset());
afterEach(cleanup);

const open = () =>
  render(
    createElement(ContactPanel, {
      title: "Claire Martin",
      closeHref: "/?q=nord",
      children: createElement("p", null, "Contenu de la fiche"),
    }),
  );

describe("ContactPanel : la fiche par-dessus la liste (lot 9)", () => {
  it("s'ouvre en dialog, titré du nom, avec le contenu de la fiche", () => {
    open();
    const dialog = screen.getByRole("dialog", { name: "Claire Martin" });
    expect(within(dialog).getByText("Contenu de la fiche")).toBeTruthy();
  });

  it("« Fermer » revient à l'adresse sans contact, sans faire défiler la liste", async () => {
    open();
    await act(async () => {
      fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Fermer" }));
    });
    expect(replace).toHaveBeenCalledWith("/?q=nord", { scroll: false });
  });

  it("Échap aussi", async () => {
    open();
    await act(async () => {
      fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    });
    expect(replace).toHaveBeenCalledWith("/?q=nord", { scroll: false });
  });
});
