import { describe, expect, it, vi } from "vitest";
import { setupTestDatabase } from "../helpers/test-db";

// revalidatePath a besoin du runtime Next : on vérifie juste qu'il est appelé.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { revalidatePath } from "next/cache";
import { addContactAction } from "@/app/actions";
import { listContacts } from "@/services/contacts";

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
