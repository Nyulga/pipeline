"use client";

import { useState, useTransition } from "react";
import { CheckIcon, ClockIcon, PhoneIcon, XIcon } from "lucide-react";
import { setCalledAction, setFollowUpAction, setResponseAction, type TrackingActionState } from "@/app/actions";
import { AddContactDialog } from "@/components/contacts/add-contact-dialog";
import { SAVE_FAILED_MESSAGE, toCallCount } from "@/components/contacts/texts";
import { FollowUpBadge, StageBadge } from "@/components/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { callQueue, nextDay, type QueueReason } from "@/services/call-queue";
import type { Contact, ContactResponse } from "@/services/contact-model";
import { markCalled, withResponse } from "@/services/tracking";

type Patch = Partial<Pick<Contact, "called" | "response" | "nextFollowUp">>;

/** Changements faits ici, appliqués par-dessus la liste reçue du serveur jusqu'à sa prochaine version. */
type Local = { base: Contact[]; patches: Record<string, Patch>; pinned: string | null };

const SAVE_FAILED: TrackingActionState = { ok: false, error: SAVE_FAILED_MESSAGE };

const REASON_BADGE: Record<QueueReason, React.ReactNode> = {
  enRetard: <FollowUpBadge state="enRetard" />,
  aujourdhui: <FollowUpBadge state="aujourdhui" />,
  jamaisAppele: <StageBadge stage="aAppeler" />,
};

/** Le numéro tel qu'un lien `tel:` l'attend : chiffres et « + » seulement. */
const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

/**
 * « À appeler maintenant » : la prochaine personne de la file, et de quoi noter l'appel.
 * Après « Appeler », la carte reste sur la personne jusqu'à l'issue (Accepté, Refusé, Plus tard).
 */
export function CallFocus({ contacts, today }: { contacts: Contact[]; today: string }) {
  const [local, setLocal] = useState<Local>({ base: contacts, patches: {}, pinned: null });
  const [error, setError] = useState<{ id: string; message: string } | null>(null);
  const [, startTransition] = useTransition();

  // Nouvelle liste du serveur : elle fait foi, les changements locaux sont repartis avec elle.
  let state = local;
  if (local.base !== contacts) {
    state = { base: contacts, patches: {}, pinned: local.pinned };
    setLocal(state);
  }

  const list = contacts.map((c) => (state.patches[c.id] ? { ...c, ...state.patches[c.id] } : c));
  const queue = callQueue(list, today);
  // La personne qu'on vient d'appeler reste affichée, même si l'appel l'a sortie de la file.
  const pinnedContact = list.find(
    (c) => c.id === state.pinned && c.response === "enAttente" && !(c.nextFollowUp && c.nextFollowUp > today),
  );
  const current = pinnedContact
    ? (queue.find((i) => i.contact.id === pinnedContact.id) ?? { contact: pinnedContact, reason: "jamaisAppele" as const })
    : queue[0];
  const others = queue.filter((i) => i.contact.id !== current?.contact.id);
  const next = others.slice(0, 3);

  function save(c: Contact, patch: Patch, pin: boolean, action: () => Promise<TrackingActionState>) {
    setError(null);
    setLocal((s) => ({
      ...s,
      patches: { ...s.patches, [c.id]: { ...s.patches[c.id], ...patch } },
      pinned: pin ? c.id : s.pinned === c.id ? null : s.pinned,
    }));
    startTransition(async () => {
      const r = await action().catch(() => SAVE_FAILED);
      if (r.ok) return;
      setLocal((s) => {
        const patches = { ...s.patches };
        delete patches[c.id];
        return { ...s, patches, pinned: c.id };
      });
      setError({ id: c.id, message: r.error });
    });
  }

  const call = (c: Contact) => save(c, markCalled(c), true, () => setCalledAction(c.id, true));
  const answer = (c: Contact, response: ContactResponse) =>
    save(c, withResponse(c, response), false, () => setResponseAction(c.id, response));
  const later = (c: Contact) => {
    const day = nextDay(today);
    save(c, { nextFollowUp: day }, false, () => setFollowUpAction(c.id, day));
  };

  return (
    <section aria-label="À appeler maintenant" className="space-y-3">
      <p className="text-lg font-semibold text-muted-foreground">{toCallCount(queue.length)}</p>

      {!current ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-3">
            <p className="text-muted-foreground">Personne à appeler pour l&apos;instant.</p>
            <AddContactDialog />
          </CardContent>
        </Card>
      ) : (
        <Card className="ring-2 ring-primary/20">
          <CardHeader className="gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-primary">À appeler maintenant</span>
              {current.contact.called ? <StageBadge stage="appeleEnAttente" /> : REASON_BADGE[current.reason]}
            </div>
            <h2 className="text-3xl font-bold tracking-tight">{current.contact.name}</h2>
            {current.contact.company && <p className="text-muted-foreground">{current.contact.company}</p>}
            {current.contact.phone && (
              <p className="font-mono text-sm text-muted-foreground">{current.contact.phone}</p>
            )}
          </CardHeader>
          {error?.id === current.contact.id && (
            <CardContent>
              <p role="alert" className="text-sm text-destructive">
                {error.message}
              </p>
            </CardContent>
          )}
          <CardFooter className="flex flex-wrap gap-2">
            {current.contact.phone ? (
              <a
                href={telHref(current.contact.phone)}
                onClick={() => call(current.contact)}
                className={buttonVariants({ size: "lg" })}
              >
                <PhoneIcon data-icon="inline-start" />
                Appeler
              </a>
            ) : (
              <Button size="lg" onClick={() => call(current.contact)}>
                <PhoneIcon data-icon="inline-start" />
                Marquer appelé
              </Button>
            )}
            <Button size="lg" variant="secondary" onClick={() => answer(current.contact, "accepte")}>
              <CheckIcon data-icon="inline-start" />
              Accepté
            </Button>
            <Button size="lg" variant="secondary" onClick={() => answer(current.contact, "refuse")}>
              <XIcon data-icon="inline-start" />
              Refusé
            </Button>
            <Button size="lg" variant="ghost" onClick={() => later(current.contact)}>
              <ClockIcon data-icon="inline-start" />
              Plus tard
            </Button>
          </CardFooter>
        </Card>
      )}

      {next.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Ensuite : {next.map((i) => i.contact.name).join(", ")}
          {others.length > next.length ? "…" : ""}
        </p>
      )}
    </section>
  );
}
