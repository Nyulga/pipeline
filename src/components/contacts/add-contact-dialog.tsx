"use client";

import { useActionState, useState } from "react";
import { PlusIcon } from "lucide-react";
import { addContactAction, type AddContactState } from "@/app/actions";
import { ContactFormFields, type ContactFormValues } from "@/components/contacts/contact-form-fields";
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
const INITIAL: AddContactState = { ok: false, errors: {} };

export function AddContactDialog() {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(EMPTY);

  const [state, formAction, pending] = useActionState(
    async (_prev: AddContactState, formData: FormData) => {
      const result = await addContactAction(formData);
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
