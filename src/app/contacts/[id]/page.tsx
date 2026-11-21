import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeftIcon, MailIcon, PhoneIcon } from "lucide-react";
import { FollowUpForm } from "@/components/contacts/follow-up-form";
import { NoteForm } from "@/components/contacts/note-form";
import { NoteList } from "@/components/contacts/note-list";
import { StageBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getContact } from "@/services/contacts";
import { listNotes } from "@/services/notes";
import { stageOf } from "@/services/tracking";

/** Fiche d'un contact : lue à chaque requête, rendue en flux sous un <Suspense>. */
export default function ContactPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon aria-hidden className="size-4" />
        Mes contacts
      </Link>
      <Suspense fallback={<div aria-busy className="h-64 animate-pulse rounded-lg border border-border bg-muted" />}>
        <ContactSheet params={params} />
      </Suspense>
    </main>
  );
}

async function ContactSheet({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const c = await getContact(id);
  if (!c) notFound();
  const notes = await listNotes(c.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-3xl">
          <h1>{c.name}</h1>
        </CardTitle>
        <CardDescription>{c.company ?? "Sans entreprise"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <StageBadge stage={stageOf(c)} />
          {c.phone && (
            <a
              href={`tel:${c.phone.replace(/\s+/g, "")}`}
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
        <section aria-labelledby="notes" className="space-y-4 border-t border-border pt-4">
          <h2 id="notes" className="font-heading text-lg font-semibold">
            Notes
          </h2>
          <NoteForm contactId={c.id} />
          <NoteList notes={notes} />
        </section>
      </CardContent>
    </Card>
  );
}
