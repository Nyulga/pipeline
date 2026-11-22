// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContactCard } from "@/components/contacts/contact-card";
import type { Contact } from "@/services/contacts";
import { makeContact } from "./helpers/contact";

const contact = (over: Partial<Contact> = {}) =>
  makeContact({ name: "Claire Martin", company: "Atelier Nord", ...over });

function show(c: Contact, { error, compact }: { error?: string; compact?: boolean } = {}) {
  const onStageChange = vi.fn();
  render(createElement(ContactCard, { contact: c, error, compact, onStageChange }));
  return { onStageChange };
}

/** Ouvre le menu d'étape de la carte. */
const openStageMenu = () =>
  act(async () => {
    fireEvent.click(screen.getByRole("button", { name: /^Étape de Claire Martin/ }));
  });

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

describe("ContactCard : un seul bouton d'étape (lot 8)", () => {
  it("le bouton montre l'étape actuelle et ouvre les 4 étapes, l'actuelle cochée", async () => {
    show(contact({ called: true, response: "refuse" }));
    expect(screen.getByRole("button", { name: "Étape de Claire Martin : Refusé" })).toBeTruthy();
    await openStageMenu();
    const items = screen.getAllByRole("menuitemradio");
    expect(items.map((i) => i.textContent)).toEqual(["À appeler", "Appelé · en attente", "Accepté", "Refusé"]);
    expect(items.filter((i) => i.getAttribute("aria-checked") === "true").map((i) => i.textContent)).toEqual(["Refusé"]);
  });

  it("choisir une étape appelle onStageChange avec cette étape", async () => {
    const { onStageChange } = show(contact());
    await openStageMenu();
    await act(async () => {
      fireEvent.click(screen.getByRole("menuitemradio", { name: "Accepté" }));
    });
    expect(onStageChange).toHaveBeenCalledWith("accepte");
  });

  it("plus de « Marquer appelé », d'« Annuler l'appel » ni de sélecteur de réponse, et aucun bouton grisé", () => {
    show(contact({ called: true, response: "accepte" }));
    expect(screen.queryByRole("button", { name: "Marquer appelé" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Annuler l'appel" })).toBeNull();
    expect(screen.queryByRole("group", { name: /^Réponse de/ })).toBeNull();
    expect(screen.queryByText(/Remets d'abord/)).toBeNull();
    for (const b of screen.getAllByRole("button")) expect(isDisabled(b)).toBe(false);
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

describe("ContactCard : les erreurs", () => {
  it("affiche l'erreur reçue sur la carte", () => {
    show(contact(), { error: "Contact introuvable." });
    expect(screen.getByRole("alert").textContent).toBe("Contact introuvable.");
  });
});
