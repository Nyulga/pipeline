"use client";

import { useOptimistic, useState, useTransition } from "react";
import { setCalledAction, setResponseAction, type TrackingActionState } from "@/app/actions";
import { ContactCard } from "@/components/contacts/contact-card";
import { StageBoard } from "@/components/contacts/stage-board";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  markCalled,
  markNotCalled,
  withResponse,
  type Contact,
  type ContactResponse,
  type Tracking,
} from "@/services/tracking";

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
            <li key={c.id} aria-label={c.name}>
              {card(c)}
            </li>
          ))}
        </ul>
      </TabsContent>

      <TabsContent value="etapes">
        <StageBoard contacts={optimistic} renderContact={(c) => card(c, true)} />
      </TabsContent>
    </Tabs>
  );
}
