import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ContactRecord } from "@/data/contacts-repository";

// La couche données est remplacée par un faux : on teste seulement les règles du service.
vi.mock("@/data/contacts-repository", () => ({
  insertContactRecord: vi.fn(),
  selectContactRecords: vi.fn(),
  selectContactRecordById: vi.fn(),
  updateContactTracking: vi.fn(),
}));

import {
  insertContactRecord,
  selectContactRecordById,
  selectContactRecords,
  updateContactTracking,
} from "@/data/contacts-repository";
import {
  CONTACT_FIELDS,
  addContact,
  listContacts,
  setCalled,
  setResponse,
  validateContactInput,
} from "@/services/contacts";

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
  vi.mocked(selectContactRecordById).mockReset();
  vi.mocked(updateContactTracking).mockReset();
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

describe("setCalled", () => {
  it("marque appelé en gardant la réponse", async () => {
    vi.mocked(selectContactRecordById).mockResolvedValue(record({ called: 0, response: "enAttente" }));
    vi.mocked(updateContactTracking).mockResolvedValue(record({ called: 1 }));
    const r = await setCalled("id-1", true);
    expect(updateContactTracking).toHaveBeenCalledWith("id-1", { called: true, response: "enAttente" });
    expect(r.ok && r.contact.called).toBe(true);
  });

  it("repasser en « non appelé » remet la réponse à « en attente »", async () => {
    vi.mocked(selectContactRecordById).mockResolvedValue(record({ called: 1, response: "accepte" }));
    vi.mocked(updateContactTracking).mockResolvedValue(record());
    await setCalled("id-1", false);
    expect(updateContactTracking).toHaveBeenCalledWith("id-1", { called: false, response: "enAttente" });
  });

  it("signale un contact introuvable sans rien écrire", async () => {
    vi.mocked(selectContactRecordById).mockResolvedValue(null);
    expect(await setCalled("inconnu", true)).toEqual({ ok: false, error: "Contact introuvable." });
    expect(updateContactTracking).not.toHaveBeenCalled();
  });
});

describe("setResponse", () => {
  it("une réponse « accepté » marque aussi le contact comme appelé", async () => {
    vi.mocked(selectContactRecordById).mockResolvedValue(record({ called: 0, response: "enAttente" }));
    vi.mocked(updateContactTracking).mockResolvedValue(record({ called: 1, response: "accepte" }));
    const r = await setResponse("id-1", "accepte");
    expect(updateContactTracking).toHaveBeenCalledWith("id-1", { called: true, response: "accepte" });
    expect(r.ok && [r.contact.called, r.contact.response]).toEqual([true, "accepte"]);
  });

  it("refuse une réponse inconnue sans rien écrire", async () => {
    expect(await setResponse("id-1", "peut-etre")).toEqual({ ok: false, error: "Réponse inconnue." });
    expect(selectContactRecordById).not.toHaveBeenCalled();
    expect(updateContactTracking).not.toHaveBeenCalled();
  });

  it("signale un contact introuvable", async () => {
    vi.mocked(selectContactRecordById).mockResolvedValue(null);
    expect(await setResponse("inconnu", "refuse")).toEqual({ ok: false, error: "Contact introuvable." });
  });
});
