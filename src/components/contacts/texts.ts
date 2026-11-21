// Textes partagés de l'écran des contacts, définis une seule fois.

/** Échec inattendu d'un enregistrement (réseau, base injoignable…). */
export const SAVE_FAILED_MESSAGE = "Impossible d'enregistrer, réessaie.";

/** « 1 contact », « 2 contacts » : « contact » accordé au nombre. */
export function contactCount(n: number): string {
  return `${n} contact${n > 1 ? "s" : ""}`;
}
