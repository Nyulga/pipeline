import { Badge } from "@/components/ui/badge";
import { cn } from "cn";
import type { ContactResponse } from "@/services/contact-model";
import type { FollowUpState } from "@/services/follow-up";
import type { Stage } from "@/services/tracking";

export type CallStatus = "appele" | "nonAppele";
export type Status = CallStatus | ContactResponse;

/** Libellé et couleurs de chaque statut de suivi (appel, réponse). */
export const statusStyles: Record<Status, { label: string; className: string }> = {
  appele: { label: "Appelé", className: "bg-info-muted text-info" },
  nonAppele: { label: "Non appelé", className: "bg-muted text-muted-foreground" },
  accepte: { label: "Accepté", className: "bg-success-muted text-success" },
  refuse: { label: "Refusé", className: "bg-destructive/10 text-destructive" },
  enAttente: { label: "En attente", className: "bg-warning-muted text-warning" },
};

/** Libellé et couleurs de chaque étape (l'ordre des étapes vient du service : STAGES). */
export const stageStyles: Record<Stage, { label: string; className: string; dot: string }> = {
  aAppeler: { label: "À appeler", className: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  appeleEnAttente: { label: "Appelé · en attente", className: "bg-warning-muted text-warning", dot: "bg-warning" },
  accepte: { label: "Accepté", className: "bg-success-muted text-success", dot: "bg-success" },
  refuse: { label: "Refusé", className: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
};

/** Libellé et couleurs de l'état d'une relance à faire. */
export const followUpStyles: Record<FollowUpState, { label: string; className: string }> = {
  aujourdhui: { label: "Aujourd'hui", className: "bg-warning-muted text-warning" },
  enRetard: { label: "En retard", className: "bg-destructive/10 text-destructive" },
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const style = statusStyles[status];
  return (
    <Badge className={cn("rounded-sm", style.className, className)}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {style.label}
    </Badge>
  );
}

export function StageBadge({ stage, className }: { stage: Stage; className?: string }) {
  const style = stageStyles[stage];
  return (
    <Badge className={cn("rounded-sm", style.className, className)}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {style.label}
    </Badge>
  );
}

export function FollowUpBadge({ state, className }: { state: FollowUpState; className?: string }) {
  const style = followUpStyles[state];
  return (
    <Badge className={cn("rounded-sm", style.className, className)}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {style.label}
    </Badge>
  );
}
