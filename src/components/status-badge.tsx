import { Badge } from "@/components/ui/badge";
import { cn } from "cn";

export type CallStatus = "appele" | "nonAppele";
export type Response = "accepte" | "refuse" | "enAttente";
export type Status = CallStatus | Response;

export const statusStyles: Record<Status, { label: string; className: string }> = {
  appele: { label: "Appelé", className: "bg-info-muted text-info" },
  nonAppele: { label: "Non appelé", className: "bg-muted text-muted-foreground" },
  accepte: { label: "Accepté", className: "bg-success-muted text-success" },
  refuse: { label: "Refusé", className: "bg-destructive/10 text-destructive" },
  enAttente: { label: "En attente", className: "bg-warning-muted text-warning" },
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
