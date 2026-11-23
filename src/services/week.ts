// « Ta semaine » (lot 10) : appels passés depuis lundi 0 h (Paris), taux d'acceptation,
// relances des 7 prochains jours. Les règles sont pures ; getWeekSummary lit la base.

import type { Contact } from "@/services/contact-model";
import { listContacts } from "@/services/contacts";
import { todayInParis } from "@/services/follow-up";

export type WeekSummary = {
  /** Contacts appelés depuis lundi 0 h, heure de Paris (les appels sans date ne comptent pas). */
  callsThisWeek: number;
  /** Acceptés ÷ (acceptés + refusés), en pourcentage arrondi ; null sans aucune réponse. */
  acceptanceRate: number | null;
  /** Contacts à relancer d'aujourd'hui à J+6, par jour puis par nom. */
  upcoming: Contact[];
};

const PARIS_CLOCK = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris",
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Décalage de Paris sur UTC à l'instant `t`, en millisecondes (+1 h l'hiver, +2 h l'été). */
function parisOffset(t: number): number {
  const p = Object.fromEntries(PARIS_CLOCK.formatToParts(new Date(t)).map((x) => [x.type, Number(x.value)]));
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(t / 1000) * 1000;
}

/** Le jour AAAA-MM-JJ décalé de `n` jours (calcul en UTC, sans effet de changement d'heure). */
function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** L'instant du lundi 0 h, heure de Paris, de la semaine de `now`. */
export function weekStartInParis(now: Date): Date {
  const today = todayInParis(now);
  const [y, m, d] = today.split("-").map(Number);
  const sinceMonday = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
  const monday = addDays(today, -sinceMonday);
  const [my, mm, md] = monday.split("-").map(Number);
  const midnightUtc = Date.UTC(my, mm - 1, md);
  // Les changements d'heure ont lieu un dimanche à 2-3 h : le décalage du lundi 0 h est celui de ce lundi.
  return new Date(midnightUtc - parisOffset(midnightUtc));
}

export function weekSummary(contacts: readonly Contact[], now: Date): WeekSummary {
  const start = weekStartInParis(now).getTime();
  const callsThisWeek = contacts.filter((c) => c.called && c.calledAt && Date.parse(c.calledAt) >= start).length;

  const accepted = contacts.filter((c) => c.response === "accepte").length;
  const refused = contacts.filter((c) => c.response === "refuse").length;
  const acceptanceRate = accepted + refused === 0 ? null : Math.round((100 * accepted) / (accepted + refused));

  const today = todayInParis(now);
  const last = addDays(today, 6);
  const upcoming = contacts
    .filter((c) => c.response === "enAttente" && c.nextFollowUp && c.nextFollowUp >= today && c.nextFollowUp <= last)
    .sort(
      (a, b) =>
        a.nextFollowUp!.localeCompare(b.nextFollowUp!) || a.name.localeCompare(b.name, "fr", { sensitivity: "base" }),
    );

  return { callsThisWeek, acceptanceRate, upcoming };
}

/** « Ta semaine » à l'instant `now`. */
export async function getWeekSummary(now: Date): Promise<WeekSummary> {
  return weekSummary(await listContacts(), now);
}
