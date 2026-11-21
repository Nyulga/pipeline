// Règles de la prochaine relance : fonctions pures, sans accès à la base.
// Une relance est un jour (AAAA-MM-JJ), sans heure ; « aujourd'hui » s'entend à l'heure de Paris.

import type { Contact } from "@/services/contact-model";

/** Où en est la relance d'un contact, quand il y a quelque chose à faire aujourd'hui. */
export type FollowUpState = "aujourdhui" | "enRetard";

export type DueFollowUp = { contact: Contact; state: FollowUpState };

const PARIS_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Le jour calendaire à Paris, au format AAAA-MM-JJ. */
export function todayInParis(now: Date): string {
  const parts = Object.fromEntries(PARIS_DAY.formatToParts(now).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Une date réelle au format AAAA-MM-JJ, ou une valeur vide (null) pour effacer la relance. */
export function parseFollowUpDate(
  value: unknown,
): { ok: true; value: string | null } | { ok: false; error: string } {
  const invalid = { ok: false as const, error: "Date invalide." };
  if (value === null) return { ok: true, value: null };
  if (typeof value !== "string") return invalid;
  const v = value.trim();
  if (v === "") return { ok: true, value: null };
  const m = DAY.exec(v);
  if (!m) return invalid;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  const real = date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
  return real ? { ok: true, value: v } : invalid;
}

/**
 * « aujourdhui » si la relance tombe aujourd'hui, « enRetard » si elle est passée,
 * null sinon. Un contact accepté ou refusé n'est plus à relancer.
 */
export function followUpState(
  c: Pick<Contact, "response" | "nextFollowUp">,
  today: string,
): FollowUpState | null {
  if (c.response !== "enAttente" || !c.nextFollowUp) return null;
  if (c.nextFollowUp === today) return "aujourdhui";
  return c.nextFollowUp < today ? "enRetard" : null;
}

/** La liste « À relancer aujourd'hui » : du plus en retard au plus récent, puis par nom. */
export function dueFollowUps(contacts: readonly Contact[], today: string): DueFollowUp[] {
  const due: DueFollowUp[] = [];
  for (const contact of contacts) {
    const state = followUpState(contact, today);
    if (state) due.push({ contact, state });
  }
  return due.sort(
    (a, b) =>
      a.contact.nextFollowUp!.localeCompare(b.contact.nextFollowUp!) ||
      a.contact.name.localeCompare(b.contact.name, "fr", { sensitivity: "base" }),
  );
}
