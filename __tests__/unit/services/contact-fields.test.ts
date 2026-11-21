import { describe, expect, it } from "vitest";
import { CONTACT_FIELDS } from "@/services/contact-fields";

describe("contact-fields", () => {
  it("définit les 4 champs d'un contact, dans l'ordre du formulaire", () => {
    expect(CONTACT_FIELDS).toEqual(["name", "company", "phone", "email"]);
  });
});
