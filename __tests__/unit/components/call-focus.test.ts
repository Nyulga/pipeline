// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions", () => ({
  addContactAction: vi.fn(),
  setStageAction: vi.fn(),
  setFollowUpAction: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: vi.fn() }));

import { toast } from "sonner";
import { setFollowUpAction, setStageAction } from "@/app/actions";
import { CallFocus } from "@/components/contacts/call-focus";
import { makeContact } from "./helpers/contact";

const TODAY = "2026-11-23";
const late = makeContact({ id: "late", name: "Claire Martin", company: "Atelier Nord", phone: "06 12 34 56 78", called: true, nextFollowUp: "2026-11-20" });
const fresh = makeContact({ id: "fresh", name: "Thomas Bernard", phone: "07 98 76 54 32" });
const nophone = makeContact({ id: "nophone", name: "Inès Petit", createdAt: "2026-11-20T10:00:00.000Z" });
const done = makeContact({ id: "done", name: "Paul Durand", called: true, response: "accepte" });

const focus = () => screen.getByRole("region", { name: "À appeler maintenant" });
const current = () => within(focus()).getByRole("heading", { level: 2 }).textContent;
const press = (name: string) =>
  act(async () => {
    fireEvent.click(within(focus()).getByRole("button", { name }));
  });
// jsdom ne sait pas suivre un lien tel: : on empêche la navigation, l'action est testée sans elle.
const pressLink = (name: string) =>
  act(async () => {
    const link = within(focus()).getByRole("link", { name });
    link.addEventListener("click", (e) => e.preventDefault(), { once: true });
    fireEvent.click(link);
  });

beforeEach(() => {
  for (const f of [setStageAction, setFollowUpAction]) vi.mocked(f).mockReset().mockResolvedValue({ ok: true });
  vi.mocked(toast).mockReset();
});
afterEach(cleanup);

describe("CallFocus : la prochaine personne à appeler (lot 7)", () => {
  it("met en avant la première de la file, avec le nombre à rappeler et les suivantes", () => {
    render(createElement(CallFocus, { contacts: [fresh, done, nophone, late], today: TODAY }));
    expect(current()).toBe("Claire Martin");
    expect(within(focus()).getByText("Atelier Nord")).toBeTruthy();
    expect(screen.getByText("3 personnes à rappeler")).toBeTruthy();
    expect(within(focus()).getByText(/Ensuite\s*:\s*Thomas Bernard, Inès Petit/)).toBeTruthy();
    expect(screen.queryByText(/Paul Durand/)).toBeNull();
  });

  it("« Appeler » ouvre le numéro, marque le contact appelé, et la carte reste sur lui pour noter l'issue", async () => {
    render(createElement(CallFocus, { contacts: [fresh], today: TODAY }));
    const link = within(focus()).getByRole("link", { name: "Appeler" });
    expect(link.getAttribute("href")).toBe("tel:0798765432");
    await pressLink("Appeler");
    expect(setStageAction).toHaveBeenCalledWith("fresh", "appeleEnAttente");
    expect(current()).toBe("Thomas Bernard");
  });

  it("sans numéro, le bouton devient « Marquer appelé »", async () => {
    render(createElement(CallFocus, { contacts: [nophone], today: TODAY }));
    expect(within(focus()).queryByRole("link", { name: "Appeler" })).toBeNull();
    await press("Marquer appelé");
    expect(setStageAction).toHaveBeenCalledWith("nophone", "appeleEnAttente");
    expect(current()).toBe("Inès Petit");
  });

  it.each([
    ["Accepté", "accepte"],
    ["Refusé", "refuse"],
  ])("« %s » enregistre la réponse et passe à la personne suivante", async (label, response) => {
    render(createElement(CallFocus, { contacts: [late, fresh], today: TODAY }));
    await press(label);
    expect(setStageAction).toHaveBeenCalledWith("late", response);
    expect(current()).toBe("Thomas Bernard");
  });

  it("« Plus tard » repousse la relance au lendemain et passe à la suivante", async () => {
    render(createElement(CallFocus, { contacts: [late, fresh], today: TODAY }));
    await press("Plus tard");
    expect(setFollowUpAction).toHaveBeenCalledWith("late", "2026-11-24");
    expect(current()).toBe("Thomas Bernard");
    expect(screen.getByText("1 personne à rappeler")).toBeTruthy();
  });

  it("si l'enregistrement échoue, la personne revient et l'erreur est dite", async () => {
    vi.mocked(setFollowUpAction).mockResolvedValue({ ok: false, error: "Date invalide." });
    render(createElement(CallFocus, { contacts: [late, fresh], today: TODAY }));
    await press("Plus tard");
    expect(current()).toBe("Claire Martin");
    expect(within(focus()).getByRole("alert").textContent).toBe("Date invalide.");
  });

  it("après la dernière personne : un message, sans carte vide", async () => {
    render(createElement(CallFocus, { contacts: [fresh], today: TODAY }));
    await press("Refusé");
    expect(within(focus()).queryByRole("heading", { level: 2 })).toBeNull();
    expect(within(focus()).getByText("Personne à appeler pour l'instant.")).toBeTruthy();
    expect(screen.getByText("Personne à rappeler")).toBeTruthy();
  });

  it("file vide dès le départ : le message et de quoi ajouter un contact", () => {
    render(createElement(CallFocus, { contacts: [done], today: TODAY }));
    expect(within(focus()).getByText("Personne à appeler pour l'instant.")).toBeTruthy();
    expect(within(focus()).getByRole("button", { name: "Ajouter un contact" })).toBeTruthy();
  });
});

/** Réponse du serveur « en vol », que le test résout quand il veut. */
function pending<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

describe("CallFocus : quand le serveur renvoie la liste (revue de la PR #21)", () => {
  const a = makeContact({ id: "a", name: "Alice", createdAt: "2026-11-01T09:00:00.000Z" });
  const b = makeContact({ id: "b", name: "Bruno", createdAt: "2026-11-02T09:00:00.000Z" });
  const c = makeContact({ id: "c", name: "Chloé", createdAt: "2026-11-03T09:00:00.000Z" });

  it("une liste rafraîchie pour A ne fait pas revenir B, encore en cours d'enregistrement", async () => {
    const forB = pending<{ ok: true }>();
    vi.mocked(setFollowUpAction).mockResolvedValueOnce({ ok: true }).mockReturnValueOnce(forB.promise);
    const view = render(createElement(CallFocus, { contacts: [a, b, c], today: TODAY }));
    await press("Plus tard"); // Alice, enregistré
    await press("Plus tard"); // Bruno, en vol
    expect(current()).toBe("Chloé");
    // Le serveur renvoie la liste après l'enregistrement d'Alice seulement.
    view.rerender(createElement(CallFocus, { contacts: [{ ...a, nextFollowUp: "2026-11-24" }, b, c], today: TODAY }));
    expect(current()).toBe("Chloé");
    await act(async () => forB.resolve({ ok: true }));
  });

  it("la personne appelée reste affichée après le rafraîchissement, et le nombre compte la carte", async () => {
    const view = render(createElement(CallFocus, { contacts: [fresh], today: TODAY }));
    await pressLink("Appeler");
    expect(screen.getByText("1 personne à rappeler")).toBeTruthy();
    view.rerender(createElement(CallFocus, { contacts: [{ ...fresh, called: true }], today: TODAY }));
    expect(current()).toBe("Thomas Bernard");
    expect(screen.getByText("1 personne à rappeler")).toBeTruthy();
  });

  it("un échec n'annule que son propre changement : l'appel déjà enregistré reste", async () => {
    vi.mocked(setStageAction).mockResolvedValueOnce({ ok: true }).mockResolvedValueOnce({ ok: false, error: "Réponse invalide." });
    render(createElement(CallFocus, { contacts: [fresh], today: TODAY }));
    await pressLink("Appeler");
    await press("Accepté");
    expect(current()).toBe("Thomas Bernard");
    expect(within(focus()).getByText("Appelé · en attente")).toBeTruthy();
    expect(within(focus()).getByRole("alert").textContent).toBe("Réponse invalide.");
  });
});

const lastToast = () => {
  const [message, options] = vi.mocked(toast).mock.calls.at(-1)!;
  return { message, options: options as { id: string; action: { label: string; onClick: () => void }; duration: number } };
};

describe("CallFocus : « Annuler » après chaque geste (lot 8)", () => {
  it("après « Refusé » : « Claire Martin : Refusé · Annuler », qui remet l'étape d'avant et la ramène", async () => {
    render(createElement(CallFocus, { contacts: [late, fresh], today: TODAY }));
    await press("Refusé");
    expect(lastToast().message).toBe("Claire Martin : Refusé");
    expect(lastToast().options.action.label).toBe("Annuler");
    expect(lastToast().options.duration).toBe(6000);
    expect(current()).toBe("Thomas Bernard");
    await act(async () => lastToast().options.action.onClick());
    expect(setStageAction).toHaveBeenLastCalledWith("late", "appeleEnAttente");
    expect(current()).toBe("Claire Martin");
  });

  it("après « Appeler » : « Annuler » remet le contact à appeler", async () => {
    render(createElement(CallFocus, { contacts: [fresh], today: TODAY }));
    await pressLink("Appeler");
    expect(lastToast().message).toBe("Thomas Bernard : Appelé · en attente");
    await act(async () => lastToast().options.action.onClick());
    expect(setStageAction).toHaveBeenLastCalledWith("fresh", "aAppeler");
    expect(within(focus()).getByText("À appeler", { selector: "[data-slot=badge]" })).toBeTruthy();
  });

  it("après « Plus tard » : « Claire Martin : relance demain · Annuler », qui remet la relance d'avant", async () => {
    render(createElement(CallFocus, { contacts: [late, fresh], today: TODAY }));
    await press("Plus tard");
    expect(lastToast().message).toBe("Claire Martin : relance demain");
    await act(async () => lastToast().options.action.onClick());
    expect(setFollowUpAction).toHaveBeenLastCalledWith("late", "2026-11-20");
    expect(current()).toBe("Claire Martin");
  });

  it("un geste qui échoue n'affiche pas de message « Annuler »", async () => {
    vi.mocked(setFollowUpAction).mockResolvedValue({ ok: false, error: "Date invalide." });
    render(createElement(CallFocus, { contacts: [late], today: TODAY }));
    await press("Plus tard");
    expect(toast).not.toHaveBeenCalled();
  });
});

describe("CallFocus : « Annuler » après « Appeler » puis l'issue (revue de la PR #22)", () => {
  it.each([["Refusé"], ["Accepté"], ["Plus tard"]])(
    "Appeler, puis %s, puis Annuler : la personne revient sur la carte, appelée",
    async (label) => {
      render(createElement(CallFocus, { contacts: [fresh, nophone], today: TODAY }));
      await pressLink("Appeler");
      await press(label);
      expect(current()).toBe("Inès Petit");
      await act(async () => lastToast().options.action.onClick());
      expect(current()).toBe("Thomas Bernard");
      expect(within(focus()).getByText("Appelé · en attente", { selector: "[data-slot=badge]" })).toBeTruthy();
    },
  );

  it("un nouveau geste sur la même personne remplace son message « Annuler »", async () => {
    render(createElement(CallFocus, { contacts: [fresh], today: TODAY }));
    await pressLink("Appeler");
    const first = lastToast().options.id;
    await press("Accepté");
    expect(lastToast().options.id).toBe(first);
    expect(first).toBe("annuler-fresh");
  });

  it("pas d'« Annuler » pour un geste fait pendant qu'un autre s'enregistre encore sur la même personne", async () => {
    const forCall = pending<{ ok: true }>();
    vi.mocked(setStageAction).mockReturnValueOnce(forCall.promise).mockResolvedValueOnce({ ok: true });
    render(createElement(CallFocus, { contacts: [fresh], today: TODAY }));
    await pressLink("Appeler");
    await press("Accepté");
    await act(async () => forCall.resolve({ ok: true }));
    expect(vi.mocked(toast).mock.calls.map((c) => c[0])).toEqual(["Thomas Bernard : Appelé · en attente"]);
  });
});
