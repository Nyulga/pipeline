import { describe, expect, it } from "vitest";
import { SAVE_FAILED_MESSAGE, contactCount } from "@/components/contacts/texts";

describe("textes partagés de l'écran des contacts", () => {
  it("un seul message d'échec d'enregistrement", () => {
    expect(SAVE_FAILED_MESSAGE).toBe("Impossible d'enregistrer, réessaie.");
  });

  it("accorde « contact » au nombre", () => {
    expect([0, 1, 2, 12].map(contactCount)).toEqual(["0 contact", "1 contact", "2 contacts", "12 contacts"]);
  });
});
