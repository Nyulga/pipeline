"use client";

import { MailIcon, PhoneIcon, PhoneOffIcon } from "lucide-react";
import { StatusBadge, statusStyles } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { RESPONSES, isContactResponse, type Contact, type ContactResponse } from "@/services/tracking";

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

export function ContactCard({
  contact: c,
  error,
  compact = false,
  onCalledChange,
  onResponseChange,
}: {
  contact: Contact;
  error?: string;
  compact?: boolean;
  onCalledChange: (called: boolean) => void;
  onResponseChange: (response: ContactResponse) => void;
}) {
  return (
    <Card className="h-full" size={compact ? "sm" : "default"}>
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
        {!compact && (c.phone || c.email) && (
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
          {!compact && (
            <span className="ml-auto text-xs text-muted-foreground">
              Ajouté le {dateFormat.format(new Date(c.createdAt))}
            </span>
          )}
        </div>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={c.called ? "outline" : "default"} onClick={() => onCalledChange(!c.called)}>
          {c.called ? <PhoneOffIcon data-icon="inline-start" /> : <PhoneIcon data-icon="inline-start" />}
          {c.called ? "Non appelé" : "Marquer appelé"}
        </Button>
        <ToggleGroup
          variant="outline"
          size="sm"
          spacing={0}
          value={[c.response]}
          onValueChange={(v) => isContactResponse(v[0]) && onResponseChange(v[0])}
          aria-label={`Réponse de ${c.name}`}
        >
          {RESPONSES.map((r) => (
            <ToggleGroupItem
              key={r}
              value={r}
              className="aria-pressed:bg-primary aria-pressed:text-primary-foreground data-pressed:bg-primary data-pressed:text-primary-foreground"
            >
              {statusStyles[r].label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </CardFooter>
    </Card>
  );
}
