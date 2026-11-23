"use client";

import { BellIcon, ChevronDownIcon, MailIcon, PhoneIcon } from "lucide-react";
import { cn } from "cn";
import { contactPanelHref, mailtoHref, telHref } from "@/components/contacts/contact-links";
import { PanelLink } from "@/components/contacts/panel-link";
import { formatDay } from "@/components/contacts/texts";
import { TOUCH_TARGET } from "@/components/touch-target";
import { StageBadge, stageStyles } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Contact } from "@/services/contact-model";
import { STAGES, parseStage, stageOf, type Stage } from "@/services/tracking";

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
  onStageChange,
  href,
}: {
  contact: Contact;
  error?: string;
  compact?: boolean;
  onStageChange: (stage: Stage) => void;
  /** Où mène le nom : le panneau de fiche (`/?contact=<id>`), en gardant recherche et filtre. */
  href?: string;
}) {
  const stage = stageOf(c);

  return (
    <Card className="h-full" size={compact ? "sm" : "default"}>
      <CardHeader>
        <div className="flex min-w-0 items-center gap-3">
          <div
            aria-hidden
            className="grid size-10 shrink-0 place-items-center rounded-full bg-accent font-heading text-sm font-semibold text-accent-foreground"
          >
            {initials(c.name)}
          </div>
          <div className="min-w-0">
            <CardTitle className="truncate font-heading text-lg">
              <PanelLink href={href ?? contactPanelHref({}, c.id)} className="max-w-full hover:underline">
                <span className="truncate">{c.name}</span>
              </PanelLink>
            </CardTitle>
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
                <a href={telHref(c.phone)} className={cn(TOUCH_TARGET, "hover:text-foreground")}>
                  {c.phone}
                </a>
              </li>
            )}
            {c.email && (
              <li className="flex min-w-0 items-center gap-1.5">
                <MailIcon aria-hidden className="size-3 shrink-0" />
                <a href={mailtoHref(c.email)} className={cn(TOUCH_TARGET, "min-w-0 hover:text-foreground")}>
                  <span className="block truncate">{c.email}</span>
                </a>
              </li>
            )}
          </ul>
        )}
        {!compact && (
          <p className="text-xs text-muted-foreground">Ajouté le {dateFormat.format(new Date(c.createdAt))}</p>
        )}
        {c.nextFollowUp && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <BellIcon aria-hidden className="size-3" />
            Relance le {formatDay(c.nextFollowUp)}
          </p>
        )}
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </CardContent>
      <CardFooter>
        {/* Un seul geste : le bouton montre l'étape, le menu permet d'en changer. */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                aria-label={
                  compact
                    ? `Changer d'étape de ${c.name} (${stageStyles[stage].label})`
                    : `Étape de ${c.name} : ${stageStyles[stage].label}`
                }
                className={cn("-ml-1 gap-1 px-1", compact && "text-muted-foreground")}
              />
            }
          >
            {compact ? <span>Changer d&apos;étape</span> : <StageBadge stage={stage} />}
            <ChevronDownIcon data-icon="inline-end" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuRadioGroup
              value={stage}
              onValueChange={(v) => {
                const next = parseStage(v);
                if (next) onStageChange(next);
              }}
            >
              {STAGES.map((s) => (
                <DropdownMenuRadioItem key={s} value={s} closeOnClick>
                  <span aria-hidden className={cn("size-2 rounded-full", stageStyles[s].dot)} />
                  {stageStyles[s].label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
