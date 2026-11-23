// Adresses du panneau de fiche : il vit dans l'adresse de l'accueil (`/?contact=<id>`),
// à côté de la recherche (`q`), du filtre d'étape (`etape`) et de la vue (`vue`), pour survivre au rechargement.

/** Vue de « Mes contacts » : la liste (par défaut) ou les colonnes par étape (`?vue=etapes`, lot 11). */
export type View = "liste" | "etapes";

export function parseView(value: string | null | undefined): View {
  return value === "etapes" ? "etapes" : "liste";
}

export type HomeParams = { q?: string | null; etape?: string | null; vue?: string | null; contact?: string | null };

/** L'adresse de l'accueil avec ces paramètres ; la vue « Liste », par défaut, n'y figure pas. */
export function homeHref(params: HomeParams): string {
  const search = new URLSearchParams();
  for (const key of ["q", "etape", "vue", "contact"] as const) {
    const value = key === "vue" ? (parseView(params.vue) === "etapes" ? "etapes" : null) : params[key];
    if (value) search.set(key, value);
  }
  const s = search.toString();
  return s ? `/?${s}` : "/";
}

/** L'adresse qui ouvre la fiche de `id` par-dessus la liste, en gardant recherche et filtre. */
export function contactPanelHref(params: HomeParams, id: string): string {
  return homeHref({ ...params, contact: id });
}

/** La même adresse, panneau fermé. */
export function withoutContact(params: HomeParams): string {
  return homeHref({ ...params, contact: null });
}

/** Lien `tel:` : chiffres et « + » seulement, quoi qu'on ait saisi (espaces, points, parenthèses…). */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/**
 * Lien `mailto:` : l'adresse est encodée, pour qu'un « ? » ou un « & » saisi n'ajoute
 * ni destinataire caché ni corps au brouillon.
 */
export function mailtoHref(email: string): string {
  const at = email.indexOf("@");
  if (at < 0) return `mailto:${encodeURIComponent(email)}`;
  return `mailto:${encodeURIComponent(email.slice(0, at))}@${encodeURIComponent(email.slice(at + 1))}`;
}
