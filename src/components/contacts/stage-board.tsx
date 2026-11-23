import type { ReactNode } from "react";
import { cn } from "cn";
import { contactCount } from "@/components/contacts/texts";
import { stageStyles } from "@/components/status-badge";
import type { Contact } from "@/services/contact-model";
import { STAGES, groupByStage } from "@/services/tracking";

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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {STAGES.map((stage) => {
        const items = groups[stage];
        const style = stageStyles[stage];
        return (
          <section
            key={stage}
            data-stage={stage}
            aria-labelledby={`etape-${stage}`}
            className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-muted/40 p-3"
          >
            <h2 id={`etape-${stage}`} className="flex items-center gap-2 font-sans text-sm font-semibold">
              <span aria-hidden className={cn("size-2 rounded-full", style.dot)} />
              <span>{style.label}</span>
              <span
                aria-label={contactCount(items.length)}
                className="ml-auto rounded-full bg-background px-2 font-mono text-xs text-muted-foreground"
              >
                {items.length}
              </span>
            </h2>
            {items.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">Aucun contact</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {items.map((c) => (
                  <li key={c.id} aria-label={c.name} className="min-w-0">
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
