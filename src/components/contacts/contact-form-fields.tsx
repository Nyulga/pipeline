import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CONTACT_FIELDS, type ContactField } from "@/services/contact-model";

export type ContactFormValues = Record<ContactField, string>;

const FIELD_UI: Record<
  ContactField,
  { label: string; placeholder: string; type?: "tel" | "email"; autoFocus?: boolean }
> = {
  name: { label: "Nom *", placeholder: "Claire Martin", autoFocus: true },
  company: { label: "Entreprise", placeholder: "Atelier Nord" },
  phone: { label: "Téléphone", placeholder: "06 12 34 56 78", type: "tel" },
  email: { label: "E-mail", placeholder: "claire@exemple.fr", type: "email" },
};

/** Les champs du formulaire d'ajout, un par entrée de CONTACT_FIELDS, chacun avec son message d'erreur. */
export function ContactFormFields({
  values,
  errors,
  onChange,
}: {
  values: ContactFormValues;
  errors: Partial<Record<ContactField, string>>;
  onChange: (field: ContactField, value: string) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {CONTACT_FIELDS.map((field) => {
        const ui = FIELD_UI[field];
        const id = `contact-${field}`;
        const error = errors[field];
        return (
          <div key={field} className="grid gap-1.5">
            <Label htmlFor={id}>{ui.label}</Label>
            <Input
              id={id}
              name={field}
              type={ui.type}
              value={values[field]}
              onChange={(e) => onChange(field, e.target.value)}
              placeholder={ui.placeholder}
              autoComplete="off"
              autoFocus={ui.autoFocus}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-error` : undefined}
            />
            {error && (
              <p id={`${id}-error`} className="text-xs text-destructive">
                {error}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
