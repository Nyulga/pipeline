import { describe, expect, it } from "vitest";
import { contactPanelHref, homeHref, mailtoHref, parseView, telHref, withoutContact } from "@/components/contacts/contact-links";

describe("adresses du panneau de fiche (lot 9)", () => {
  it("ouvrir : ?contact=<id>, en gardant la recherche et le filtre", () => {
    expect(contactPanelHref({}, "abc")).toBe("/?contact=abc");
    expect(contactPanelHref({ q: "nord est", etape: "accepte" }, "abc")).toBe("/?q=nord+est&etape=accepte&contact=abc");
  });

  it("ouvrir un autre contact remplace le premier", () => {
    expect(contactPanelHref({ q: "x", contact: "old" }, "new")).toBe("/?q=x&contact=new");
  });

  it("fermer : la même adresse sans contact, ou l'accueil", () => {
    expect(withoutContact({ q: "nord", etape: "refuse", contact: "abc" })).toBe("/?q=nord&etape=refuse");
    expect(withoutContact({ contact: "abc" })).toBe("/");
  });

  it("ignore les valeurs vides", () => {
    expect(contactPanelHref({ q: "", etape: undefined }, "abc")).toBe("/?contact=abc");
  });

  it("encode l'identifiant", () => {
    expect(contactPanelHref({}, "a&b")).toBe("/?contact=a%26b");
  });
});

describe("liens tel: et mailto: depuis les champs saisis (revue de la PR #23)", () => {
  it("tel: ne garde que les chiffres et le +", () => {
    expect(telHref("06 12 34 56 78")).toBe("tel:0612345678");
    expect(telHref("+33 (0)6.12")).toBe("tel:+330612");
  });

  it("mailto: encode l'adresse : un « ? » ou un « & » n'ajoute ni destinataire ni corps", () => {
    expect(mailtoHref("claire@ateliernord.fr")).toBe("mailto:claire@ateliernord.fr");
    expect(mailtoHref("a@b.fr?bcc=x@y.z&body=hi")).toBe("mailto:a@b.fr%3Fbcc%3Dx%40y.z%26body%3Dhi");
  });
});

describe("la vue Liste / Par étape vit dans l'adresse (lot 11)", () => {
  it("parseView : « etapes » ou la liste par défaut", () => {
    expect(parseView("etapes")).toBe("etapes");
    expect(parseView("liste")).toBe("liste");
    expect(parseView(undefined)).toBe("liste");
    expect(parseView("autre")).toBe("liste");
  });

  it("homeHref garde la vue « Par étape » ; la liste est la vue par défaut, sans paramètre", () => {
    expect(homeHref({ q: "nord", etape: "accepte", vue: "etapes" })).toBe("/?q=nord&etape=accepte&vue=etapes");
    expect(homeHref({ q: "nord", vue: "liste" })).toBe("/?q=nord");
    expect(homeHref({})).toBe("/");
  });

  it("ouvrir et fermer le panneau gardent la vue", () => {
    expect(contactPanelHref({ vue: "etapes" }, "abc")).toBe("/?vue=etapes&contact=abc");
    expect(withoutContact({ vue: "etapes", contact: "abc" })).toBe("/?vue=etapes");
  });
});
