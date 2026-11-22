// Règles de la recherche : fonctions pures, sans accès à la base.
// On cherche une partie du nom, de l'entreprise, du téléphone, de l'e-mail ou d'une note,
// sans tenir compte des majuscules ni des accents.

import type { Contact } from "@/services/contact-model";

/** Lettres que NFD ne décompose pas : ligatures et lettres barrées. */
const UNDECOMPOSED: Record<string, string> = { œ: "oe", æ: "ae", ł: "l", ø: "o", đ: "d" };

/**
 * Minuscules, accents retirés, ligatures et lettres barrées dépliées, apostrophes typographiques
 * ramenées à « ' » (iPhone et Mac remplacent ' par ’), espaces resserrés :
 * « Cœur  d’Hélène » → « coeur d'helene ».
 */
export function normalizeForSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[œæłøđ]/g, (l) => UNDECOMPOSED[l])
    .replace(/[’‘ʼ]/g, "'")
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
