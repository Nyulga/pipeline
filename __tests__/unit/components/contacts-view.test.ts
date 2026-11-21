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
const stage = (name: string) =>
  [...card(name).querySelectorAll("[data-slot=badge]")].map((b) => b.textContent);
const click = (name: string, button: string) =>
  act(async () => {
    fireEvent.click(within(card(name)).getByRole("button", { name: button }));
  });

beforeEach(() => {
  vi.mocked(setCalledAction).mockReset();
  vi.mocked(setResponseAction).mockReset();
});
afterEach(cleanup);

describe("ContactsView : suivre ses contacts depuis la liste", () => {
  it("cliquer sur « Marquer appelé » change l'étape tout de suite et appelle setCalledAction", async () => {
    const server = pending<{ ok: true }>();
    vi.mocked(setCalledAction).mockReturnValue(server.promise);
    render(createElement(ContactsView, { contacts }));

    await click("Ana", "Marquer appelé");

    expect(setCalledAction).toHaveBeenCalledWith("a", true);
    expect(stage("Ana")).toEqual(["Appelé · en attente"]);
    await act(async () => server.resolve({ ok: true }));
  });

  it("choisir « Accepté » sur un contact non appelé le passe à l'étape « Accepté »", async () => {
    const server = pending<{ ok: true }>();
    vi.mocked(setResponseAction).mockReturnValue(server.promise);
    render(createElement(ContactsView, { contacts }));

    await click("Ana", "Accepté");

    expect(setResponseAction).toHaveBeenCalledWith("a", "accepte");
    expect(stage("Ana")).toEqual(["Accepté"]);
    await act(async () => server.resolve({ ok: true }));
  });

  it("une réponse n'est jamais effacée en un clic : il faut la remettre « En attente » avant d'annuler l'appel", async () => {
    const responseServer = pending<{ ok: true }>();
    const callServer = pending<{ ok: true }>();
    vi.mocked(setResponseAction).mockReturnValue(responseServer.promise);
    vi.mocked(setCalledAction).mockReturnValue(callServer.promise);
    render(createElement(ContactsView, { contacts }));

    await click("Bruno", "Annuler l'appel");
    expect(setCalledAction).not.toHaveBeenCalled();
    expect(stage("Bruno")).toEqual(["Accepté"]);

    await click("Bruno", "En attente");
    expect(stage("Bruno")).toEqual(["Appelé · en attente"]);

    await click("Bruno", "Annuler l'appel");
    expect(setCalledAction).toHaveBeenCalledWith("b", false);
    expect(stage("Bruno")).toEqual(["À appeler"]);

    await act(async () => {
      responseServer.resolve({ ok: true });
      callServer.resolve({ ok: true });
    });
  });

  it("un refus du serveur s'affiche sur la carte concernée", async () => {
    vi.mocked(setCalledAction).mockResolvedValue({ ok: false, error: "Contact introuvable." });
    render(createElement(ContactsView, { contacts }));

    await click("Ana", "Marquer appelé");

    expect(within(card("Ana")).getByRole("alert").textContent).toBe("Contact introuvable.");
    expect(within(card("Bruno")).queryByRole("alert")).toBeNull();
  });

  it("si l'enregistrement échoue (base injoignable), la page reste là : message sur la carte, étape inchangée", async () => {
    vi.mocked(setCalledAction).mockRejectedValue(new Error("fetch failed"));
    render(createElement(ContactsView, { contacts }));

    await click("Ana", "Marquer appelé");

    expect(within(card("Ana")).getByRole("alert").textContent).toBe("Impossible d'enregistrer, réessaie.");
    expect(stage("Ana")).toEqual(["À appeler"]);
    expect(card("Bruno")).toBeTruthy();
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
