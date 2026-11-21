import { describe, expect, it } from "vitest";
import { CONTACT_FIELDS, RESPONSES, isContactResponse } from "@/services/contact-model";

describe("contact-model : la forme d'un contact, définie une seule fois", () => {
  it("définit les 4 champs d'un contact, dans l'ordre du formulaire", () => {
    expect(CONTACT_FIELDS).toEqual(["name", "company", "phone", "email"]);
  });

  it("liste les 3 réponses, dans l'ordre du sélecteur", () => {
    expect(RESPONSES).toEqual(["accepte", "refuse", "enAttente"]);
  });

  it("isContactResponse n'accepte que les 3 réponses connues", () => {
    expect(RESPONSES.every(isContactResponse)).toBe(true);
    expect(isContactResponse("peut-etre")).toBe(false);
    expect(isContactResponse(undefined)).toBe(false);
  });
});
