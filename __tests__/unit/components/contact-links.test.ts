import { describe, expect, it } from "vitest";
import { contactPanelHref, withoutContact } from "@/components/contacts/contact-links";

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
