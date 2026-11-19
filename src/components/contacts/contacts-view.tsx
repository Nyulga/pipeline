"use client";

import { useOptimistic, useState, useTransition } from "react";
import { setCalledAction, setResponseAction, type TrackingActionState } from "@/app/actions";
import { ContactCard } from "@/components/contacts/contact-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "cn";
import {
  STAGES,
  groupByStage,
  markCalled,
  markNotCalled,
  withResponse,
  type Contact,
  type ContactResponse,
  type Stage,
  type Tracking,
} from "@/services/tracking";

const stageDot: Record<Stage, string> = {
  aAppeler: "bg-muted-foreground",
  appeleEnAttente: "bg-warning",
  accepte: "bg-success",
  refuse: "bg-destructive",
};

type Patch = { id: string; tracking: Tracking };

export function ContactsView({ contacts }: { contacts: Contact[] }) {
  // Mise à jour optimiste avec les mêmes règles que le service ; le serveur reste la référence.
  const [optimistic, applyOptimistic] = useOptimistic(contacts, (list: Contact[], p: Patch) =>
    list.map((c) => (c.id === p.id ? { ...c, ...p.tracking } : c)),
  );
  const [, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update(c: Contact, tracking: Tracking, save: () => Promise<TrackingActionState>) {
    startTransition(async () => {
      applyOptimistic({ id: c.id, tracking });
      const r = await save();
      setErrors((prev) => {
        const next = { ...prev };
        delete next[c.id];
        if (!r.ok) next[c.id] = r.error;
        return next;
      });
    });
  }

  const card = (c: Contact, compact = false) => (
    <ContactCard
      contact={c}
      compact={compact}
      error={errors[c.id]}
      onCalledChange={(called) =>
        update(c, called ? markCalled(c) : markNotCalled(), () => setCalledAction(c.id, called))
      }
      onResponseChange={(response: ContactResponse) =>
        update(c, withResponse(c, response), () => setResponseAction(c.id, response))
      }
    />
  );

  const groups = groupByStage(optimistic);

  return (
    <Tabs defaultValue="liste" className="gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {optimistic.length} contact{optimistic.length > 1 ? "s" : ""}
        </p>
        <TabsList>
          <TabsTrigger value="liste">Liste</TabsTrigger>
          <TabsTrigger value="etapes">Par étape</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="liste">
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {optimistic.map((c) => (
            <li key={c.id}>{card(c)}</li>
          ))}
        </ul>
      </TabsContent>

      <TabsContent value="etapes">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STAGES.map((stage) => (
            <section
              key={stage.id}
              aria-labelledby={`etape-${stage.id}`}
              className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-3"
            >
              <h2 id={`etape-${stage.id}`} className="flex items-center gap-2 font-sans text-sm font-semibold">
                <span aria-hidden className={cn("size-2 rounded-full", stageDot[stage.id])} />
                {stage.label}
                <span className="ml-auto rounded-sm bg-background px-1.5 font-mono text-xs text-muted-foreground">
                  {groups[stage.id].length}
                </span>
              </h2>
              {groups[stage.id].length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">Aucun contact</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {groups[stage.id].map((c) => (
                    <li key={c.id}>{card(c, true)}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
