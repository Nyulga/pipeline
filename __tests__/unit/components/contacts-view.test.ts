// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Les Server Actions sont remplacées : on teste l'écran, pas le serveur.
vi.mock("@/app/actions", () => ({ setCalledAction: vi.fn(), setResponseAction: vi.fn() }));

import { setCalledAction, setResponseAction } from "@/app/actions";
import { ContactsView } from "@/components/contacts/contacts-view";
import type { Contact } from "@/services/contacts";

const contact = (id: string, name: string, over: Partial<Contact> = {}): Contact => ({
  id,
  name,
  company: null,
  phone: null,
  email: null,
  called: false,
  response: "enAttente",
  createdAt: "2026-11-19T10:00:00.000Z",
  ...over,
});

const contacts = [contact("a", "Ana"), contact("b", "Bruno", { called: true, response: "accepte" })];

/** Réponse du serveur « en vol », que le test résout quand il veut. */
function pending<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

const card = (name: string) => screen.getByRole("listitem", { name });
const badge = (name: string, text: string) => within(card(name)).queryByText(text, { selector: "[data-slot=badge]" });

beforeEach(() => {
  vi.mocked(setCalledAction).mockReset();
  vi.mocked(setResponseAction).mockReset();
});
afterEach(cleanup);

describe("ContactsView : suivre ses contacts depuis la liste", () => {
  it("cliquer sur « Marquer appelé » met la carte à jour tout de suite et appelle setCalledAction", async () => {
    const server = pending<{ ok: true }>();
    vi.mocked(setCalledAction).mockReturnValue(server.promise);
    render(createElement(ContactsView, { contacts }));

    await act(async () => {
      fireEvent.click(within(card("Ana")).getByRole("button", { name: "Marquer appelé" }));
    });

    expect(setCalledAction).toHaveBeenCalledWith("a", true);
    expect(badge("Ana", "Appelé")).toBeTruthy();
    await act(async () => server.resolve({ ok: true }));
  });

  it("choisir « Accepté » sur un contact non appelé l'affiche « Appelé » et « Accepté »", async () => {
    const server = pending<{ ok: true }>();
    vi.mocked(setResponseAction).mockReturnValue(server.promise);
    render(createElement(ContactsView, { contacts }));

    await act(async () => {
      fireEvent.click(within(card("Ana")).getByRole("button", { name: "Accepté" }));
    });

    expect(setResponseAction).toHaveBeenCalledWith("a", "accepte");
    expect(badge("Ana", "Appelé")).toBeTruthy();
    expect(badge("Ana", "Accepté")).toBeTruthy();
    await act(async () => server.resolve({ ok: true }));
  });

  it("repasser en « Non appelé » remet la réponse à « En attente » à l'écran", async () => {
    const server = pending<{ ok: true }>();
    vi.mocked(setCalledAction).mockReturnValue(server.promise);
    render(createElement(ContactsView, { contacts }));

    await act(async () => {
      fireEvent.click(within(card("Bruno")).getByRole("button", { name: "Non appelé" }));
    });

    expect(setCalledAction).toHaveBeenCalledWith("b", false);
    expect(badge("Bruno", "Non appelé")).toBeTruthy();
    expect(badge("Bruno", "En attente")).toBeTruthy();
    expect(badge("Bruno", "Accepté")).toBeNull();
    await act(async () => server.resolve({ ok: true }));
  });

  it("une erreur du serveur s'affiche sur la carte concernée", async () => {
    vi.mocked(setCalledAction).mockResolvedValue({ ok: false, error: "Contact introuvable." });
    render(createElement(ContactsView, { contacts }));

    await act(async () => {
      fireEvent.click(within(card("Ana")).getByRole("button", { name: "Marquer appelé" }));
    });

    expect(within(card("Ana")).getByRole("alert").textContent).toBe("Contact introuvable.");
    expect(within(card("Bruno")).queryByRole("alert")).toBeNull();
  });

  it("l'onglet « Par étape » affiche les colonnes avec chaque contact à sa place", async () => {
    render(createElement(ContactsView, { contacts }));

    await act(async () => {
      fireEvent.click(screen.getByRole("tab", { name: "Par étape" }));
    });

    const column = (label: string) => screen.getByRole("region", { name: new RegExp(`^${label}`) });
    expect(within(column("À appeler")).getByText("Ana")).toBeTruthy();
    expect(within(column("Accepté")).getByText("Bruno")).toBeTruthy();
    expect(within(column("Refusé")).getByText("Aucun contact")).toBeTruthy();
  });
});
