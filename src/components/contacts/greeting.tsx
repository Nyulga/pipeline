import { formatGreetingDate } from "@/components/contacts/texts";

/** En-tête de l'accueil : « Bonjour » et la date du jour, à l'heure de Paris. */
export function Greeting({ now }: { now: Date }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-semibold text-primary first-letter:uppercase">{formatGreetingDate(now)}</p>
      <h1 className="text-4xl font-bold tracking-tight">Bonjour</h1>
    </div>
  );
}
