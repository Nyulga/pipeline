import Link from "next/link";
import { cn } from "cn";
import { homeHref, type View } from "@/components/contacts/contact-links";
import { stageStyles } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import type { Contact } from "@/services/contact-model";
import { STAGES, groupByStage, type Stage } from "@/services/tracking";

/** Les pastilles « Tous · À appeler · … », chacune avec son nombre ; le filtre vit dans l'adresse. */
export function StageFilter({
  contacts,
  active,
  query,
  view = "liste",
}: {
  contacts: readonly Contact[];
  active: Stage | null;
  query: string;
  /** Vue en cours : gardée par chaque pastille. */
  view?: View;
}) {
  const groups = groupByStage(contacts);
  const pills: { stage: Stage | null; label: string; count: number; dot?: string }[] = [
    { stage: null, label: "Tous", count: contacts.length },
    ...STAGES.map((s) => ({ stage: s, label: stageStyles[s].label, count: groups[s].length, dot: stageStyles[s].dot })),
  ];

  return (
    <nav aria-label="Filtrer par étape" className="flex flex-wrap gap-2">
      {pills.map((p) => {
        const isActive = p.stage === active;
        return (
          <Link
            key={p.stage ?? "tous"}
            href={homeHref({ q: query, etape: p.stage, vue: view })}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              buttonVariants({ variant: isActive ? "default" : "outline", size: "sm" }),
              "rounded-full",
            )}
          >
            {p.dot && <span aria-hidden className={cn("size-2 rounded-full", p.dot)} />}
            {p.label}
            <span className={cn("rounded-full px-1.5 font-mono text-xs", isActive ? "bg-primary-foreground/20" : "bg-muted")}>
              {p.count}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
