"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "cn";
import { markPanelOpened } from "@/components/contacts/panel-history";
import { TOUCH_TARGET } from "@/components/touch-target";

/** Lien qui ouvre la fiche dans le panneau, sans faire défiler la liste ; assez grand pour le doigt. */
export function PanelLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      className={cn(TOUCH_TARGET, className)}
      onClick={(e) => {
        // Ctrl / Cmd / Maj / clic du milieu : nouvel onglet, rien n'est ajouté à l'historique d'ici.
        if (!(e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0)) markPanelOpened();
      }}
    >
      {children}
    </Link>
  );
}
