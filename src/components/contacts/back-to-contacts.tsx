import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { cn } from "cn";
import { TOUCH_TARGET } from "@/components/touch-target";

/** Lien de retour à l'accueil, en haut de la page de fiche ; assez grand pour le doigt. */
export function BackToContacts() {
  return (
    <Link
      href="/"
      className={cn(TOUCH_TARGET, "inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground")}
    >
      <ArrowLeftIcon aria-hidden className="size-4" />
      Mes contacts
    </Link>
  );
}
