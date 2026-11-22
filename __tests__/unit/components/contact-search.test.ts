// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { ContactSearch } from "@/components/contacts/contact-search";

afterEach(cleanup);

describe("ContactSearch : retrouver un contact (lot 4)", () => {
  it("un formulaire de recherche envoyé en GET sur l'accueil, avec le champ q", () => {
    render(createElement(ContactSearch, { query: "" }));
    const form = screen.getByRole("search");
    expect(form.getAttribute("action")).toBe("/");
    expect(form.getAttribute("method")?.toLowerCase() ?? "get").toBe("get");
    expect(screen.getByLabelText("Rechercher").getAttribute("name")).toBe("q");
    expect(screen.queryByRole("link", { name: "Effacer la recherche" })).toBeNull();
  });

  it("garde la recherche en cours et propose de l'effacer", () => {
    render(createElement(ContactSearch, { query: "hélène" }));
    expect(screen.getByLabelText("Rechercher")).toHaveProperty("value", "hélène");
    expect(screen.getByRole("link", { name: "Effacer la recherche" }).getAttribute("href")).toBe("/");
  });

  it("quand la recherche change (ex. « Effacer la recherche »), le champ suit, même après une saisie", () => {
    const { rerender } = render(createElement(ContactSearch, { query: "dupont" }));
    fireEvent.change(screen.getByLabelText("Rechercher"), { target: { value: "abc" } });
    rerender(createElement(ContactSearch, { query: "" }));
    expect(screen.getByLabelText("Rechercher")).toHaveProperty("value", "");
  });
});

describe("ContactSearch : la recherche garde le filtre d'étape (lot 7)", () => {
  it("envoie l'étape en cours avec la recherche", () => {
    render(createElement(ContactSearch, { query: "", stage: "accepte" }));
    const hidden = screen.getByRole("search").querySelector("input[type=hidden][name=etape]");
    expect(hidden?.getAttribute("value")).toBe("accepte");
  });

  it("« Effacer la recherche » garde l'étape", () => {
    render(createElement(ContactSearch, { query: "nord", stage: "refuse" }));
    expect(screen.getByRole("link", { name: "Effacer la recherche" }).getAttribute("href")).toBe("/?etape=refuse");
  });

  it("sans étape, pas de champ caché", () => {
    render(createElement(ContactSearch, { query: "" }));
    expect(screen.getByRole("search").querySelector("input[name=etape]")).toBeNull();
  });
});
