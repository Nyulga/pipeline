import { describe, expect, it } from "vitest";
import { dueFollowUps, followUpState, parseFollowUpDate, todayInParis } from "@/services/follow-up";
import type { Contact } from "@/services/contact-model";

let n = 0;
const contact = (over: Partial<Contact> = {}): Contact => ({
  id: `c${++n}`,
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

describe("todayInParis : « aujourd'hui » s'entend à l'heure de Paris", () => {
  it("en hiver (UTC+1), 23 h 30 UTC est déjà le lendemain à Paris", () => {
    expect(todayInParis(new Date("2026-11-21T23:30:00Z"))).toBe("2026-11-22");
  });

  it("en hiver, 22 h 59 UTC est encore le jour même à Paris", () => {
    expect(todayInParis(new Date("2026-11-21T22:59:00Z"))).toBe("2026-11-21");
  });

  it("en été (UTC+2), 22 h 30 UTC est déjà le lendemain à Paris", () => {
    expect(todayInParis(new Date("2026-07-01T22:30:00Z"))).toBe("2026-07-02");
  });
});

describe("parseFollowUpDate : la date saisie", () => {
  it("accepte une date réelle au format AAAA-MM-JJ", () => {
    expect(parseFollowUpDate("2026-12-03")).toEqual({ ok: true, value: "2026-12-03" });
    expect(parseFollowUpDate(" 2028-02-29 ")).toEqual({ ok: true, value: "2028-02-29" });
  });

  it("une valeur vide efface la relance", () => {
    expect(parseFollowUpDate("")).toEqual({ ok: true, value: null });
    expect(parseFollowUpDate(null)).toEqual({ ok: true, value: null });
  });

  it("refuse une date qui n'existe pas ou un autre format", () => {
    for (const bad of ["2026-02-30", "2027-02-29", "2026-13-01", "03/12/2026", "demain", 20261203, undefined])
      expect(parseFollowUpDate(bad)).toEqual({ ok: false, error: "Date invalide." });
  });
});

describe("followUpState : où en est la relance d'un contact", () => {
  const today = "2026-11-21";

  it("relance aujourd'hui : « aujourd'hui »", () => {
    expect(followUpState(contact({ nextFollowUp: today }), today)).toBe("aujourdhui");
  });

  it("relance passée : « en retard »", () => {
    expect(followUpState(contact({ nextFollowUp: "2026-11-20" }), today)).toBe("enRetard");
  });

  it("relance à venir, ou aucune relance : rien à faire aujourd'hui", () => {
    expect(followUpState(contact({ nextFollowUp: "2026-11-22" }), today)).toBeNull();
    expect(followUpState(contact(), today)).toBeNull();
  });

  it("un contact accepté ou refusé n'est plus à relancer", () => {
    for (const response of ["accepte", "refuse"] as const)
      expect(followUpState(contact({ called: true, response, nextFollowUp: "2026-11-20" }), today)).toBeNull();
  });

  it("un contact appelé encore en attente reste à relancer", () => {
    expect(followUpState(contact({ called: true, nextFollowUp: today }), today)).toBe("aujourdhui");
  });
});

describe("dueFollowUps : la liste « À relancer aujourd'hui »", () => {
  it("garde les relances du jour et en retard, du plus en retard au plus récent puis par nom", () => {
    const today = "2026-11-21";
    const list = [
      contact({ name: "Zoé", nextFollowUp: today }),
      contact({ name: "Futur", nextFollowUp: "2026-12-01" }),
      contact({ name: "Ancien", nextFollowUp: "2026-11-02" }),
      contact({ name: "Accepté", called: true, response: "accepte", nextFollowUp: today }),
      contact({ name: "Amandine", nextFollowUp: today }),
      contact({ name: "Sans date" }),
    ];
    expect(dueFollowUps(list, today).map((d) => [d.contact.name, d.state])).toEqual([
      ["Ancien", "enRetard"],
      ["Amandine", "aujourdhui"],
      ["Zoé", "aujourdhui"],
    ]);
  });
});
