// Règles de la recherche : fonctions pures, sans accès à la base.
// On cherche une partie du nom, de l'entreprise, du téléphone, de l'e-mail ou d'une note,
// sans tenir compte des majuscules ni des accents.

import type { Contact } from "@/services/contact-model";

/** Ligatures que NFD ne décompose pas. */
const LIGATURES: Record<string, string> = { œ: "oe", æ: "ae" };

/** Minuscules, accents retirés, ligatures dépliées, espaces resserrés : « Cœur  d'Hélène » → « coeur d'helene ». */
export function normalizeForSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[œæ]/g, (l) => LIGATURES[l])
    .replace(/\s+/g, " ")
    .trim();
}

const digits = (text: string) => text.replace(/\D/g, "");

/** Vrai si `query` se trouve dans un champ du contact ou dans l'une de ses notes. Une recherche vide garde tout. */
export function matchesSearch(
  contact: Pick<Contact, "name" | "company" | "phone" | "email">,
  notes: readonly string[],
  query: string,
): boolean {
  const q = normalizeForSearch(query);
  if (q === "") return true;
  const fields = [contact.name, contact.company, contact.phone, contact.email, ...notes];
  if (fields.some((f) => f != null && normalizeForSearch(f).includes(q))) return true;
  // Un numéro se tape souvent sans espaces : « 0612 » trouve « 06 12 34 56 78 ».
  const qDigits = digits(q);
  return /^[\d\s.+()-]+$/.test(q) && qDigits !== "" && contact.phone != null && digits(contact.phone).includes(qDigits);
}
