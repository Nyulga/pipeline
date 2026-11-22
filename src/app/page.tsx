import { Suspense } from "react";
import { AddContactDialog } from "@/components/contacts/add-contact-dialog";
import { ContactList, ContactListSkeleton } from "@/components/contacts/contact-list";
import { ContactSearch } from "@/components/contacts/contact-search";
import { ExportButton } from "@/components/contacts/export-button";
import { DueFollowUps, DueFollowUpsSkeleton } from "@/components/contacts/due-follow-ups";
import { Today, TodayGreeting, TodayGreetingSkeleton, TodaySkeleton } from "@/components/contacts/today";
import { parseStage } from "@/services/tracking";

type SearchParams = Promise<{ q?: string | string[]; etape?: string | string[] }>;

async function SearchBox({ searchParams }: { searchParams: SearchParams }) {
  const { q, etape } = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  return <ContactSearch query={first(q)?.trim() ?? ""} stage={parseStage(first(etape))} />;
}

export default function Home({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4 pr-12">
        <Suspense fallback={<TodayGreetingSkeleton />}>
          <TodayGreeting />
        </Suspense>
        <div className="flex flex-wrap gap-2">
          <ExportButton />
          <AddContactDialog />
        </div>
      </header>

      <Suspense fallback={<TodaySkeleton />}>
        <Today />
      </Suspense>

      <Suspense fallback={<DueFollowUpsSkeleton />}>
        <DueFollowUps />
      </Suspense>

      <section aria-labelledby="mes-contacts" className="space-y-4">
        <h2 id="mes-contacts" className="text-2xl font-bold tracking-tight">
          Mes contacts
        </h2>
        <Suspense fallback={<ContactSearch query="" />}>
          <SearchBox searchParams={searchParams} />
        </Suspense>
        <Suspense fallback={<ContactListSkeleton />}>
          <ContactList searchParams={searchParams} />
        </Suspense>
      </section>
    </main>
  );
}
