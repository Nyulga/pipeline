// Le panneau de fiche a-t-il été ouvert par un clic dans l'app (une entrée ajoutée à l'historique) ?
// Si oui, le fermer revient en arrière : sinon, Retour tomberait sur une copie de la même page.
// Ouvert par un lien partagé ou un rechargement, il n'y a rien à quoi revenir : on remplace l'adresse.

let openedInApp = false;

export function markPanelOpened() {
  openedInApp = true;
}

/** Vrai une seule fois après markPanelOpened. */
export function consumePanelOpened(): boolean {
  const was = openedInApp;
  openedInApp = false;
  return was;
}
