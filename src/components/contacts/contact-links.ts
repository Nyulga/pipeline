// Adresses du panneau de fiche : il vit dans l'adresse de l'accueil (`/?contact=<id>`),
// à côté de la recherche (`q`) et du filtre d'étape (`etape`), pour survivre au rechargement.

export type HomeParams = { q?: string | null; etape?: string | null; contact?: string | null };

function homeHref(params: HomeParams): string {
  const search = new URLSearchParams();
  for (const key of ["q", "etape", "contact"] as const) {
    const value = params[key];
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
