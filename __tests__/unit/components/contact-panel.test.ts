// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
const back = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, back }) }));

import { ContactPanel } from "@/components/contacts/contact-panel";
import { markPanelOpened } from "@/components/contacts/panel-history";

beforeEach(() => {
  replace.mockReset();
  back.mockReset();
});
afterEach(cleanup);

const open = () =>
  render(
    createElement(
      ContactPanel,
      { title: "Claire Martin", closeHref: "/?q=nord" },
      createElement("p", null, "Contenu de la fiche"),
    ),
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

describe("ContactPanel : fermer sans attendre, et l'historique (revue de la PR #23)", () => {
  it("le panneau se ferme tout de suite, avant la réponse du serveur", async () => {
    open();
    await act(async () => {
      fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Fermer" }));
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("ouvert depuis l'app : fermer revient en arrière dans l'historique (Retour ne bégaie pas)", async () => {
    markPanelOpened();
    open();
    await act(async () => {
      fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Fermer" }));
    });
    expect(back).toHaveBeenCalledOnce();
    expect(replace).not.toHaveBeenCalled();
  });

  it("ouvert par un lien ou un rechargement : fermer remplace l'adresse (rien à quoi revenir)", async () => {
    open();
    await act(async () => {
      fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    });
    expect(replace).toHaveBeenCalledOnce();
    expect(back).not.toHaveBeenCalled();
  });
});
