// La forme d'un contact, définie une seule fois : ses champs, ses réponses possibles, son type.
// La validation du service, les actions et les composants s'appuient sur ce module.
// Module pur (aucun accès à la base) : importable par un composant client.

/** Les champs saisis dans le formulaire d'ajout, dans l'ordre du formulaire. */
export const CONTACT_FIELDS = ["name", "company", "phone", "email"] as const;

export type ContactField = (typeof CONTACT_FIELDS)[number];

export type ContactResponse = "accepte" | "refuse" | "enAttente";

/** Les réponses possibles, dans l'ordre du sélecteur. */
export const RESPONSES: readonly ContactResponse[] = ["accepte", "refuse", "enAttente"];

export function isContactResponse(value: unknown): value is ContactResponse {
  return typeof value === "string" && (RESPONSES as readonly string[]).includes(value);
}

/** Un contact, tel que le voit le reste de l'app. */
export type Contact = {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  called: boolean;
  /** Instant de l'appel (ISO, UTC), ou null : pas appelé, ou appelé avant le lot 10. */
  calledAt: string | null;
  response: ContactResponse;
  /** Prochaine relance, un jour AAAA-MM-JJ, ou null. */
  nextFollowUp: string | null;
  createdAt: string;
};
