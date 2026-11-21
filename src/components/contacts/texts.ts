// Textes partagés de l'écran des contacts, définis une seule fois.

/** Échec inattendu d'un enregistrement (réseau, base injoignable…). */
export const SAVE_FAILED_MESSAGE = "Impossible d'enregistrer, réessaie.";

/** « 1 contact », « 2 contacts » : « contact » accordé au nombre. */
export function contactCount(n: number): string {
  return `${n} contact${n > 1 ? "s" : ""}`;
}

const DAY_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** « 3 déc. 2026 » pour le jour « 2026-12-03 » (un jour sans heure, donc sans décalage horaire). */
export function formatDay(day: string): string {
  return DAY_FORMAT.format(new Date(`${day}T00:00:00Z`));
}
