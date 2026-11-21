import { connection } from "next/server";
import { SearchXIcon, UsersIcon } from "lucide-react";
import { ContactsView } from "@/components/contacts/contacts-view";
import { searchContacts, type Contact } from "@/services/contacts";

/** Liste lue à chaque requête (jamais figée au build), filtrée par la recherche, rendue sous un <Suspense>. */
export async function ContactList({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  await connection();
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
  return <ContactListContent contacts={await searchContacts(query)} query={query} />;
}

/** Ce que montre la liste : les contacts trouvés, ou pourquoi il n'y en a pas. */
export function ContactListContent({ contacts, query }: { contacts: Contact[]; query: string }) {
  if (contacts.length === 0 && query) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
        <SearchXIcon aria-hidden className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Aucun contact ne correspond à « {query} ».</p>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
        <UsersIcon aria-hidden className="size-8 text-muted-foreground" />
        <p className="font-heading text-lg font-semibold">Ta liste est vide</p>
        <p className="text-sm text-muted-foreground">Ajoute ton premier contact pour commencer.</p>
      </div>
    );
  }

  return (
    <section aria-label="Contacts">
      <ContactsView contacts={contacts} />
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
