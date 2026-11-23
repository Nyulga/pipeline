// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Les Server Actions et les notifications sont remplacées : on teste l'écran, pas le serveur.
vi.mock("@/app/actions", () => ({ setStageAction: vi.fn() }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { dismiss: vi.fn() }) }));
// Changer de vue passe par le routeur (revue de la PR #25).
const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

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

  it("un nouveau changement retire tout de suite le message « Annuler » en place", async () => {
    const second = pending<{ ok: true }>();
    vi.mocked(setStageAction).mockResolvedValueOnce({ ok: true }).mockReturnValueOnce(second.promise);
    vi.mocked(toast.dismiss).mockClear();
    render(createElement(ContactsView, { contacts }));
    await choose("Ana", "Accepté");
    await choose("Ana", "Refusé");
    expect(toast.dismiss).toHaveBeenCalledWith("annuler-a");
    await act(async () => second.resolve({ ok: true }));
  });

  it("le premier changement, enregistré après un second, n'affiche pas son « Annuler » périmé", async () => {
    const first = pending<{ ok: true }>();
    vi.mocked(setStageAction).mockReturnValueOnce(first.promise).mockResolvedValueOnce({ ok: true });
    render(createElement(ContactsView, { contacts }));
    await choose("Ana", "Accepté");
    await choose("Ana", "Refusé");
    await act(async () => first.resolve({ ok: true }));
    expect(toast).not.toHaveBeenCalled();
    expect(toast.dismiss).toHaveBeenCalledWith("annuler-a");
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

  it("le nom de chaque contact ouvre son panneau, en gardant la recherche et le filtre (lot 9)", () => {
    render(createElement(ContactsView, { contacts, query: "nord", stage: "accepte" }));
    expect(within(card("Ana")).getByRole("link", { name: "Ana" }).getAttribute("href")).toBe(
      "/?q=nord&etape=accepte&contact=a",
    );
  });

  it("l'onglet « Par étape » affiche les colonnes avec chaque contact à sa place", async () => {
    // Depuis le lot 11, l'onglet change l'adresse (`?vue=etapes`) et la page se rend à nouveau avec cette vue.
    render(createElement(ContactsView, { contacts, view: "etapes" }));

    const column = (label: string) => screen.getByRole("region", { name: new RegExp(`^${label}`) });
    expect(within(column("À appeler")).getByText("Ana")).toBeTruthy();
    expect(within(column("Accepté")).getByText("Bruno")).toBeTruthy();
    expect(within(column("Refusé")).getByText("Aucun contact")).toBeTruthy();
  });
});

describe("ContactsView : la vue vit dans l'adresse (lot 11)", () => {
  afterEach(() => window.history.replaceState(null, "", "/"));

  it("view « etapes » ouvre directement la vue « Par étape »", () => {
    render(createElement(ContactsView, { contacts, view: "etapes" }));
    expect(screen.getByRole("tab", { name: "Par étape" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("region", { name: /^Accepté/ })).toBeTruthy();
  });

  it("changer de vue l'écrit dans l'adresse par le routeur (la page se rend à nouveau), en gardant le reste", async () => {
    replace.mockReset();
    window.history.replaceState(null, "", "/?q=nord&etape=accepte");
    const { rerender } = render(createElement(ContactsView, { contacts }));
    await act(async () => {
      fireEvent.click(screen.getByRole("tab", { name: "Par étape" }));
    });
    expect(replace).toHaveBeenLastCalledWith("/?q=nord&etape=accepte&vue=etapes", { scroll: false });

    rerender(createElement(ContactsView, { contacts, view: "etapes" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("tab", { name: "Liste" }));
    });
    expect(replace).toHaveBeenLastCalledWith("/?q=nord&etape=accepte", { scroll: false });
  });

  it("changer de vue garde l'ancre de l'adresse (2e revue de la PR #25)", async () => {
    replace.mockReset();
    window.history.replaceState(null, "", "/?q=nord#mes-contacts");
    render(createElement(ContactsView, { contacts }));
    await act(async () => {
      fireEvent.click(screen.getByRole("tab", { name: "Par étape" }));
    });
    expect(replace).toHaveBeenLastCalledWith("/?q=nord&vue=etapes#mes-contacts", { scroll: false });
  });

  it("après un changement de vue, une navigation qui ramène la liste l'affiche (revue de la PR #25)", async () => {
    const { rerender } = render(createElement(ContactsView, { contacts }));
    await act(async () => {
      fireEvent.click(screen.getByRole("tab", { name: "Par étape" }));
    });
    rerender(createElement(ContactsView, { contacts, view: "etapes" }));
    rerender(createElement(ContactsView, { contacts, view: "liste" }));
    expect(screen.getByRole("tab", { name: "Liste" }).getAttribute("aria-selected")).toBe("true");
  });

  it("le lien qui ouvre la fiche garde la vue en cours", () => {
    render(createElement(ContactsView, { contacts, view: "etapes" }));
    expect(screen.getByRole("link", { name: "Ana" }).getAttribute("href")).toBe("/?vue=etapes&contact=a");
  });

  it("une nouvelle vue reçue du serveur (onglet « Étapes » du téléphone) est suivie", () => {
    const { rerender } = render(createElement(ContactsView, { contacts }));
    rerender(createElement(ContactsView, { contacts, view: "etapes" }));
    expect(screen.getByRole("tab", { name: "Par étape" }).getAttribute("aria-selected")).toBe("true");
  });
});
