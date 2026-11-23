import { connection } from "next/server";
import { contactPanelHref, type HomeParams } from "@/components/contacts/contact-links";
import { PanelLink } from "@/components/contacts/panel-link";
import { FOLLOW_UP_HINT, formatDay } from "@/components/contacts/texts";
import { FollowUpBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listDueFollowUps, type DueFollowUp } from "@/services/contacts";

const TITLE = "À relancer aujourd'hui";

/** La liste « À relancer aujourd'hui », telle qu'affichée. */
export function DueFollowUpList({ items, linkParams = {} }: { items: DueFollowUp[]; linkParams?: HomeParams }) {
  return (
    <section aria-labelledby="a-relancer">
      <Card size="sm">
        <CardHeader>
          <CardTitle id="a-relancer" className="font-heading text-lg">
            {TITLE}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Personne à relancer aujourd&apos;hui.</p>
              <p>{FOLLOW_UP_HINT}</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map(({ contact: c, state }) => (
                <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                  <PanelLink href={contactPanelHref(linkParams, c.id)} className="font-medium hover:underline">
                    {c.name}
                  </PanelLink>
                  {c.company && <span className="text-sm text-muted-foreground">{c.company}</span>}
                  <span className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Prévue le {formatDay(c.nextFollowUp!)}</span>
                    <FollowUpBadge state={state} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

/** Lue à chaque requête : « aujourd'hui » est calculé au moment où la page est demandée. */
export async function DueFollowUps({ linkParams }: { linkParams?: Promise<HomeParams> }) {
  await connection();
  return <DueFollowUpList items={await listDueFollowUps(new Date())} linkParams={await linkParams} />;
}

export function DueFollowUpsSkeleton() {
  return <div aria-busy className="h-28 animate-pulse rounded-lg border border-border bg-muted" />;
}
