// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContactCard } from "@/components/contacts/contact-card";
import type { Contact } from "@/services/contacts";

const contact = (over: Partial<Contact> = {}): Contact => ({
  id: "c1",
  name: "Claire Martin",
  company: "Atelier Nord",
  phone: null,
  email: null,
  called: false,
  response: "enAttente",
  createdAt: "2026-11-19T10:00:00.000Z",
  ...over,
});

function show(c: Contact, error?: string) {
  const onCalledChange = vi.fn();
  const onResponseChange = vi.fn();
  render(createElement(ContactCard, { contact: c, error, onCalledChange, onResponseChange }));
  return { onCalledChange, onResponseChange };
}

afterEach(cleanup);

describe("ContactCard : suivi d'un contact", () => {
  it("affiche « Non appelé » et propose « Marquer appelé » pour un contact pas encore appelé", () => {
    const { onCalledChange } = show(contact());
    expect(screen.getByText("Non appelé", { selector: "[data-slot=badge]" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Marquer appelé" }));
    expect(onCalledChange).toHaveBeenCalledWith(true);
  });

  it("affiche « Appelé » et propose de le repasser en « Non appelé »", () => {
    const { onCalledChange } = show(contact({ called: true }));
    expect(screen.getByText("Appelé", { selector: "[data-slot=badge]" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Non appelé" }));
    expect(onCalledChange).toHaveBeenCalledWith(false);
  });

  it("le sélecteur de réponse montre la réponse active", () => {
    show(contact({ called: true, response: "refuse" }));
    const group = screen.getByRole("group", { name: "Réponse de Claire Martin" });
    const pressed = [...group.querySelectorAll("button")].filter((b) => b.getAttribute("aria-pressed") === "true");
    expect(pressed.map((b) => b.textContent)).toEqual(["Refusé"]);
  });

  it("choisir une réponse appelle onResponseChange avec cette réponse", () => {
    const { onResponseChange } = show(contact());
    fireEvent.click(screen.getByRole("button", { name: "Accepté" }));
    expect(onResponseChange).toHaveBeenCalledWith("accepte");
  });

  it("affiche l'erreur reçue sur la carte", () => {
    show(contact(), "Contact introuvable.");
    expect(screen.getByRole("alert").textContent).toBe("Contact introuvable.");
  });
});
