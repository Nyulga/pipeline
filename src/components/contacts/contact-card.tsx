import { MailIcon, PhoneIcon } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Contact } from "@/services/contacts";

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Paris",
});

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ContactCard({ contact: c }: { contact: Contact }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div
            aria-hidden
            className="grid size-10 shrink-0 place-items-center rounded-sm bg-secondary font-heading text-sm font-semibold text-secondary-foreground"
          >
            {initials(c.name)}
          </div>
          <div className="min-w-0">
            <CardTitle className="truncate font-heading text-lg">{c.name}</CardTitle>
            <CardDescription className="truncate">{c.company ?? "Sans entreprise"}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {(c.phone || c.email) && (
          <ul className="space-y-1 font-mono text-xs text-muted-foreground">
            {c.phone && (
              <li className="flex items-center gap-1.5">
                <PhoneIcon aria-hidden className="size-3" />
                <a href={`tel:${c.phone.replace(/\s+/g, "")}`} className="hover:text-foreground">
                  {c.phone}
                </a>
              </li>
            )}
            {c.email && (
              <li className="flex min-w-0 items-center gap-1.5">
                <MailIcon aria-hidden className="size-3 shrink-0" />
                <a href={`mailto:${c.email}`} className="truncate hover:text-foreground">
                  {c.email}
                </a>
              </li>
            )}
          </ul>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={c.called ? "appele" : "nonAppele"} />
          <StatusBadge status={c.response} />
          <span className="ml-auto text-xs text-muted-foreground">
            Ajouté le {dateFormat.format(new Date(c.createdAt))}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
