// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContactCard } from "@/components/contacts/contact-card";
import type { Contact } from "@/services/contacts";
import { makeContact } from "./helpers/contact";

const contact = (over: Partial<Contact> = {}) =>
  makeContact({ name: "Claire Martin", company: "Atelier Nord", ...over });

function show(c: Contact, { error, compact }: { error?: string; compact?: boolean } = {}) {
  const onCalledChange = vi.fn();
  const onResponseChange = vi.fn();
  render(createElement(ContactCard, { contact: c, error, compact, onCalledChange, onResponseChange }));
  return { onCalledChange, onResponseChange };
}

const stageBadge = (label: string) => screen.queryByText(label, { selector: "[data-slot=badge]" });
const isDisabled = (el: HTMLElement) => el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true";

afterEach(cleanup);

describe("ContactCard : l'étape du contact", () => {
  it("affiche l'étape dans un seul badge", () => {
    show(contact({ called: true, response: "enAttente" }));
    expect(stageBadge("Appelé · en attente")).toBeTruthy();
    expect(document.querySelectorAll("[data-slot=badge]")).toHaveLength(1);
  });

  it("en vue compacte (colonne d'étape), n'affiche pas le badge : la colonne le dit déjà", () => {
    show(contact(), { compact: true });
    expect(document.querySelectorAll("[data-slot=badge]")).toHaveLength(0);
  });
});

describe("ContactCard : marquer et annuler l'appel", () => {
  it("propose « Marquer appelé » pour un contact pas encore appelé", () => {
    const { onCalledChange } = show(contact());
    expect(stageBadge("À appeler")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Marquer appelé" }));
    expect(onCalledChange).toHaveBeenCalledWith(true);
  });

  it("propose « Annuler l'appel » pour un contact appelé encore en attente", () => {
    const { onCalledChange } = show(contact({ called: true }));
    const cancel = screen.getByRole("button", { name: "Annuler l'appel" });
    expect(isDisabled(cancel)).toBe(false);
    fireEvent.click(cancel);
    expect(onCalledChange).toHaveBeenCalledWith(false);
  });

  it("désactive « Annuler l'appel » tant que le contact a une réponse, et explique pourquoi", () => {
    const { onCalledChange } = show(contact({ called: true, response: "accepte" }));
    const cancel = screen.getByRole("button", { name: "Annuler l'appel" });
    expect(isDisabled(cancel)).toBe(true);
    fireEvent.click(cancel);
    expect(onCalledChange).not.toHaveBeenCalled();
    const hint = document.getElementById(cancel.getAttribute("aria-describedby") ?? "");
    expect(hint?.textContent).toBe("Remets d'abord la réponse « En attente ».");
  });
});

describe("ContactCard : la fiche (lot 3)", () => {
  it("le nom mène à la fiche du contact", () => {
    show(contact({ id: "abc" }));
    expect(screen.getByRole("link", { name: "Claire Martin" }).getAttribute("href")).toBe("/contacts/abc");
  });

  it("montre la prochaine relance quand il y en a une", () => {
    show(contact({ nextFollowUp: "2026-12-03" }));
    expect(screen.getByText("Relance le 3 déc. 2026")).toBeTruthy();
  });
});

describe("ContactCard : la réponse", () => {
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
    show(contact(), { error: "Contact introuvable." });
    expect(screen.getByRole("alert").textContent).toBe("Contact introuvable.");
  });
});
