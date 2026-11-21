"use client";

import { useState, useTransition } from "react";
import { addNoteAction, type TrackingActionState } from "@/app/actions";
import { SAVE_FAILED_MESSAGE } from "@/components/contacts/texts";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Feedback = { field?: string; form?: string };

/** Ajouter une note datée sur la fiche d'un contact. */
export function NoteForm({ contactId }: { contactId: string }) {
  const [body, setBody] = useState("");
  const [feedback, setFeedback] = useState<Feedback>({});
  const [pending, startTransition] = useTransition();
  const id = `note-${contactId}`;

  return (
    <form
      className="grid gap-2"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const r: TrackingActionState | null = await addNoteAction(contactId, body).catch(() => null);
          if (!r) return setFeedback({ form: SAVE_FAILED_MESSAGE });
          if (!r.ok) return setFeedback({ field: r.error });
          setFeedback({});
          setBody("");
        });
      }}
    >
      <Label htmlFor={id}>Nouvelle note</Label>
      <Textarea
        id={id}
        name="body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Ce qui s'est dit, ce qu'il faut retenir…"
        rows={3}
        aria-invalid={feedback.field ? true : undefined}
        aria-describedby={feedback.field ? `${id}-error` : undefined}
      />
      {feedback.field && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {feedback.field}
        </p>
      )}
      {feedback.form && (
        <p role="alert" className="text-sm text-destructive">
          {feedback.form}
        </p>
      )}
      <div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Ajout…" : "Ajouter la note"}
        </Button>
      </div>
    </form>
  );
}
