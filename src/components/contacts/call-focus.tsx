"use client";

import { useRef, useState, useTransition } from "react";
import { CheckIcon, ClockIcon, PhoneIcon, XIcon } from "lucide-react";
import { setFollowUpAction, setStageAction, type TrackingActionState } from "@/app/actions";
import { AddContactDialog } from "@/components/contacts/add-contact-dialog";
import { SAVE_FAILED_MESSAGE, toCallCount } from "@/components/contacts/texts";
import { showUndo } from "@/components/contacts/undo-toast";
import { FollowUpBadge, StageBadge, stageStyles } from "@/components/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { callQueue, nextDay, type QueueReason } from "@/services/call-queue";
import type { Contact } from "@/services/contact-model";
import { stageOf, trackingForStage, type Stage } from "@/services/tracking";

type Patch = Partial<Pick<Contact, "called" | "response" | "nextFollowUp">>;

/** Un changement fait ici ; `settled` une fois son action terminée avec succès. */
type Entry = { seq: number; id: string; patch: Patch; settled: boolean };

/**
 * Changements faits ici, appliqués dans l'ordre par-dessus la liste reçue du serveur.
 * Un changement enregistré disparaît à la version suivante de la liste (elle le contient) ;
 * un changement encore en cours y survit, pour que la carte ne change pas sous le doigt.
 */
type Local = { base: Contact[]; entries: Entry[]; pinned: string | null };

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
  const [local, setLocal] = useState<Local>({ base: contacts, entries: [], pinned: null });
  const seq = useRef(0);
  const [error, setError] = useState<{ id: string; message: string } | null>(null);
  const [, startTransition] = useTransition();

  // Nouvelle liste du serveur : elle fait foi pour tout ce qui est déjà enregistré.
  let state = local;
  if (local.base !== contacts) {
    state = { ...local, base: contacts, entries: local.entries.filter((e) => !e.settled) };
    setLocal(state);
  }

  const list = contacts.map((c) =>
    state.entries.reduce((acc, e) => (e.id === c.id ? { ...acc, ...e.patch } : acc), c),
  );
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

  function save(
    c: Contact,
    patch: Patch,
    pin: boolean,
    action: () => Promise<TrackingActionState>,
    onSaved?: () => void,
  ) {
    const n = ++seq.current;
    setError(null);
    setLocal((s) => ({
      ...s,
      entries: [...s.entries, { seq: n, id: c.id, patch, settled: false }],
      pinned: pin ? c.id : s.pinned === c.id ? null : s.pinned,
    }));
    startTransition(async () => {
      const r = await action().catch(() => SAVE_FAILED);
      if (r.ok) {
        setLocal((s) => ({ ...s, entries: s.entries.map((e) => (e.seq === n ? { ...e, settled: true } : e)) }));
        onSaved?.();
        return;
      }
      // Seul ce changement est annulé : ceux qui ont réussi avant lui restent.
      setLocal((s) => ({ ...s, entries: s.entries.filter((e) => e.seq !== n), pinned: c.id }));
      setError({ id: c.id, message: r.error });
    });
  }

  /** Change l'étape ; une fois enregistrée, « Annuler » remet l'étape d'avant (la personne revient dans la file). */
  function moveTo(c: Contact, stage: Stage, pin: boolean) {
    const before = stageOf(c);
    save(
      c,
      trackingForStage(stage),
      pin,
      () => setStageAction(c.id, stage),
      () =>
        showUndo(`${c.name} : ${stageStyles[stage].label}`, () =>
          save(c, trackingForStage(before), false, () => setStageAction(c.id, before)),
        ),
    );
  }

  const call = (c: Contact) => moveTo(c, "appeleEnAttente", true);
  const answer = (c: Contact, stage: "accepte" | "refuse") => moveTo(c, stage, false);
  const later = (c: Contact) => {
    const day = nextDay(today);
    const before = c.nextFollowUp;
    save(
      c,
      { nextFollowUp: day },
      false,
      () => setFollowUpAction(c.id, day),
      () =>
        showUndo(`${c.name} : relance demain`, () =>
          save(c, { nextFollowUp: before }, false, () => setFollowUpAction(c.id, before ?? "")),
        ),
    );
  };

  return (
    <section aria-label="À appeler maintenant" className="space-y-3">
      <p className="text-lg font-semibold text-muted-foreground">{toCallCount(others.length + (current ? 1 : 0))}</p>

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
