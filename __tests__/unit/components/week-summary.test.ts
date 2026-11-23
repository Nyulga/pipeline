// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { WeekSummaryView } from "@/components/contacts/week-summary";
import { makeContact } from "./helpers/contact";

afterEach(cleanup);

const tile = (label: string) => within(screen.getByRole("region", { name: "Ta semaine" })).getByText(label).parentElement!;

describe("WeekSummaryView : « Ta semaine » (lot 10)", () => {
  it("les trois chiffres : appels passés, taux d'acceptation, relances à venir", () => {
    const upcoming = [
      makeContact({ id: "a", name: "Claire Martin", nextFollowUp: "2026-11-25" }),
      makeContact({ id: "b", name: "Hugo Petit", nextFollowUp: "2026-11-28" }),
    ];
    render(
      createElement(WeekSummaryView, {
        summary: { callsThisWeek: 3, acceptanceRate: 67, upcoming },
        linkParams: { q: "nord" },
      }),
    );
    expect(tile("Appels passés").textContent).toContain("3");
    expect(tile("Taux d'acceptation").textContent).toContain("67 %");
    expect(tile("Relances à venir").textContent).toContain("2");

    const list = within(screen.getByRole("region", { name: "Ta semaine" })).getByRole("list");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByRole("link", { name: "Claire Martin" }).getAttribute("href")).toBe("/?q=nord&contact=a");
    expect(items[0].textContent).toContain("25 nov.");
  });

  it("sans réponse : « — » ; sans relance à venir : un message", () => {
    render(createElement(WeekSummaryView, { summary: { callsThisWeek: 0, acceptanceRate: null, upcoming: [] } }));
    expect(tile("Taux d'acceptation").textContent).toContain("—");
    expect(tile("Relances à venir").textContent).toContain("0");
    expect(screen.getByText("Aucune relance prévue ces 7 prochains jours.")).toBeTruthy();
  });
});
