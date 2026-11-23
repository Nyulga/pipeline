import { describe, expect, it } from "vitest";
import { callQueue, nextDay } from "@/services/call-queue";
import type { Contact } from "@/services/contact-model";

let n = 0;
const c = (over: Partial<Contact>): Contact => ({
  id: `q${++n}`,
  name: `Contact ${n}`,
  company: null,
  phone: null,
  email: null,
  called: false,
  calledAt: null,
  response: "enAttente",
  nextFollowUp: null,
  createdAt: "2026-11-01T09:00:00.000Z",
  ...over,
});

const TODAY = "2026-11-23";
const names = (list: Contact[]) => callQueue(list, TODAY).map((i) => i.contact.name);

describe("callQueue : la prochaine personne à appeler (lot 7)", () => {
  it("relances en retard (la plus ancienne d'abord), puis du jour, puis jamais appelés (le plus ancien ajout d'abord)", () => {
    const list = [
      c({ name: "Neuf récent", createdAt: "2026-11-20T09:00:00.000Z" }),
      c({ name: "Du jour", called: true, nextFollowUp: TODAY }),
      c({ name: "Retard récent", called: true, nextFollowUp: "2026-11-22" }),
      c({ name: "Neuf ancien", createdAt: "2026-11-02T09:00:00.000Z" }),
      c({ name: "Retard ancien", called: true, nextFollowUp: "2026-11-10" }),
    ];
    expect(names(list)).toEqual(["Retard ancien", "Retard récent", "Du jour", "Neuf ancien", "Neuf récent"]);
  });

  it("donne la raison de chaque place", () => {
    const list = [c({ name: "A", nextFollowUp: "2026-11-01" }), c({ name: "B", nextFollowUp: TODAY }), c({ name: "C" })];
    expect(callQueue(list, TODAY).map((i) => i.reason)).toEqual(["enRetard", "aujourdhui", "jamaisAppele"]);
  });

  it("à égalité, départage par nom", () => {
    const list = [c({ name: "Zoé", nextFollowUp: TODAY }), c({ name: "Ève", nextFollowUp: TODAY })];
    expect(names(list)).toEqual(["Ève", "Zoé"]);
  });

  it("acceptés et refusés n'y sont jamais, même avec une relance passée", () => {
    const list = [
      c({ name: "Oui", called: true, response: "accepte", nextFollowUp: "2026-11-01" }),
      c({ name: "Non", called: true, response: "refuse" }),
    ];
    expect(names(list)).toEqual([]);
  });

  it("n'y sont pas non plus : déjà appelé sans relance due, relance dans le futur (« Plus tard »)", () => {
    const list = [
      c({ name: "Appelé en attente", called: true }),
      c({ name: "Plus tard", nextFollowUp: "2026-11-24" }),
      c({ name: "Appelé, relance future", called: true, nextFollowUp: "2026-12-01" }),
    ];
    expect(names(list)).toEqual([]);
  });
});

describe("nextDay : le lendemain d'un jour", () => {
  it.each([
    ["2026-11-23", "2026-11-24"],
    ["2026-11-30", "2026-12-01"],
    ["2026-12-31", "2027-01-01"],
    ["2028-02-28", "2028-02-29"],
    ["2027-02-28", "2027-03-01"],
    ["2026-03-28", "2026-03-29"], // veille du passage à l'heure d'été
    ["2026-10-24", "2026-10-25"], // veille du passage à l'heure d'hiver
  ])("%s → %s", (day, next) => {
    expect(nextDay(day)).toBe(next);
  });
});
