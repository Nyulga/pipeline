import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { BackToContacts } from "@/components/contacts/back-to-contacts";
import { ContactDetails } from "@/components/contacts/contact-details";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getContactSheet } from "@/services/contact-sheet";

/** Fiche d'un contact : lue à chaque requête, rendue en flux sous un <Suspense>. */
export default function ContactPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-12">
      <BackToContacts />
      <Suspense fallback={<div aria-busy className="h-64 animate-pulse rounded-lg border border-border bg-muted" />}>
        <ContactSheet params={params} />
      </Suspense>
    </main>
  );
}

async function ContactSheet({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const sheet = await getContactSheet(id);
  if (!sheet) notFound();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-3xl">
          <h1>{sheet.contact.name}</h1>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ContactDetails contact={sheet.contact} notes={sheet.notes} />
      </CardContent>
    </Card>
  );
}
