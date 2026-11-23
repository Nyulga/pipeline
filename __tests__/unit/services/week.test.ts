import { describe, expect, it } from "vitest";
import { makeContact } from "../components/helpers/contact";
import { weekStartInParis, weekSummary } from "@/services/week";

const at = (iso: string) => new Date(iso);

describe("weekStartInParis : lundi 0 h, heure de Paris (lot 10)", () => {
  it("un mercredi : le lundi de la semaine à 0 h (UTC+1 l'hiver)", () => {
    expect(weekStartInParis(at("2026-11-25T10:00:00Z")).toISOString()).toBe("2026-11-22T23:00:00.000Z");
  });

  it("dimanche 23 h 30 à Paris : encore la même semaine", () => {
    expect(weekStartInParis(at("2026-11-29T22:30:00Z")).toISOString()).toBe("2026-11-22T23:00:00.000Z");
  });

  it("lundi 0 h 30 à Paris (encore dimanche en UTC) : la nouvelle semaine", () => {
    expect(weekStartInParis(at("2026-11-29T23:30:00Z")).toISOString()).toBe("2026-11-29T23:00:00.000Z");
  });

  it("semaine du passage à l'heure d'été (dimanche 29 mars 2026)", () => {
    expect(weekStartInParis(at("2026-03-29T12:00:00Z")).toISOString()).toBe("2026-03-22T23:00:00.000Z");
    expect(weekStartInParis(at("2026-04-01T10:00:00Z")).toISOString()).toBe("2026-03-29T22:00:00.000Z");
  });

  it("semaine du passage à l'heure d'hiver (dimanche 25 octobre 2026)", () => {
    expect(weekStartInParis(at("2026-10-25T12:00:00Z")).toISOString()).toBe("2026-10-18T22:00:00.000Z");
    expect(weekStartInParis(at("2026-10-27T10:00:00Z")).toISOString()).toBe("2026-10-25T23:00:00.000Z");
  });
});

describe("weekSummary : les chiffres de « Ta semaine » (lot 10)", () => {
  const now = at("2026-11-25T10:00:00Z"); // mercredi ; la semaine commence à 2026-11-22T23:00Z

  it("appels passés : appelés depuis lundi 0 h ; avant lundi ou sans date, ils ne comptent pas", () => {
    const contacts = [
      makeContact({ called: true, calledAt: "2026-11-22T23:00:00.000Z" }), // lundi 0 h pile
      makeContact({ called: true, response: "accepte", calledAt: "2026-11-24T08:00:00.000Z" }),
      makeContact({ called: true, calledAt: "2026-11-22T22:59:59.999Z" }), // dimanche 23 h 59
      makeContact({ called: true, calledAt: null }), // appel d'avant le lot 10
      makeContact({ called: false, calledAt: null }),
    ];
    expect(weekSummary(contacts, now).callsThisWeek).toBe(2);
  });

  it("taux d'acceptation : acceptés ÷ (acceptés + refusés), arrondi", () => {
    const contacts = [
      makeContact({ called: true, response: "accepte" }),
      makeContact({ called: true, response: "accepte" }),
      makeContact({ called: true, response: "refuse" }),
      makeContact({ called: true, response: "enAttente" }),
      makeContact(),
    ];
    expect(weekSummary(contacts, now).acceptanceRate).toBe(67);
  });

  it("taux d'acceptation : null sans aucune réponse", () => {
    expect(weekSummary([makeContact(), makeContact({ called: true })], now).acceptanceRate).toBeNull();
    expect(weekSummary([], now).acceptanceRate).toBeNull();
  });

  it("relances des 7 prochains jours : d'aujourd'hui à J+6, par jour puis par nom", () => {
    const contacts = [
      makeContact({ id: "j6", name: "Zoé", nextFollowUp: "2026-12-01" }),
      makeContact({ id: "j0b", name: "Bruno", nextFollowUp: "2026-11-25" }),
      makeContact({ id: "j0a", name: "anne", nextFollowUp: "2026-11-25" }),
      makeContact({ id: "j7", nextFollowUp: "2026-12-02" }),
      makeContact({ id: "hier", nextFollowUp: "2026-11-24" }),
      makeContact({ id: "sans" }),
    ];
    expect(weekSummary(contacts, now).upcoming.map((c) => c.id)).toEqual(["j0a", "j0b", "j6"]);
  });

  it("relances : un contact accepté ou refusé n'est plus à relancer", () => {
    const contacts = [
      makeContact({ id: "ok", called: true, response: "accepte", nextFollowUp: "2026-11-26" }),
      makeContact({ id: "non", called: true, response: "refuse", nextFollowUp: "2026-11-26" }),
      makeContact({ id: "att", called: true, nextFollowUp: "2026-11-26" }),
    ];
    expect(weekSummary(contacts, now).upcoming.map((c) => c.id)).toEqual(["att"]);
  });
});
