import { describe, expect, it } from "vitest";
import {
  STAGES,
  groupByStage,
  markCalled,
  markNotCalled,
  parseStage,
  stageOf,
  trackingForStage,
  withResponse,
  type Tracking,
} from "@/services/tracking";

const t = (called: boolean, response: Tracking["response"]): Tracking => ({ called, response });

describe("stageOf : l'étape se déduit de appelé + réponse", () => {
  it.each([
    [t(false, "enAttente"), "aAppeler"],
    [t(true, "enAttente"), "appeleEnAttente"],
    [t(true, "accepte"), "accepte"],
    [t(true, "refuse"), "refuse"],
  ] as const)("%o → %s", (tracking, stage) => {
    expect(stageOf(tracking)).toBe(stage);
  });
});

describe("STAGES", () => {
  it("liste les 4 étapes dans l'ordre du parcours", () => {
    expect(STAGES).toEqual(["aAppeler", "appeleEnAttente", "accepte", "refuse"]);
  });
});

describe("règles de suivi", () => {
  it("marquer appelé garde la réponse", () => {
    expect(markCalled(t(false, "enAttente"))).toEqual(t(true, "enAttente"));
  });

  it("repasser en « non appelé » remet la réponse à « en attente »", () => {
    expect(markNotCalled()).toEqual(t(false, "enAttente"));
  });

  it("ne renvoie que le suivi, même à partir d'un contact complet", () => {
    const contact = { id: "x", name: "Claire", ...t(false, "enAttente") };
    expect(markCalled(contact)).toEqual(t(true, "enAttente"));
    expect(withResponse(contact, "accepte")).toEqual(t(true, "accepte"));
  });

  it("une réponse « accepté » ou « refusé » marque aussi le contact comme appelé", () => {
    expect(withResponse(t(false, "enAttente"), "accepte")).toEqual(t(true, "accepte"));
    expect(withResponse(t(false, "enAttente"), "refuse")).toEqual(t(true, "refuse"));
  });

  it("remettre « en attente » ne change pas l'état d'appel", () => {
    expect(withResponse(t(true, "accepte"), "enAttente")).toEqual(t(true, "enAttente"));
    expect(withResponse(t(false, "enAttente"), "enAttente")).toEqual(t(false, "enAttente"));
  });

  it("un contact refusé remis « en attente » reste appelé (étape « Appelé · en attente »)", () => {
    expect(withResponse(t(true, "refuse"), "enAttente")).toEqual(t(true, "enAttente"));
  });

  it("ne modifie jamais l'objet reçu", () => {
    const before = t(true, "accepte");
    withResponse(before, "refuse");
    expect(before).toEqual(t(true, "accepte"));
  });
});

describe("trackingForStage : l'appel et la réponse de chaque étape (lot 8)", () => {
  it.each([
    ["aAppeler", false, "enAttente"],
    ["appeleEnAttente", true, "enAttente"],
    ["accepte", true, "accepte"],
    ["refuse", true, "refuse"],
  ] as const)("%s → appelé %s, réponse %s", (stage, called, response) => {
    expect(trackingForStage(stage)).toEqual(t(called, response));
  });

  it("est l'inverse exact de stageOf : revenir à l'étape d'avant redonne le suivi d'avant", () => {
    for (const s of STAGES) expect(stageOf(trackingForStage(s))).toBe(s);
    for (const before of [t(false, "enAttente"), t(true, "enAttente"), t(true, "accepte"), t(true, "refuse")])
      expect(trackingForStage(stageOf(before))).toEqual(before);
  });

  it("repasser en « À appeler » remet la réponse en attente, depuis n'importe quelle étape", () => {
    expect(trackingForStage("aAppeler")).toEqual(t(false, "enAttente"));
  });
});

describe("groupByStage", () => {
  it("range chaque contact dans sa colonne, en gardant l'ordre, avec toutes les colonnes présentes", () => {
    const contacts = [
      { id: "a", ...t(false, "enAttente") },
      { id: "b", ...t(true, "accepte") },
      { id: "c", ...t(false, "enAttente") },
      { id: "d", ...t(true, "enAttente") },
    ];
    const groups = groupByStage(contacts);
    expect(Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.map((c) => c.id)]))).toEqual({
      aAppeler: ["a", "c"],
      appeleEnAttente: ["d"],
      accepte: ["b"],
      refuse: [],
    });
  });
});

describe("parseStage : l'étape lue dans l'adresse (lot 7)", () => {
  it("reconnaît chaque étape", () => {
    for (const s of STAGES) expect(parseStage(s)).toBe(s);
  });
  it.each([undefined, null, "", "tous", "ACCEPTE", ["accepte"], 3])("%j → null (« Tous »)", (v) => {
    expect(parseStage(v)).toBeNull();
  });
});
