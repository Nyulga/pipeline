import { describe, expect, it } from "vitest";
import { matchesSearch, normalizeForSearch } from "@/services/search";
import type { Contact } from "@/services/contact-model";

const contact = (over: Partial<Contact> = {}): Contact => ({
  id: "c1",
  name: "Hélène Dupré",
  company: "Café Éole",
  phone: "06 12 34 56 78",
  email: "helene@eole.fr",
  called: false,
  calledAt: null,
  response: "enAttente",
  nextFollowUp: null,
  createdAt: "2026-11-01T09:00:00.000Z",
  ...over,
});

describe("normalizeForSearch", () => {
  it("passe en minuscules et retire les accents", () => {
    expect(normalizeForSearch("  HÉLÈNE Çà Ïle ")).toBe("helene ca ile");
  });

  it("déplie les ligatures et resserre les espaces", () => {
    expect(normalizeForSearch("Cœur  de	Lyon · Æther")).toBe("coeur de lyon · aether");
  });
});

describe("matchesSearch : une partie du nom, de l'entreprise, du téléphone, de l'e-mail ou d'une note", () => {
  it.each([
    ["nom", "lene dup"],
    ["nom sans accents ni casse", "HELENE"],
    ["entreprise", "cafe"],
    ["téléphone tel qu'écrit", "34 56"],
    ["téléphone sans espaces", "0612345"],
    ["e-mail", "@EOLE"],
  ])("trouve par %s", (_, q) => {
    expect(matchesSearch(contact(), [], q)).toBe(true);
  });

  it("ramène les apostrophes typographiques à l'apostrophe droite (#11)", () => {
    expect(normalizeForSearch("d’Éole d‘ici dʼabord")).toBe("d'eole d'ici d'abord");
    expect(matchesSearch(contact({ company: "Café d’Éole" }), [], "cafe d'eole")).toBe(true);
    expect(matchesSearch(contact({ company: "Café d'Éole" }), [], "cafe d’eole")).toBe(true);
  });

  it("déplie les lettres barrées que NFD ne décompose pas : ł, ø, đ (#11)", () => {
    expect(normalizeForSearch("Łódź Øresund Đakovo")).toBe("lodz oresund dakovo");
    expect(matchesSearch(contact({ company: "Łódź" }), [], "lodz")).toBe(true);
  });

  it("« coeur de » trouve « Cœur  de Lyon »", () => {
    expect(matchesSearch(contact({ company: "Cœur  de Lyon" }), [], "coeur de")).toBe(true);
  });

  it("trouve par une note, sans casse ni accents", () => {
    expect(matchesSearch(contact(), ["Intéressée par l'offre Été"], "OFFRE ete")).toBe(true);
  });

  it("ne trouve pas ce qui n'y est pas", () => {
    expect(matchesSearch(contact(), ["rien"], "martin")).toBe(false);
    expect(matchesSearch(contact({ phone: null }), [], "06")).toBe(false);
  });

  it("une recherche vide garde tout le monde", () => {
    expect(matchesSearch(contact(), [], "   ")).toBe(true);
  });
});
