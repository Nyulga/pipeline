// La file « À appeler maintenant » : fonctions pures, sans accès à la base (importables côté client).
// Un jour est au format AAAA-MM-JJ ; « aujourd'hui » se calcule à l'heure de Paris (todayInParis).

import type { Contact } from "@/services/contact-model";
import { followUpState } from "@/services/follow-up";

/** Pourquoi un contact est dans la file. */
export type QueueReason = "enRetard" | "aujourdhui" | "jamaisAppele";

export type QueueItem = { contact: Contact; reason: QueueReason };

const RANK: Record<QueueReason, number> = { enRetard: 0, aujourdhui: 1, jamaisAppele: 2 };

function reasonOf(c: Contact, today: string): QueueReason | null {
  const due = followUpState(c, today);
  if (due) return due;
  if (c.response === "enAttente" && !c.called && !c.nextFollowUp) return "jamaisAppele";
  return null;
}

/**
 * Qui appeler, dans l'ordre : relances en retard (la plus ancienne d'abord), relances du jour,
 * puis contacts jamais appelés sans relance prévue (le plus ancien ajout d'abord) ; à égalité, par nom.
 * Acceptés et refusés n'y sont jamais ; une relance future (« Plus tard ») sort le contact de la file.
 */
export function callQueue(contacts: readonly Contact[], today: string): QueueItem[] {
  const items: QueueItem[] = [];
  for (const contact of contacts) {
    const reason = reasonOf(contact, today);
    if (reason) items.push({ contact, reason });
  }
  const key = (i: QueueItem) => (i.reason === "jamaisAppele" ? i.contact.createdAt : i.contact.nextFollowUp!);
  return items.sort(
    (a, b) =>
      RANK[a.reason] - RANK[b.reason] ||
      key(a).localeCompare(key(b)) ||
      a.contact.name.localeCompare(b.contact.name, "fr", { sensitivity: "base" }),
  );
}

/** Le lendemain d'un jour AAAA-MM-JJ (calcul en UTC : un jour n'a pas d'heure, donc pas de changement d'heure). */
export function nextDay(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}
