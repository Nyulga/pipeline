import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ContactRecord } from "@/data/contacts-repository";

// La couche données est remplacée par un faux : on teste seulement les règles du service.
vi.mock("@/data/contacts-repository", () => ({
  insertContactRecord: vi.fn(),
  selectContactRecords: vi.fn(),
  selectContactRecordById: vi.fn(),
  updateContactTracking: vi.fn(),
  updateContactFollowUp: vi.fn(),
}));

vi.mock("@/data/notes-repository", () => ({
  insertNoteRecord: vi.fn(),
  selectNoteRecords: vi.fn(),
  selectAllNoteRecords: vi.fn(),
}));

import { selectAllNoteRecords } from "@/data/notes-repository";
import {
  insertContactRecord,
  selectContactRecordById,
  selectContactRecords,
  updateContactFollowUp,
  updateContactTracking,
} from "@/data/contacts-repository";
import {
  CONTACT_FIELDS,
  addContact,
  getContact,
  listContacts,
  listContactsForExport,
  listDueFollowUps,
  searchContacts,
  setFollowUp,
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
  next_follow_up: null,
  created_at: "2026-11-19T10:00:00.000Z",
  ...over,
});

beforeEach(() => {
  vi.mocked(insertContactRecord).mockReset();
  vi.mocked(selectContactRecords).mockReset();
  vi.mocked(selectContactRecordById).mockReset();
  vi.mocked(updateContactTracking).mockReset();
  vi.mocked(updateContactFollowUp).mockReset();
  vi.mocked(selectAllNoteRecords).mockReset();
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
        nextFollowUp: null,
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
// Fausse couche données : la ligne `current` est passée au calcul du service, qui fixe `written`.
let written: unknown;
function stored(current: ContactRecord | null, after: ContactRecord = current ?? record()) {
  written = undefined;
  vi.mocked(updateContactTracking).mockImplementation(async (_id, compute) => {
    if (!current) return null;
    written = compute(current);
    return after;
  });
}

describe("setCalled", () => {
  it("marque appelé en gardant la réponse", async () => {
    stored(record({ called: 0, response: "enAttente" }), record({ called: 1 }));
    const r = await setCalled("id-1", true);
    expect(written).toEqual({ called: true, response: "enAttente" });
    expect(r.ok && r.contact.called).toBe(true);
  });

  it("repasser en « non appelé » remet la réponse à « en attente »", async () => {
    stored(record({ called: 1, response: "accepte" }), record());
    await setCalled("id-1", false);
    expect(written).toEqual({ called: false, response: "enAttente" });
  });

  it("signale un contact introuvable sans rien écrire", async () => {
    stored(null);
    expect(await setCalled("inconnu", true)).toEqual({ ok: false, error: "Contact introuvable." });
    expect(written).toBeUndefined();
  });

  it("refuse un état d'appel qui n'est pas un booléen, sans rien lire ni écrire", async () => {
    expect(await setCalled("id-1", "oui")).toEqual({ ok: false, error: "État d'appel inconnu." });
    expect(updateContactTracking).not.toHaveBeenCalled();
  });
});

describe("setResponse", () => {
  it("une réponse « accepté » marque aussi le contact comme appelé", async () => {
    stored(record({ called: 0, response: "enAttente" }), record({ called: 1, response: "accepte" }));
    const r = await setResponse("id-1", "accepte");
    expect(written).toEqual({ called: true, response: "accepte" });
    expect(r.ok && [r.contact.called, r.contact.response]).toEqual([true, "accepte"]);
  });

  it("refuse une réponse inconnue sans rien écrire", async () => {
    expect(await setResponse("id-1", "peut-etre")).toEqual({ ok: false, error: "Réponse inconnue." });
    expect(updateContactTracking).not.toHaveBeenCalled();
  });

  it("signale un contact introuvable", async () => {
    stored(null);
    expect(await setResponse("inconnu", "refuse")).toEqual({ ok: false, error: "Contact introuvable." });
  });
});

describe("getContact (fiche)", () => {
  it("renvoie le contact avec sa prochaine relance", async () => {
    vi.mocked(selectContactRecordById).mockResolvedValue(record({ next_follow_up: "2026-12-03" }));
    expect(await getContact("id-1")).toMatchObject({ id: "id-1", nextFollowUp: "2026-12-03" });
  });

  it("renvoie null pour un id inconnu", async () => {
    vi.mocked(selectContactRecordById).mockResolvedValue(null);
    expect(await getContact("inconnu")).toBeNull();
  });
});

describe("setFollowUp (lot 3)", () => {
  it("fixe la prochaine relance à une date", async () => {
    vi.mocked(updateContactFollowUp).mockResolvedValue(record({ next_follow_up: "2026-12-03" }));
    const r = await setFollowUp("id-1", "2026-12-03");
    expect(updateContactFollowUp).toHaveBeenCalledWith("id-1", "2026-12-03");
    expect(r.ok && r.contact.nextFollowUp).toBe("2026-12-03");
  });

  it("une date vide efface la relance", async () => {
    vi.mocked(updateContactFollowUp).mockResolvedValue(record());
    await setFollowUp("id-1", "");
    expect(updateContactFollowUp).toHaveBeenCalledWith("id-1", null);
  });

  it("refuse une date invalide sans rien écrire", async () => {
    expect(await setFollowUp("id-1", "2026-02-30")).toEqual({ ok: false, error: "Date invalide." });
    expect(updateContactFollowUp).not.toHaveBeenCalled();
  });

  it("signale un contact introuvable", async () => {
    vi.mocked(updateContactFollowUp).mockResolvedValue(null);
    expect(await setFollowUp("inconnu", "2026-12-03")).toEqual({ ok: false, error: "Contact introuvable." });
  });
});

describe("listDueFollowUps (lot 3)", () => {
  it("garde les relances du jour (heure de Paris) et en retard, hors acceptés et refusés", async () => {
    vi.mocked(selectContactRecords).mockResolvedValue([
      record({ id: "jour", name: "Jour", next_follow_up: "2026-11-22" }),
      record({ id: "retard", name: "Retard", next_follow_up: "2026-11-20" }),
      record({ id: "futur", name: "Futur", next_follow_up: "2026-11-23" }),
      record({ id: "refus", name: "Refus", called: 1, response: "refuse", next_follow_up: "2026-11-20" }),
    ]);
    // 23 h 30 UTC le 21 : il est 0 h 30 le 22 à Paris.
    const due = await listDueFollowUps(new Date("2026-11-21T23:30:00Z"));
    expect(due.map((d) => [d.contact.id, d.state])).toEqual([
      ["retard", "enRetard"],
      ["jour", "aujourdhui"],
    ]);
  });
});

describe("searchContacts (lot 4)", () => {
  it("filtre sur les champs du contact et ses notes, sans casse ni accents, en gardant l'ordre", async () => {
    vi.mocked(selectContactRecords).mockResolvedValue([
      record({ id: "a", name: "Hélène Dupré", company: null, phone: null, email: null }),
      record({ id: "b", name: "Bruno", company: null, phone: null, email: null }),
      record({ id: "c", name: "Chloé", company: null, phone: null, email: null }),
    ]);
    vi.mocked(selectAllNoteRecords).mockResolvedValue([
      { id: "n1", contact_id: "c", body: "Connaît Hélène", created_at: "2026-11-21T09:00:00.000Z" },
    ]);
    expect((await searchContacts("HELENE")).map((c) => c.id)).toEqual(["a", "c"]);
  });

  it("une recherche vide rend tous les contacts sans lire les notes", async () => {
    vi.mocked(selectContactRecords).mockResolvedValue([record()]);
    expect(await searchContacts("")).toHaveLength(1);
    expect(selectAllNoteRecords).not.toHaveBeenCalled();
  });
});

describe("listContactsForExport (lot 5)", () => {
  it("chaque contact avec sa note la plus récente, ou null", async () => {
    vi.mocked(selectContactRecords).mockResolvedValue([record({ id: "a" }), record({ id: "b" })]);
    // La base rend les notes des plus récentes aux plus anciennes.
    vi.mocked(selectAllNoteRecords).mockResolvedValue([
      { id: "n2", contact_id: "a", body: "Dernière", created_at: "2026-11-21T10:00:00.000Z" },
      { id: "n1", contact_id: "a", body: "Première", created_at: "2026-11-20T10:00:00.000Z" },
    ]);
    expect((await listContactsForExport()).map((r) => [r.contact.id, r.lastNote])).toEqual([
      ["a", "Dernière"],
      ["b", null],
    ]);
  });
});
