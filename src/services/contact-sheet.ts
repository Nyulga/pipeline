// Ce que montre la fiche d'un contact, sur sa page comme dans le panneau de l'accueil.

import { getContact, type Contact } from "@/services/contacts";
import { listNotes, type Note } from "@/services/notes";

export type ContactSheet = { contact: Contact; notes: Note[] };

/** Le contact et ses notes (les plus récentes d'abord), ou null s'il n'existe pas (lien périmé). */
export async function getContactSheet(id: string): Promise<ContactSheet | null> {
  const contact = await getContact(id);
  if (!contact) return null;
  return { contact, notes: await listNotes(contact.id) };
}
