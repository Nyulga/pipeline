import { connection } from "next/server";
import { UsersIcon } from "lucide-react";
import { ContactCard } from "@/components/contacts/contact-card";
import { listContacts } from "@/services/contacts";

/** Liste lue à chaque requête (jamais figée au build), rendue en flux sous un <Suspense>. */
export async function ContactList() {
  await connection();
  const contacts = await listContacts();

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
    <section aria-label="Contacts" className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {contacts.length} contact{contacts.length > 1 ? "s" : ""}
      </p>
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {contacts.map((c) => (
          <li key={c.id}>
            <ContactCard contact={c} />
          </li>
        ))}
      </ul>
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
