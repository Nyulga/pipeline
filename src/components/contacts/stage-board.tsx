import type { ReactNode } from "react";
import { cn } from "cn";
import { STAGES, groupByStage, type Contact, type Stage } from "@/services/tracking";

const stageDot: Record<Stage, string> = {
  aAppeler: "bg-muted-foreground",
  appeleEnAttente: "bg-warning",
  accepte: "bg-success",
  refuse: "bg-destructive",
};

/** La vue par étape : 4 colonnes, chacune avec son nombre de contacts. */
export function StageBoard({
  contacts,
  renderContact,
}: {
  contacts: readonly Contact[];
  renderContact: (contact: Contact) => ReactNode;
}) {
  const groups = groupByStage(contacts);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {STAGES.map((stage) => {
        const items = groups[stage.id];
        return (
          <section
            key={stage.id}
            data-stage={stage.id}
            aria-labelledby={`etape-${stage.id}`}
            className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-3"
          >
            <h2 id={`etape-${stage.id}`} className="flex items-center gap-2 font-sans text-sm font-semibold">
              <span aria-hidden className={cn("size-2 rounded-full", stageDot[stage.id])} />
              <span>{stage.label}</span>
              <span
                aria-label={`${items.length} contact${items.length > 1 ? "s" : ""}`}
                className="ml-auto rounded-sm bg-background px-1.5 font-mono text-xs text-muted-foreground"
              >
                {items.length}
              </span>
            </h2>
            {items.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">Aucun contact</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {items.map((c) => (
                  <li key={c.id} aria-label={c.name}>
                    {renderContact(c)}
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
