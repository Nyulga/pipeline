// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

// L'adresse en cours (recherche, filtre, vue) : remplacée pour chaque test.
let search = "";
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(search) }));

import { MobileTabBar } from "@/components/contacts/mobile-tab-bar";

afterEach(() => {
  cleanup();
  search = "";
});

const bar = () => screen.getByRole("navigation", { name: "Navigation principale" });
const tab = (name: string) => within(bar()).getByRole("link", { name });
const current = () => within(bar()).getAllByRole("link").filter((a) => a.getAttribute("aria-current") === "page").map((a) => a.textContent);

describe("MobileTabBar : la barre d'onglets du téléphone (lot 11)", () => {
  it("trois onglets : Aujourd'hui, Contacts, Étapes, avec leurs adresses", () => {
    render(createElement(MobileTabBar));
    expect(within(bar()).getAllByRole("link").map((a) => a.textContent)).toEqual(["Aujourd'hui", "Contacts", "Étapes"]);
    expect(tab("Aujourd'hui").getAttribute("href")).toBe("/#aujourdhui");
    expect(tab("Contacts").getAttribute("href")).toBe("/#mes-contacts");
    expect(tab("Étapes").getAttribute("href")).toBe("/?vue=etapes#mes-contacts");
  });

  it("garde la recherche et le filtre ; « Contacts » revient à la liste, « Étapes » ouvre la vue par étape", () => {
    search = "q=nord&etape=accepte&vue=etapes&contact=abc";
    render(createElement(MobileTabBar));
    expect(tab("Aujourd'hui").getAttribute("href")).toBe("/?q=nord&etape=accepte&vue=etapes#aujourdhui");
    expect(tab("Contacts").getAttribute("href")).toBe("/?q=nord&etape=accepte#mes-contacts");
    expect(tab("Étapes").getAttribute("href")).toBe("/?q=nord&etape=accepte&vue=etapes#mes-contacts");
  });

  it("téléphone seulement : masquée à partir de md, fixée en bas", () => {
    render(createElement(MobileTabBar));
    expect(bar().className).toContain("md:hidden");
    expect(bar().className).toContain("fixed");
    expect(bar().className).toContain("bottom-0");
  });

  it("à l'arrivée, « Aujourd'hui » est l'onglet en cours", () => {
    render(createElement(MobileTabBar));
    expect(current()).toEqual(["Aujourd'hui"]);
  });

  it("avec ?vue=etapes, « Étapes » est en cours une fois qu'on va vers les contacts", async () => {
    search = "vue=etapes";
    render(createElement(MobileTabBar));
    await act(async () => {
      fireEvent.click(tab("Étapes"));
    });
    expect(current()).toEqual(["Étapes"]);
  });

  it("rechargée sur #mes-contacts : « Contacts » (ou « Étapes ») est en cours, pas « Aujourd'hui » (revue de la PR #25)", async () => {
    window.history.replaceState(null, "", "/#mes-contacts");
    search = "vue=etapes";
    await act(async () => {
      render(createElement(MobileTabBar));
    });
    expect(current()).toEqual(["Étapes"]);
    window.history.replaceState(null, "", "/");
  });

  it("toucher « Contacts » le met en cours", async () => {
    render(createElement(MobileTabBar));
    await act(async () => {
      fireEvent.click(tab("Contacts"));
    });
    expect(current()).toEqual(["Contacts"]);
  });

  it("chaque onglet est assez grand pour le doigt", () => {
    render(createElement(MobileTabBar));
    for (const a of within(bar()).getAllByRole("link")) expect(a.className).toContain("min-h-11");
  });
});
