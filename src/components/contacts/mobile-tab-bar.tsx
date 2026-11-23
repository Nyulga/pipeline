"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ColumnsIcon, SunIcon, UsersIcon, type LucideIcon } from "lucide-react";
import { cn } from "cn";
import { homeHref, parseView } from "@/components/contacts/contact-links";
import { buttonVariants } from "@/components/ui/button";

type Tab = "aujourdhui" | "contacts" | "etapes";

/**
 * Barre d'onglets du téléphone (lot 11), fixée en bas, masquée à partir de `md`.
 * Les onglets mènent aux sections de l'accueil ; recherche et filtre sont gardés.
 * L'onglet en cours suit le dernier touché, et la vue « Par étape » de l'adresse (pas le défilement).
 */
export function MobileTabBar() {
  const params = useSearchParams();
  const q = params.get("q");
  const etape = params.get("etape");
  const vue = parseView(params.get("vue"));
  // Section choisie dans la barre ; « Aujourd'hui » à l'arrivée sur la page.
  const [section, setSection] = useState<"aujourdhui" | "contacts">("aujourdhui");
  const current: Tab = section === "aujourdhui" ? "aujourdhui" : vue === "etapes" ? "etapes" : "contacts";

  const tabs: { id: Tab; label: string; href: string; icon: LucideIcon }[] = [
    { id: "aujourdhui", label: "Aujourd'hui", href: `${homeHref({ q, etape, vue })}#aujourdhui`, icon: SunIcon },
    { id: "contacts", label: "Contacts", href: `${homeHref({ q, etape })}#mes-contacts`, icon: UsersIcon },
    { id: "etapes", label: "Étapes", href: `${homeHref({ q, etape, vue: "etapes" })}#mes-contacts`, icon: ColumnsIcon },
  ];

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-3">
        {tabs.map(({ id, label, href, icon: Icon }) => {
          const active = id === current;
          return (
            <li key={id}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={() => setSection(id === "aujourdhui" ? "aujourdhui" : "contacts")}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "h-auto min-h-11 w-full flex-col gap-0.5 rounded-none py-2 text-xs text-muted-foreground",
                  active && "text-primary hover:text-primary",
                )}
              >
                <Icon aria-hidden className="size-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
