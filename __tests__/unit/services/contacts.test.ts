import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ContactRecord } from "@/data/contacts-repository";

// La couche données est remplacée par un faux : on teste seulement les règles du service.
vi.mock("@/data/contacts-repository", () => ({
  insertContactRecord: vi.fn(),
  selectContactRecords: vi.fn(),
}));

import { insertContactRecord, selectContactRecords } from "@/data/contacts-repository";
import { CONTACT_FIELDS, addContact, listContacts, validateContactInput } from "@/services/contacts";

const record = (over: Partial<ContactRecord> = {}): ContactRecord => ({
  id: "id-1",
  name: "Claire Martin",
  company: "Atelier Nord",
  phone: "06 12 34 56 78",
  email: "claire@ateliernord.fr",
  called: 0,
  response: "enAttente",
  created_at: "2026-11-19T10:00:00.000Z",
  ...over,
});

beforeEach(() => {
  vi.mocked(insertContactRecord).mockReset();
  vi.mocked(selectContactRecords).mockReset();
});

describe("validateContactInput", () => {
  it("exige un nom", () => {
    const r = validateContactInput({ name: "   " });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.name).toBe("Le nom est obligatoire.");
  });

  it("refuse un nom de plus de 120 caractères", () => {
    const r = validateContactInput({ name: "a".repeat(121) });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.name).toBeDefined();
  });

  it("nettoie les espaces et rend vides les champs facultatifs absents", () => {
    const r = validateContactInput({ name: "  Claire Martin ", company: "  ", phone: undefined, email: "" });
    expect(r).toEqual({ ok: true, value: { name: "Claire Martin", company: null, phone: null, email: null } });
  });

  it("vérifie le format de l'e-mail s'il est rempli", () => {
    const r = validateContactInput({ name: "Claire", email: "claire@" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.email).toBe("Adresse e-mail invalide.");
  });

  it("accepte un e-mail valide", () => {
    const r = validateContactInput({ name: "Claire", email: " claire@ateliernord.fr " });
    expect(r.ok && r.value.email).toBe("claire@ateliernord.fr");
  });

  it("signale toutes les erreurs d'un coup", () => {
    const r = validateContactInput({ name: "", email: "pas-un-mail" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["email", "name"]);
  });
});

describe("CONTACT_FIELDS : les champs du formulaire, définis une seule fois", () => {
  it("chaque erreur porte le nom d'un de ces champs", () => {
    const r = validateContactInput({
      name: "",
      company: "c".repeat(121),
      phone: "1".repeat(41),
      email: "pas-un-mail",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual([...CONTACT_FIELDS].sort());
  });
});

describe("addContact", () => {
  it("crée un contact « non appelé » et « en attente » par défaut", async () => {
    vi.mocked(insertContactRecord).mockResolvedValue(record());
    await addContact({ name: "Claire Martin", company: "Atelier Nord" });
    expect(insertContactRecord).toHaveBeenCalledWith({
      name: "Claire Martin",
      company: "Atelier Nord",
      phone: null,
      email: null,
      called: false,
      response: "enAttente",
    });
  });

  it("renvoie le contact créé au format du domaine", async () => {
    vi.mocked(insertContactRecord).mockResolvedValue(record());
    const r = await addContact({ name: "Claire Martin" });
    expect(r).toEqual({
      ok: true,
      contact: {
        id: "id-1",
        name: "Claire Martin",
        company: "Atelier Nord",
        phone: "06 12 34 56 78",
        email: "claire@ateliernord.fr",
        called: false,
        response: "enAttente",
        createdAt: "2026-11-19T10:00:00.000Z",
      },
    });
  });

  it("n'écrit rien si la saisie est invalide", async () => {
    const r = await addContact({ name: "" });
    expect(r.ok).toBe(false);
    expect(insertContactRecord).not.toHaveBeenCalled();
  });
});

describe("listContacts", () => {
  it("convertit les enregistrements en contacts (appelé 0/1 → booléen)", async () => {
    vi.mocked(selectContactRecords).mockResolvedValue([
      record({ id: "b", called: 1, response: "accepte" }),
      record({ id: "a" }),
    ]);
    const list = await listContacts();
    expect(list.map((c) => [c.id, c.called, c.response])).toEqual([
      ["b", true, "accepte"],
      ["a", false, "enAttente"],
    ]);
  });

  it("refuse une réponse inconnue venue de la base", async () => {
    vi.mocked(selectContactRecords).mockResolvedValue([record({ response: "peut-etre" })]);
    await expect(listContacts()).rejects.toThrow(/réponse inconnue/i);
  });
});
