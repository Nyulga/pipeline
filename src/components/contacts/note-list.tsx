import { formatDateTime } from "@/components/contacts/texts";
import type { Note } from "@/services/notes";

/** Les notes d'un contact, dans l'ordre reçu (le service les donne des plus récentes aux plus anciennes). */
export function NoteList({ notes }: { notes: Note[] }) {
  // Le formulaire de note est juste au-dessus : c'est l'action qui remplit la liste (lot 11).
  if (notes.length === 0)
    return <p className="text-sm text-muted-foreground">Aucune note pour l&apos;instant. Écris la première ci-dessus.</p>;
  return (
    <ol className="space-y-3">
      {notes.map((n) => (
        <li key={n.id} className="space-y-1 rounded-md border border-border p-3">
          <time dateTime={n.createdAt} className="block font-mono text-xs text-muted-foreground">
            {formatDateTime(n.createdAt)}
          </time>
          <p className="whitespace-pre-wrap text-sm">{n.body}</p>
        </li>
      ))}
    </ol>
  );
}
