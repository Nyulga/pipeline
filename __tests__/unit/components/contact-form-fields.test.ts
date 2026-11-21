// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { ContactFormFields } from "@/components/contacts/contact-form-fields";
import { CONTACT_FIELDS } from "@/services/contacts";

// Présentation : on vérifie le formulaire d'ajout comme l'utilisateur le voit
// (champs trouvés par leur libellé, message d'erreur rattaché au champ).

const EMPTY = { name: "", company: "", phone: "", email: "" };
type Errors = Partial<Record<(typeof CONTACT_FIELDS)[number], string>>;

const show = (errors: Errors = {}) =>
  render(createElement(ContactFormFields, { values: EMPTY, errors, onChange: () => {} }));

afterEach(cleanup);

describe("ContactFormFields", () => {
  it("affiche un champ par entrée de CONTACT_FIELDS, dans le même ordre", () => {
    const { container } = show();
    const names = [...container.querySelectorAll("input")].map((i) => i.name);
    expect(names).toEqual([...CONTACT_FIELDS]);
  });

  it("chaque champ se trouve par son libellé", () => {
    show();
    expect(screen.getByLabelText(/^Nom/)).toHaveProperty("name", "name");
    expect(screen.getByLabelText("Entreprise")).toHaveProperty("name", "company");
    expect(screen.getByLabelText("Téléphone")).toHaveProperty("name", "phone");
    expect(screen.getByLabelText("E-mail")).toHaveProperty("name", "email");
  });

  it("rattache chaque message d'erreur au champ concerné, et seulement à lui", () => {
    show({ name: "Le nom est obligatoire.", email: "Adresse e-mail invalide." });

    const name = screen.getByLabelText(/^Nom/);
    const email = screen.getByLabelText("E-mail");
    expect(name.getAttribute("aria-invalid")).toBe("true");
    expect(email.getAttribute("aria-invalid")).toBe("true");
    expect(document.getElementById(name.getAttribute("aria-describedby")!)?.textContent).toBe(
      "Le nom est obligatoire.",
    );
    expect(document.getElementById(email.getAttribute("aria-describedby")!)?.textContent).toBe(
      "Adresse e-mail invalide.",
    );

    for (const label of ["Entreprise", "Téléphone"]) {
      const input = screen.getByLabelText(label);
      expect(input.hasAttribute("aria-invalid")).toBe(false);
      expect(input.hasAttribute("aria-describedby")).toBe(false);
    }
  });

  it("n'affiche aucun message quand il n'y a pas d'erreur", () => {
    show();
    expect(screen.queryByText(/obligatoire|invalide/)).toBeNull();
  });
});
