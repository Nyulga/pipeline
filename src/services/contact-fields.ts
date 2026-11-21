// Les champs d'un contact, définis une seule fois : la validation du service,
// l'action du formulaire et le formulaire lui-même s'appuient sur cette liste.
// Module pur (aucun accès à la base) : importable par un composant client.

export const CONTACT_FIELDS = ["name", "company", "phone", "email"] as const;

export type ContactField = (typeof CONTACT_FIELDS)[number];
