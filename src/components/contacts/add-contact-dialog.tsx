"use client";

import { useActionState, useState } from "react";
import { PlusIcon } from "lucide-react";
import { addContactAction, type AddContactState } from "@/app/actions";
import { ContactFormFields, type ContactFormValues } from "@/components/contacts/contact-form-fields";
import { SAVE_FAILED_MESSAGE } from "@/components/contacts/texts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const EMPTY: ContactFormValues = { name: "", company: "", phone: "", email: "" };
/** État de la fenêtre : la réponse de l'action, plus un éventuel échec d'enregistrement. */
type DialogState = AddContactState & { formError?: string };

const INITIAL: DialogState = { ok: false, errors: {} };

/** Échec inattendu (réseau, base injoignable…) : la fenêtre reste ouverte, la saisie est gardée. */
const SAVE_FAILED: DialogState = { ok: false, errors: {}, formError: SAVE_FAILED_MESSAGE };

export function AddContactDialog() {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(EMPTY);

  const [state, formAction, pending] = useActionState(
    async (_prev: DialogState, formData: FormData): Promise<DialogState> => {
      const result = await addContactAction(formData).catch(() => SAVE_FAILED);
      if (result.ok) {
        setValues(EMPTY);
        setOpen(false);
      }
      return result;
    },
    INITIAL,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <PlusIcon data-icon="inline-start" />
        Ajouter un contact
      </DialogTrigger>
      <DialogContent>
        <form action={formAction} className="grid gap-4" noValidate>
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Nouveau contact</DialogTitle>
            <DialogDescription>Il sera créé « non appelé » et « en attente ».</DialogDescription>
          </DialogHeader>

          <ContactFormFields
            values={values}
            errors={state.ok ? {} : state.errors}
            onChange={(field, value) => setValues((v) => ({ ...v, [field]: value }))}
          />

          {state.formError && (
            <p role="alert" className="text-sm text-destructive">
              {state.formError}
            </p>
          )}

          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Annuler</DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Ajout…" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
