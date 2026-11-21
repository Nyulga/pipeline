// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { FollowUpBadge, StageBadge, followUpStyles, stageStyles } from "@/components/status-badge";
import { STAGES } from "@/services/tracking";

afterEach(cleanup);

describe("StageBadge : l'étape d'un contact dans le design system", () => {
  it("donne un libellé à chacune des 4 étapes, dans l'ordre du parcours", () => {
    expect(STAGES.map((s) => stageStyles[s].label)).toEqual([
      "À appeler",
      "Appelé · en attente",
      "Accepté",
      "Refusé",
    ]);
  });

  it("chaque étape a sa pastille de couleur (token du thème)", () => {
    for (const s of STAGES) expect(stageStyles[s].dot).toMatch(/^bg-[a-z-]+$/);
  });

  it("affiche le libellé de l'étape dans un badge", () => {
    render(createElement(StageBadge, { stage: "appeleEnAttente" }));
    expect(screen.getByText("Appelé · en attente", { selector: "[data-slot=badge]" })).toBeTruthy();
  });
});

describe("FollowUpBadge : l'état d'une relance (lot 3)", () => {
  it("« Aujourd'hui » et « En retard », chacun avec sa couleur du thème", () => {
    expect(followUpStyles.aujourdhui.label).toBe("Aujourd'hui");
    expect(followUpStyles.enRetard.label).toBe("En retard");
    expect(followUpStyles.enRetard.className).toMatch(/destructive/);
  });

  it("affiche le libellé dans un badge", () => {
    render(createElement(FollowUpBadge, { state: "enRetard" }));
    expect(screen.getByText("En retard", { selector: "[data-slot=badge]" })).toBeTruthy();
  });
});
