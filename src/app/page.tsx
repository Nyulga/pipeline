import { Suspense } from "react";
import { AddContactDialog } from "@/components/contacts/add-contact-dialog";
import { ContactList, ContactListSkeleton } from "@/components/contacts/contact-list";
import { ContactSearch } from "@/components/contacts/contact-search";
import { ExportButton } from "@/components/contacts/export-button";
import { DueFollowUps, DueFollowUpsSkeleton } from "@/components/contacts/due-follow-ups";

type SearchParams = Promise<{ q?: string | string[] }>;

async function SearchBox({ searchParams }: { searchParams: SearchParams }) {
  const { q } = await searchParams;
  return <ContactSearch query={(Array.isArray(q) ? q[0] : q)?.trim() ?? ""} />;
}

export default function Home({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4 pr-12">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-primary">Pipeline</p>
          <h1 className="text-4xl font-semibold tracking-tight">Mes contacts</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportButton />
          <AddContactDialog />
        </div>
      </header>

      <Suspense fallback={<DueFollowUpsSkeleton />}>
        <DueFollowUps />
      </Suspense>

      <Suspense fallback={<ContactSearch query="" />}>
        <SearchBox searchParams={searchParams} />
      </Suspense>

      <Suspense fallback={<ContactListSkeleton />}>
        <ContactList searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
