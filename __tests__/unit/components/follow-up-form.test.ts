// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// L'action serveur est remplacée : on teste le formulaire, pas le serveur.
vi.mock("@/app/actions", () => ({ setFollowUpAction: vi.fn() }));

import { setFollowUpAction } from "@/app/actions";
import { FollowUpForm } from "@/components/contacts/follow-up-form";

function show(nextFollowUp: string | null) {
  render(createElement(FollowUpForm, { contactId: "abc", nextFollowUp }));
}

const dateField = () => screen.getByLabelText("Date de relance") as HTMLInputElement;

async function click(name: string) {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name }));
  });
}

beforeEach(() => {
  vi.mocked(setFollowUpAction).mockReset();
});
afterEach(cleanup);

describe("FollowUpForm : la prochaine relance sur la fiche (lot 3)", () => {
  it("affiche la relance prévue, pré-remplie dans le champ", () => {
    show("2026-12-03");
    expect(screen.getByText("Prochaine relance : 3 déc. 2026")).toBeTruthy();
    expect(dateField().value).toBe("2026-12-03");
  });

  it("sans relance, le dit et ne propose pas d'effacer", () => {
    show(null);
    expect(screen.getByText("Aucune relance prévue")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Effacer" })).toBeNull();
  });

  it("« Enregistrer » envoie la date saisie", async () => {
    vi.mocked(setFollowUpAction).mockResolvedValue({ ok: true });
    show(null);
    fireEvent.change(dateField(), { target: { value: "2026-12-10" } });
    await click("Enregistrer");
    expect(setFollowUpAction).toHaveBeenCalledWith("abc", "2026-12-10");
  });

  it("« Effacer » envoie une date vide", async () => {
    vi.mocked(setFollowUpAction).mockResolvedValue({ ok: true });
    show("2026-12-03");
    await click("Effacer");
    expect(setFollowUpAction).toHaveBeenCalledWith("abc", "");
  });

  it("« Enregistrer » avec un champ vide (date incomplète) n'efface pas la relance : seul « Effacer » le fait", async () => {
    show("2026-12-03");
    fireEvent.change(dateField(), { target: { value: "" } });
    await click("Enregistrer");
    expect(setFollowUpAction).not.toHaveBeenCalled();
    expect(document.getElementById(dateField().getAttribute("aria-describedby") ?? "")?.textContent).toBe(
      "Choisis une date complète.",
    );
  });

  it("une date refusée s'affiche sur le champ", async () => {
    vi.mocked(setFollowUpAction).mockResolvedValue({ ok: false, error: "Date invalide." });
    show(null);
    fireEvent.change(dateField(), { target: { value: "2026-12-10" } });
    await click("Enregistrer");
    const field = dateField();
    expect(field.getAttribute("aria-invalid")).toBe("true");
    expect(document.getElementById(field.getAttribute("aria-describedby") ?? "")?.textContent).toBe("Date invalide.");
  });

  it("si l'enregistrement échoue (base injoignable), un message le dit et la saisie est gardée", async () => {
    vi.mocked(setFollowUpAction).mockRejectedValue(new Error("fetch failed"));
    show(null);
    fireEvent.change(dateField(), { target: { value: "2026-12-10" } });
    await click("Enregistrer");
    expect(screen.getByRole("alert").textContent).toBe("Impossible d'enregistrer, réessaie.");
    expect(dateField().value).toBe("2026-12-10");
  });
});
