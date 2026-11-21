import { describe, expect, it, vi } from "vitest";
import { setupTestDatabase } from "../helpers/test-db";

// connection() n'a de sens que pendant un rendu Next : ici, elle ne fait rien.
vi.mock("next/server", () => ({ connection: vi.fn(async () => {}) }));

import { GET } from "@/app/export/route";
import { addContact, setFollowUp, setResponse } from "@/services/contacts";
import { addNote } from "@/services/notes";

setupTestDatabase();

const HEADER =
  "Nom;Entreprise;Téléphone;E-mail;Appelé;Réponse;Étape;Prochaine relance;Date de création;Dernière note";

async function exported() {
  const res = await GET();
  const bytes = new Uint8Array(await res.arrayBuffer());
  return { res, bytes, text: new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes) };
}

describe("GET /export : le fichier CSV (critères du lot 5)", () => {
  it("se télécharge sous le nom pipeline-contacts-AAAA-MM-JJ.csv, en CSV UTF-8 jamais mis en cache", async () => {
    const { res } = await exported();
    expect(res.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(res.headers.get("content-disposition")).toMatch(
      /^attachment; filename="pipeline-contacts-\d{4}-\d{2}-\d{2}\.csv"$/,
    );
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("contient tous les contacts, avec toutes les colonnes, accents compris (BOM pour Excel)", async () => {
    const r = await addContact({ name: "Hélène Dupré", company: "Café Éole", phone: "06 12 34 56 78", email: "h@eole.fr" });
    if (!r.ok) throw new Error("ajout impossible");
    await setResponse(r.contact.id, "accepte");
    await setFollowUp(r.contact.id, "2026-12-03");
    await addNote(r.contact.id, "Première note");
    await addNote(r.contact.id, "Dernière note");
    await addContact({ name: "Sans rien" });

    const { bytes, text } = await exported();
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const lines = text.slice(1).split("\r\n");
    expect(lines[0]).toBe(HEADER);
    const helene = lines.find((l) => l.startsWith("Hélène Dupré;"))!.split(";");
    expect(helene.slice(0, 8)).toEqual([
      "Hélène Dupré",
      "Café Éole",
      "06 12 34 56 78",
      "h@eole.fr",
      "Oui",
      "Accepté",
      "Accepté",
      "03/12/2026",
    ]);
    expect(helene[8]).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
    expect(helene[9]).toBe("Dernière note");
    const vide = lines.find((l) => l.startsWith("Sans rien;"))!.split(";");
    expect([...vide.slice(0, 8), vide[9]]).toEqual(["Sans rien", "", "", "", "Non", "En attente", "À appeler", "", ""]);
  });

  it("une valeur avec ;, guillemets, retour à la ligne ou début de formule ne casse pas le fichier", async () => {
    const r = await addContact({ name: '=1+1 "piège"', company: "Nord; Sud" });
    if (!r.ok) throw new Error("ajout impossible");
    await addNote(r.contact.id, "ligne 1\nligne 2");
    const { text } = await exported();
    expect(text).toContain(`"'=1+1 ""piège"""`);
    expect(text).toContain('"Nord; Sud"');
    expect(text).toContain('"ligne 1\nligne 2"');
  });
});
