import { Suspense } from "react";
import { connection } from "next/server";
import { ContactDetails } from "@/components/contacts/contact-details";
import { withoutContact } from "@/components/contacts/contact-links";
import { ContactPanel } from "@/components/contacts/contact-panel";
import { AddContactDialog } from "@/components/contacts/add-contact-dialog";
import { ContactList, ContactListSkeleton } from "@/components/contacts/contact-list";
import { ContactSearch } from "@/components/contacts/contact-search";
import { ExportButton } from "@/components/contacts/export-button";
import { DueFollowUps, DueFollowUpsSkeleton } from "@/components/contacts/due-follow-ups";
import { Today, TodayGreeting, TodayGreetingSkeleton, TodaySkeleton } from "@/components/contacts/today";
import { getContactSheet } from "@/services/contact-sheet";
import { parseStage } from "@/services/tracking";

type SearchParams = Promise<{ q?: string | string[]; etape?: string | string[]; contact?: string | string[] }>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** La fiche par-dessus la liste quand l'adresse porte `?contact=<id>` (lot 9). */
async function PanelSlot({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const id = first(params.contact);
  if (!id) return null;
  await connection();
  const closeHref = withoutContact({ q: first(params.q), etape: first(params.etape) });
  const sheet = await getContactSheet(id);
  if (!sheet) {
    return (
      <ContactPanel title="Contact introuvable" closeHref={closeHref}>
        <p className="text-muted-foreground">Ce contact n&apos;existe plus.</p>
      </ContactPanel>
    );
  }
  return (
    <ContactPanel title={sheet.contact.name} closeHref={closeHref}>
      <ContactDetails contact={sheet.contact} notes={sheet.notes} />
    </ContactPanel>
  );
}

async function SearchBox({ searchParams }: { searchParams: SearchParams }) {
  const { q, etape } = await searchParams;
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

      <Suspense fallback={null}>
        <PanelSlot searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
