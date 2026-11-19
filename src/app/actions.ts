"use server";

import { revalidatePath } from "next/cache";
import { addContact, type ContactErrors } from "@/services/contacts";

export type AddContactState = { ok: boolean; errors: ContactErrors };

const field = (fd: FormData, name: string) => {
  const v = fd.get(name);
  return typeof v === "string" ? v : null;
};

/** Ajoute un contact depuis le formulaire, puis rafraîchit la liste. */
export async function addContactAction(formData: FormData): Promise<AddContactState> {
  const result = await addContact({
    name: field(formData, "name"),
    company: field(formData, "company"),
    phone: field(formData, "phone"),
    email: field(formData, "email"),
  });
  if (!result.ok) return { ok: false, errors: result.errors };
  revalidatePath("/");
  return { ok: true, errors: {} };
}
