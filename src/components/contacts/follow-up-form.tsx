"use client";

import { useState, useTransition } from "react";
import { BellIcon } from "lucide-react";
import { setFollowUpAction, type TrackingActionState } from "@/app/actions";
import { SAVE_FAILED_MESSAGE, formatDay } from "@/components/contacts/texts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Feedback = { field?: string; form?: string };

/** La prochaine relance d'un contact, sur sa fiche : la voir, la fixer, l'effacer. */
export function FollowUpForm({ contactId, nextFollowUp }: { contactId: string; nextFollowUp: string | null }) {
  const [value, setValue] = useState(nextFollowUp ?? "");
  const [feedback, setFeedback] = useState<Feedback>({});
  const [pending, startTransition] = useTransition();
  const id = `relance-${contactId}`;

  function save(date: string) {
    startTransition(async () => {
      const r: TrackingActionState | null = await setFollowUpAction(contactId, date).catch(() => null);
      if (!r) return setFeedback({ form: SAVE_FAILED_MESSAGE });
      if (!r.ok) return setFeedback({ field: r.error });
      setFeedback({});
      setValue(date);
    });
  }

  return (
    <form
      className="grid gap-3"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        save(value);
      }}
    >
      <p className="flex items-center gap-1.5 text-sm">
        <BellIcon aria-hidden className="size-4 text-muted-foreground" />
        {nextFollowUp ? `Prochaine relance : ${formatDay(nextFollowUp)}` : "Aucune relance prévue"}
      </p>
      <div className="grid gap-1.5">
        <Label htmlFor={id}>Date de relance</Label>
        <Input
          id={id}
          name="nextFollowUp"
          type="date"
          className="w-fit"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={feedback.field ? true : undefined}
          aria-describedby={feedback.field ? `${id}-error` : undefined}
        />
        {feedback.field && (
          <p id={`${id}-error`} className="text-xs text-destructive">
            {feedback.field}
          </p>
        )}
      </div>
      {feedback.form && (
        <p role="alert" className="text-sm text-destructive">
          {feedback.form}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          Enregistrer
        </Button>
        {nextFollowUp && (
          <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => save("")}>
            Effacer
          </Button>
        )}
      </div>
    </form>
  );
}
