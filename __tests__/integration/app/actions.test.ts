import { describe, expect, it, vi } from "vitest";
import { setupTestDatabase } from "../helpers/test-db";

// revalidatePath a besoin du runtime Next : on vérifie juste qu'il est appelé.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { revalidatePath } from "next/cache";
import { addContactAction, setCalledAction, setResponseAction } from "@/app/actions";
import { CONTACT_FIELDS, listContacts } from "@/services/contacts";

setupTestDatabase();

const form = (fields: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
};

describe("addContactAction (formulaire → service → base)", () => {
  it("ajoute le contact et rafraîchit la liste", async () => {
    const r = await addContactAction(form({ name: "Camille Roux", company: "Librairie Les Pages", phone: "", email: "" }));
    expect(r).toEqual({ ok: true, errors: {} });
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect((await listContacts()).map((c) => c.name)).toContain("Camille Roux");
  });

  it("lit chacun des champs du formulaire (CONTACT_FIELDS)", async () => {
    const values = { name: "Inès Faure", company: "Studio Ligne", phone: "07 11 22 33 44", email: "ines@studioligne.fr" };
    const fd = new FormData();
    for (const f of CONTACT_FIELDS) fd.set(f, values[f]);
    expect((await addContactAction(fd)).ok).toBe(true);
    expect((await listContacts()).find((c) => c.name === values.name)).toMatchObject(values);
  });

  it("renvoie les erreurs par champ sans rien écrire", async () => {
    vi.mocked(revalidatePath).mockClear();
    const before = (await listContacts()).length;
    const r = await addContactAction(form({ name: "", email: "x" }));
    expect(r.ok).toBe(false);
    expect(r.errors).toEqual({ name: "Le nom est obligatoire.", email: "Adresse e-mail invalide." });
    expect(revalidatePath).not.toHaveBeenCalled();
    expect((await listContacts()).length).toBe(before);
  });
});

describe("actions de suivi (lot 2)", () => {
  async function created(name: string) {
    await addContactAction(form({ name }));
    return (await listContacts()).find((c) => c.name === name)!;
  }

  it("setCalledAction marque appelé et rafraîchit la liste", async () => {
    const c = await created("Action appel");
    vi.mocked(revalidatePath).mockClear();
    expect(await setCalledAction(c.id, true)).toEqual({ ok: true });
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect((await listContacts()).find((x) => x.id === c.id)?.called).toBe(true);
  });

  it("setResponseAction enregistre la réponse", async () => {
    const c = await created("Action réponse");
    expect(await setResponseAction(c.id, "accepte")).toEqual({ ok: true });
    expect((await listContacts()).find((x) => x.id === c.id)).toMatchObject({ called: true, response: "accepte" });
  });

  it("refuse les entrées invalides sans rien écrire ni rafraîchir", async () => {
    vi.mocked(revalidatePath).mockClear();
    expect(await setCalledAction(42, true)).toEqual({ ok: false, error: "Requête invalide." });
    expect(await setCalledAction("x", "oui")).toEqual({ ok: false, error: "Requête invalide." });
    expect(await setResponseAction("inconnu", "accepte")).toEqual({ ok: false, error: "Contact introuvable." });
    const c = await created("Action invalide");
    vi.mocked(revalidatePath).mockClear();
    expect(await setResponseAction(c.id, "peut-etre")).toEqual({ ok: false, error: "Réponse inconnue." });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
