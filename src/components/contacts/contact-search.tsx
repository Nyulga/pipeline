import Link from "next/link";
import { SearchIcon } from "lucide-react";
import { cn } from "cn";
import { homeHref, type View } from "@/components/contacts/contact-links";
import { TOUCH_TARGET } from "@/components/touch-target";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Stage } from "@/services/tracking";

/**
 * Recherche envoyée en GET sur l'accueil (`/?q=…`) : marche sans JavaScript,
 * l'URL se partage et le bouton « retour » du navigateur la garde.
 */
export function ContactSearch({
  query,
  stage = null,
  view = "liste",
}: {
  query: string;
  stage?: Stage | null;
  view?: View;
}) {
  return (
    <form role="search" action="/" method="get" className="flex flex-wrap items-center gap-2">
      {/* Le filtre d'étape et la vue en cours voyagent avec la recherche. */}
      {stage && <input type="hidden" name="etape" value={stage} />}
      {view === "etapes" && <input type="hidden" name="vue" value="etapes" />}
      <Label htmlFor="recherche" className="sr-only">
        Rechercher
      </Label>
      <Input
        // Champ non contrôlé : la clé le recrée quand la recherche change (ex. « Effacer la recherche »).
        key={query}
        id="recherche"
        name="q"
        type="search"
        defaultValue={query}
        placeholder="Nom, entreprise, téléphone, e-mail, note…"
        className="w-full sm:w-80"
      />
      <Button type="submit" variant="outline" size="sm">
        <SearchIcon data-icon="inline-start" />
        Chercher
      </Button>
      {query && (
        <Link
          href={homeHref({ etape: stage, vue: view })}
          className={cn(TOUCH_TARGET, "text-sm text-muted-foreground hover:text-foreground")}
        >
          Effacer la recherche
        </Link>
      )}
    </form>
  );
}
