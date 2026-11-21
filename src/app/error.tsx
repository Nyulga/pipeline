"use client"; // Les error boundaries sont des composants client.

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/** Filet de sécurité : une erreur inattendue n'emporte pas l'app, on peut réessayer. */
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Quelque chose s&apos;est mal passé</h1>
      <p className="text-sm text-muted-foreground">
        L&apos;action n&apos;a pas pu aboutir. Tes contacts enregistrés ne sont pas perdus.
      </p>
      <Button onClick={() => retry()}>Réessayer</Button>
    </main>
  );
}
