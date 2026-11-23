import { ContactDetails } from "@/components/contacts/contact-details";
import { ContactPanel } from "@/components/contacts/contact-panel";
import type { ContactSheet } from "@/services/contact-sheet";

/** Le panneau de l'accueil : la fiche du contact, ou un message s'il n'existe plus (lien périmé). */
export function ContactPanelView({ sheet, closeHref }: { sheet: ContactSheet | null; closeHref: string }) {
  if (!sheet) {
    return (
      <ContactPanel title="Contact introuvable" closeHref={closeHref}>
        <p className="text-muted-foreground">Ce contact n&apos;existe plus.</p>
      </ContactPanel>
    );
  }
  return (
    // Une clé par contact : passer de l'un à l'autre repart de formulaires vides.
    <ContactPanel key={sheet.contact.id} title={sheet.contact.name} closeHref={closeHref}>
      <ContactDetails contact={sheet.contact} notes={sheet.notes} notesHeading="h3" />
    </ContactPanel>
  );
}
