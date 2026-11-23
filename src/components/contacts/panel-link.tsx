"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { markPanelOpened } from "@/components/contacts/panel-history";

/** Lien qui ouvre la fiche dans le panneau, sans faire défiler la liste. */
export function PanelLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      className={className}
      onClick={(e) => {
        // Ctrl / Cmd / Maj / clic du milieu : nouvel onglet, rien n'est ajouté à l'historique d'ici.
        if (!(e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0)) markPanelOpened();
      }}
    >
      {children}
    </Link>
  );
}
