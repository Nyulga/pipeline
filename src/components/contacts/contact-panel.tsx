"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { XIcon } from "lucide-react";
import { consumePanelOpened } from "@/components/contacts/panel-history";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

/**
 * La fiche par-dessus la liste : monte du bas sur téléphone, s'ouvre à droite à partir de `md`.
 * Ouverte tant que l'adresse porte `?contact=` ; la fermer (Échap, « Fermer », clic à côté)
 * la retire de l'écran tout de suite, puis revient en arrière (ouverte depuis l'app)
 * ou remplace l'adresse (lien partagé, rechargement), sans faire défiler la liste.
 */
export function ContactPanel({ title, closeHref, children }: { title: string; closeHref: string; children?: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  function close() {
    setOpen(false);
    if (consumePanelOpened()) router.back();
    else router.replace(closeHref, { scroll: false });
  }

  return (
    <Sheet open={open} onOpenChange={(next) => !next && close()}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="max-h-[90dvh] overflow-y-auto rounded-t-3xl md:inset-x-auto! md:inset-y-0! md:right-0! md:bottom-auto! md:h-full! md:max-h-none! md:w-[28rem]! md:rounded-none! md:border-t-0! md:border-l! md:data-starting-style:translate-x-[2.5rem]! md:data-starting-style:translate-y-0! md:data-ending-style:translate-x-[2.5rem]! md:data-ending-style:translate-y-0!"
      >
        {/* En-tête collé en haut : « Fermer » reste à portée même après avoir fait défiler les notes. */}
        <SheetHeader className="sticky top-0 z-10 flex-row items-start justify-between gap-4 border-b border-border bg-popover">
          <SheetTitle className="text-2xl font-bold tracking-tight">{title}</SheetTitle>
          <SheetClose render={<Button variant="ghost" size="sm" />}>
            <XIcon data-icon="inline-start" />
            Fermer
          </SheetClose>
        </SheetHeader>
        <div className="px-4 pb-8">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
