import { connection } from "next/server";
import { contactPanelHref, type HomeParams } from "@/components/contacts/contact-links";
import { PanelLink } from "@/components/contacts/panel-link";
import { FOLLOW_UP_HINT, formatDay } from "@/components/contacts/texts";
import { Card, CardContent } from "@/components/ui/card";
import { getWeekSummary, type WeekSummary } from "@/services/week";

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <Card size="sm">
      <CardContent>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold tracking-tight tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

/** « Ta semaine » : appels passés depuis lundi, taux d'acceptation, relances des 7 prochains jours. */
export function WeekSummaryView({ summary, linkParams = {} }: { summary: WeekSummary; linkParams?: HomeParams }) {
  const { callsThisWeek, acceptanceRate, upcoming } = summary;
  return (
    <section aria-labelledby="ta-semaine" className="space-y-4">
      <h2 id="ta-semaine" className="text-2xl font-bold tracking-tight">
        Ta semaine
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <Figure label="Appels passés" value={String(callsThisWeek)} />
        <Figure label="Taux d'acceptation" value={acceptanceRate === null ? "—" : `${acceptanceRate} %`} />
        <Figure label="Relances à venir" value={String(upcoming.length)} />
      </div>
      {upcoming.length === 0 ? (
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>Aucune relance prévue ces 7 prochains jours.</p>
          <p>{FOLLOW_UP_HINT}</p>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {upcoming.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <PanelLink href={contactPanelHref(linkParams, c.id)} className="font-medium hover:underline">
                {c.name}
              </PanelLink>
              <span className="text-sm text-muted-foreground">{formatDay(c.nextFollowUp!)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Lue à chaque requête : la semaine et « aujourd'hui » sont ceux de Paris, au moment de la demande. */
export async function WeekSummarySection({ linkParams }: { linkParams?: Promise<HomeParams> }) {
  await connection();
  return <WeekSummaryView summary={await getWeekSummary(new Date())} linkParams={await linkParams} />;
}

export function WeekSummarySkeleton() {
  return <div aria-busy className="h-40 animate-pulse rounded-xl border border-border bg-muted" />;
}
