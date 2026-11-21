// Règles du fichier CSV : fonctions pures, sans accès à la base.
// Le fichier vise Excel en français : séparateur « ; », BOM UTF-8 (sinon les accents cassent), CRLF.

import { todayInParis } from "@/services/follow-up";

const SEPARATOR = ";";
const BOM = "﻿";
const NEEDS_QUOTES = /[;"\r\n]/;
/** Un début de cellule qu'un tableur prendrait pour une formule (injection CSV, OWASP). */
const FORMULA_START = /^[=+\-@\t\r]/;

/** Une cellule sûre : jamais interprétée comme une formule, jamais coupée par un ;, un " ou un retour à la ligne. */
export function csvCell(value: string | null): string {
  let v = value ?? "";
  if (FORMULA_START.test(v)) v = `'${v}`;
  return NEEDS_QUOTES.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** Le fichier complet : BOM, lignes séparées par CRLF, cellules par « ; ». */
export function toCsv(rows: readonly (readonly (string | null)[])[]): string {
  return BOM + rows.map((r) => r.map(csvCell).join(SEPARATOR) + "\r\n").join("");
}

/** pipeline-contacts-AAAA-MM-JJ.csv, avec le jour à Paris. */
export function exportFileName(now: Date): string {
  return `pipeline-contacts-${todayInParis(now)}.csv`;
}
