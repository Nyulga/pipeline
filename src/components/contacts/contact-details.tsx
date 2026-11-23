import { MailIcon, PhoneIcon } from "lucide-react";
import { FollowUpForm } from "@/components/contacts/follow-up-form";
import { NoteForm } from "@/components/contacts/note-form";
import { NoteList } from "@/components/contacts/note-list";
import { StageBadge } from "@/components/status-badge";
import type { Contact } from "@/services/contacts";
import type { Note } from "@/services/notes";
import { stageOf } from "@/services/tracking";

/**
 * Le contenu de la fiche d'un contact, sans son nom (titre de la page ou du panneau) :
 * entreprise, étape, coordonnées, prochaine relance et notes.
 */
export function ContactDetails({ contact: c, notes }: { contact: Contact; notes: Note[] }) {
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">{c.company ?? "Sans entreprise"}</p>
      <div className="flex flex-wrap items-center gap-4">
        <StageBadge stage={stageOf(c)} />
        {c.phone && (
          <a
            href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}
            className="flex items-center gap-1.5 font-mono text-sm text-muted-foreground hover:text-foreground"
          >
            <PhoneIcon aria-hidden className="size-3.5" />
            {c.phone}
          </a>
        )}
        {c.email && (
          <a
            href={`mailto:${c.email}`}
            className="flex items-center gap-1.5 font-mono text-sm text-muted-foreground hover:text-foreground"
          >
            <MailIcon aria-hidden className="size-3.5" />
            {c.email}
          </a>
        )}
      </div>
      <section aria-label="Prochaine relance" className="border-t border-border pt-4">
        <FollowUpForm key={c.nextFollowUp ?? ""} contactId={c.id} nextFollowUp={c.nextFollowUp} />
      </section>
      <section aria-labelledby={`notes-${c.id}`} className="space-y-4 border-t border-border pt-4">
        <h2 id={`notes-${c.id}`} className="font-heading text-lg font-semibold">
          Notes
        </h2>
        <NoteForm contactId={c.id} />
        <NoteList notes={notes} />
      </section>
    </div>
  );
}
