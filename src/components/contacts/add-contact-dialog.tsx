"use client";

import { useActionState, useState } from "react";
import { PlusIcon } from "lucide-react";
import { addContactAction, type AddContactState } from "@/app/actions";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMPTY = { name: "", company: "", phone: "", email: "" };
const INITIAL: AddContactState = { ok: false, errors: {} };

type FieldName = keyof typeof EMPTY;

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

  const errors = state.ok ? {} : state.errors;

  const fieldProps = (name: FieldName) => ({
    id: `contact-${name}`,
    name,
    value: values[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [name]: e.target.value })),
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `contact-${name}-error` : undefined,
  });

  const errorFor = (name: FieldName) =>
    errors[name] && (
      <p id={`contact-${name}-error`} className="text-xs text-destructive">
        {errors[name]}
      </p>
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="contact-name">Nom *</Label>
              <Input {...fieldProps("name")} placeholder="Claire Martin" autoComplete="off" autoFocus />
              {errorFor("name")}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="contact-company">Entreprise</Label>
              <Input {...fieldProps("company")} placeholder="Atelier Nord" autoComplete="off" />
              {errorFor("company")}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="contact-phone">Téléphone</Label>
              <Input {...fieldProps("phone")} type="tel" placeholder="06 12 34 56 78" autoComplete="off" />
              {errorFor("phone")}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="contact-email">E-mail</Label>
              <Input {...fieldProps("email")} type="email" placeholder="claire@exemple.fr" autoComplete="off" />
              {errorFor("email")}
            </div>
          </div>

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
