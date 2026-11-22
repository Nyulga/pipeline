"use client";

import { useOptimistic, useState, useTransition } from "react";
import { setStageAction, type TrackingActionState } from "@/app/actions";
import { ContactCard } from "@/components/contacts/contact-card";
import { StageBoard } from "@/components/contacts/stage-board";
import { SAVE_FAILED_MESSAGE, contactCount } from "@/components/contacts/texts";
import { showUndo } from "@/components/contacts/undo-toast";
import { stageStyles } from "@/components/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Contact } from "@/services/contact-model";
import { stageOf, trackingForStage, type Stage, type Tracking } from "@/services/tracking";

type Patch = { id: string; tracking: Tracking };

/** Échec inattendu (réseau, base injoignable…) : la page reste là, la carte le signale. */
const SAVE_FAILED: TrackingActionState = { ok: false, error: SAVE_FAILED_MESSAGE };

export function ContactsView({ contacts }: { contacts: Contact[] }) {
  // Mise à jour optimiste avec les mêmes règles que le service ; le serveur reste la référence.
  const [optimistic, applyOptimistic] = useOptimistic(contacts, (list: Contact[], p: Patch) =>
    list.map((c) => (c.id === p.id ? { ...c, ...p.tracking } : c)),
  );
  const [, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  /** Place le contact à une étape ; `undoable` : proposer « Annuler » une fois enregistré. */
  function changeStage(c: Contact, stage: Stage, undoable = true) {
    const before = stageOf(c);
    if (stage === before) return;
    startTransition(async () => {
      applyOptimistic({ id: c.id, tracking: trackingForStage(stage) });
      // La mise à jour optimiste s'annule d'elle-même à la fin de la transition si rien n'a changé côté serveur.
      const r = await setStageAction(c.id, stage).catch(() => SAVE_FAILED);
      setErrors((prev) => {
        const next = { ...prev };
        delete next[c.id];
        if (!r.ok) next[c.id] = r.error;
        return next;
      });
      if (r.ok && undoable) {
        const now = { ...c, ...trackingForStage(stage) };
        showUndo(`${c.name} : ${stageStyles[stage].label}`, () => changeStage(now, before, false));
      }
    });
  }

  const card = (c: Contact, compact = false) => (
    <ContactCard
      contact={c}
      compact={compact}
      error={errors[c.id]}
      onStageChange={(stage) => changeStage(c, stage)}
    />
  );

  return (
    <Tabs defaultValue="liste" className="gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {contactCount(optimistic.length)}
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
