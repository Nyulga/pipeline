import { Suspense } from "react";
import { AddContactDialog } from "@/components/contacts/add-contact-dialog";
import { ContactList, ContactListSkeleton } from "@/components/contacts/contact-list";
import { DueFollowUps, DueFollowUpsSkeleton } from "@/components/contacts/due-follow-ups";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4 pr-12">
        <div className="space-y-1">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Pipeline</p>
          <h1 className="text-4xl font-semibold tracking-tight">Mes contacts</h1>
        </div>
        <AddContactDialog />
      </header>

      <Suspense fallback={<DueFollowUpsSkeleton />}>
        <DueFollowUps />
      </Suspense>

      <Suspense fallback={<ContactListSkeleton />}>
        <ContactList />
      </Suspense>
    </main>
  );
}
