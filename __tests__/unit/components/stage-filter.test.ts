// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { StageFilter } from "@/components/contacts/stage-filter";
import { makeContact } from "./helpers/contact";

afterEach(cleanup);

const contacts = [
  makeContact({}),
  makeContact({}),
  makeContact({ called: true }),
  makeContact({ called: true, response: "accepte" }),
];

const nav = () => screen.getByRole("navigation", { name: "Filtrer par étape" });
const link = (name: RegExp) => within(nav()).getByRole("link", { name });

describe("StageFilter : les pastilles d'étape, avec leur nombre (lot 7)", () => {
  it("« Tous » et chaque étape, avec des nombres justes", () => {
    render(createElement(StageFilter, { contacts, active: null, query: "" }));
    expect(within(nav()).getAllByRole("link").map((a) => a.textContent)).toEqual([
      "Tous4",
      "À appeler2",
      "Appelé · en attente1",
      "Accepté1",
      "Refusé0",
    ]);
  });

  it("chaque pastille mène à son étape dans l'adresse, en gardant la recherche", () => {
    render(createElement(StageFilter, { contacts, active: null, query: "nord est" }));
    expect(link(/^Accepté/).getAttribute("href")).toBe("/?q=nord+est&etape=accepte");
    expect(link(/^Tous/).getAttribute("href")).toBe("/?q=nord+est");
  });

  it("sans recherche, « Tous » ramène à l'accueil", () => {
    render(createElement(StageFilter, { contacts, active: "refuse", query: "" }));
    expect(link(/^Tous/).getAttribute("href")).toBe("/");
    expect(link(/^À appeler/).getAttribute("href")).toBe("/?etape=aAppeler");
  });

  it("la pastille active est signalée", () => {
    render(createElement(StageFilter, { contacts, active: "accepte", query: "" }));
    expect(link(/^Accepté/).getAttribute("aria-current")).toBe("page");
    expect(link(/^Tous/).getAttribute("aria-current")).toBeNull();
  });
});
