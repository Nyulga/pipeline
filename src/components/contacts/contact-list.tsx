import Link from "next/link";
import { connection } from "next/server";
import { SearchXIcon, UsersIcon } from "lucide-react";
import { AddContactDialog } from "@/components/contacts/add-contact-dialog";
import { homeHref, parseView, type View } from "@/components/contacts/contact-links";
import { ContactsView } from "@/components/contacts/contacts-view";
import { StageFilter } from "@/components/contacts/stage-filter";
import { stageStyles } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { searchContacts, type Contact } from "@/services/contacts";
import { parseStage, stageOf, type Stage } from "@/services/tracking";

type ListSearchParams = Promise<{ q?: string | string[]; etape?: string | string[]; vue?: string | string[] }>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Liste lue à chaque requête (jamais figée au build), filtrée par la recherche, rendue sous un <Suspense>. */
export async function ContactList({ searchParams }: { searchParams: ListSearchParams }) {
  await connection();
  const { q, etape, vue } = await searchParams;
  const query = first(q)?.trim() ?? "";
  return (
    <ContactListContent
      contacts={await searchContacts(query)}
      query={query}
      stage={parseStage(first(etape))}
      view={parseView(first(vue))}
    />
  );
}

/** Ce que montre la liste : les contacts trouvés, ou pourquoi il n'y en a pas. */
export function ContactListContent({
  contacts,
  query,
  stage = null,
  view = "liste",
}: {
  contacts: Contact[];
  query: string;
  stage?: Stage | null;
  view?: View;
}) {
  // Chaque liste vide dit pourquoi, et propose l'action qui la remplit (lot 11).
  if (contacts.length === 0 && query) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
        <SearchXIcon aria-hidden className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Aucun contact ne correspond à « {query} ».</p>
        <Link href={homeHref({ etape: stage, vue: view })} className={buttonVariants({ variant: "outline" })}>
          Effacer la recherche
        </Link>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
        <UsersIcon aria-hidden className="size-8 text-muted-foreground" />
        <p className="font-heading text-lg font-semibold">Ta liste est vide</p>
        <p className="text-sm text-muted-foreground">Ajoute ton premier contact pour commencer.</p>
        <AddContactDialog />
      </div>
    );
  }

  const shown = stage ? contacts.filter((c) => stageOf(c) === stage) : contacts;
  return (
    <section aria-label="Contacts" className="space-y-4">
      <StageFilter contacts={contacts} active={stage} query={query} view={view} />
      {shown.length === 0 && stage ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-10 text-center">
          <p className="text-sm text-muted-foreground">Aucun contact à l&apos;étape « {stageStyles[stage].label} ».</p>
          <Link href={homeHref({ q: query, vue: view })} className={buttonVariants({ variant: "outline" })}>
            Voir tous les contacts
          </Link>
        </div>
      ) : (
        <ContactsView contacts={shown} query={query} stage={stage} view={view} />
      )}
    </section>
  );
}

export function ContactListSkeleton() {
  return (
    <ul aria-busy className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <li key={i} className="h-40 animate-pulse rounded-lg border border-border bg-muted" />
      ))}
    </ul>
  );
}
