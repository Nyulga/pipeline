// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Les Server Actions et les notifications sont remplacées : on teste l'écran, pas le serveur.
vi.mock("@/app/actions", () => ({ setStageAction: vi.fn() }));
vi.mock("sonner", () => ({ toast: vi.fn() }));

import { toast } from "sonner";
import { setStageAction } from "@/app/actions";
import { ContactsView } from "@/components/contacts/contacts-view";
import { makeContact } from "./helpers/contact";

const contacts = [
  makeContact({ id: "a", name: "Ana" }),
  makeContact({ id: "b", name: "Bruno", called: true, response: "accepte" }),
];

/** Réponse du serveur « en vol », que le test résout quand il veut. */
function pending<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

const card = (name: string) => screen.getByRole("listitem", { name });
const stage = (name: string) =>
  within(card(name)).getByRole("button", { name: new RegExp(`^Étape de ${name}`) }).getAttribute("aria-label")!.split(" : ")[1];
const choose = async (name: string, label: string) => {
  await act(async () => {
    fireEvent.click(within(card(name)).getByRole("button", { name: new RegExp(`^Étape de ${name}`) }));
  });
  await act(async () => {
    fireEvent.click(screen.getByRole("menuitemradio", { name: label }));
  });
};
/** Le dernier message « Annuler » affiché, et son bouton. */
const lastToast = () => {
  const [message, options] = vi.mocked(toast).mock.calls.at(-1)!;
  return { message, options: options as { id: string; action: { label: string; onClick: () => void }; duration: number } };
};

beforeEach(() => {
  vi.mocked(setStageAction).mockReset();
  vi.mocked(toast).mockReset();
});
afterEach(cleanup);

describe("ContactsView : le suivi en un geste (lot 8)", () => {
  it("choisir une étape la montre tout de suite et appelle setStageAction", async () => {
    const server = pending<{ ok: true }>();
    vi.mocked(setStageAction).mockReturnValue(server.promise);
    render(createElement(ContactsView, { contacts }));

    await choose("Ana", "Accepté");

    expect(setStageAction).toHaveBeenCalledWith("a", "accepte");
    expect(stage("Ana")).toBe("Accepté");
    await act(async () => server.resolve({ ok: true }));
  });

  it("repasser un contact accepté en « À appeler » se fait en un geste", async () => {
    const server = pending<{ ok: true }>();
    vi.mocked(setStageAction).mockReturnValue(server.promise);
    render(createElement(ContactsView, { contacts }));
    await choose("Bruno", "À appeler");
    expect(setStageAction).toHaveBeenCalledWith("b", "aAppeler");
    expect(stage("Bruno")).toBe("À appeler");
    await act(async () => server.resolve({ ok: true }));
  });

  it("après le changement : « Bruno : Refusé · Annuler » pendant 6 secondes", async () => {
    vi.mocked(setStageAction).mockResolvedValue({ ok: true });
    render(createElement(ContactsView, { contacts }));
    await choose("Bruno", "Refusé");
    const { message, options } = lastToast();
    expect(message).toBe("Bruno : Refusé");
    expect(options.action.label).toBe("Annuler");
    expect(options.duration).toBe(6000);
  });

  it("« Annuler » remet exactement l'étape d'avant, sans nouveau message", async () => {
    const undoServer = pending<{ ok: true }>();
    vi.mocked(setStageAction).mockResolvedValueOnce({ ok: true }).mockReturnValueOnce(undoServer.promise);
    // Le serveur a enregistré « À appeler » : la liste reçue le dit.
    const view = render(createElement(ContactsView, { contacts }));
    await choose("Bruno", "À appeler");
    view.rerender(createElement(ContactsView, { contacts: [contacts[0], { ...contacts[1], called: false, response: "enAttente" }] }));
    expect(stage("Bruno")).toBe("À appeler");
    await act(async () => lastToast().options.action.onClick());
    expect(setStageAction).toHaveBeenLastCalledWith("b", "accepte");
    expect(stage("Bruno")).toBe("Accepté");
    expect(toast).toHaveBeenCalledTimes(1);
    await act(async () => undoServer.resolve({ ok: true }));
  });

  it("un nouveau changement sur le même contact remplace son message « Annuler »", async () => {
    vi.mocked(setStageAction).mockResolvedValue({ ok: true });
    render(createElement(ContactsView, { contacts }));
    await choose("Ana", "Accepté");
    await choose("Ana", "Refusé");
    const ids = vi.mocked(toast).mock.calls.map((c) => (c[1] as { id: string }).id);
    expect(ids).toEqual(["annuler-a", "annuler-a"]);
  });

  it("pas d'« Annuler » pour un changement fait pendant qu'un autre s'enregistre encore sur le même contact", async () => {
    const first = pending<{ ok: false; error: string }>();
    vi.mocked(setStageAction).mockReturnValueOnce(first.promise).mockResolvedValueOnce({ ok: true });
    render(createElement(ContactsView, { contacts }));
    await choose("Ana", "Accepté");
    await choose("Ana", "Refusé");
    await act(async () => first.resolve({ ok: false, error: "Contact introuvable." }));
    expect(toast).not.toHaveBeenCalled();
  });

  it("choisir l'étape déjà en place ne fait rien", async () => {
    render(createElement(ContactsView, { contacts }));
    await choose("Bruno", "Accepté");
    expect(setStageAction).not.toHaveBeenCalled();
    expect(toast).not.toHaveBeenCalled();
  });

  it("un refus du serveur s'affiche sur la carte concernée, sans message « Annuler »", async () => {
    vi.mocked(setStageAction).mockResolvedValue({ ok: false, error: "Contact introuvable." });
    render(createElement(ContactsView, { contacts }));

    await choose("Ana", "Refusé");

    expect(within(card("Ana")).getByRole("alert").textContent).toBe("Contact introuvable.");
    expect(within(card("Bruno")).queryByRole("alert")).toBeNull();
    expect(toast).not.toHaveBeenCalled();
  });

  it("si l'enregistrement échoue (base injoignable), la page reste là : message sur la carte, étape inchangée", async () => {
    vi.mocked(setStageAction).mockRejectedValue(new Error("fetch failed"));
    render(createElement(ContactsView, { contacts }));

    await choose("Ana", "Appelé · en attente");

    expect(within(card("Ana")).getByRole("alert").textContent).toBe("Impossible d'enregistrer, réessaie.");
    expect(stage("Ana")).toBe("À appeler");
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
