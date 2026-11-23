import { toast } from "sonner";

/** Durée du message « Annuler » : assez pour se rendre compte d'une erreur. */
export const UNDO_DURATION = 6000;

/**
 * « Claire Martin : Refusé · Annuler » : un message court, avec de quoi revenir en arrière.
 * Un seul message par contact (`contactId`) : un nouveau geste remplace le précédent, dont l'« Annuler » serait périmé.
 */
export function showUndo(contactId: string, message: string, onUndo: () => void) {
  toast(message, { id: undoId(contactId), duration: UNDO_DURATION, action: { label: "Annuler", onClick: onUndo } });
}

/** Retire le message « Annuler » d'un contact : un nouveau geste le rend périmé. */
export function dismissUndo(contactId: string) {
  toast.dismiss(undoId(contactId));
}

const undoId = (contactId: string) => `annuler-${contactId}`;
