import { toast } from "sonner";

/** Durée du message « Annuler » : assez pour se rendre compte d'une erreur. */
export const UNDO_DURATION = 6000;

/** « Claire Martin : Refusé · Annuler » : un message court, avec de quoi revenir en arrière. */
export function showUndo(message: string, onUndo: () => void) {
  toast(message, { duration: UNDO_DURATION, action: { label: "Annuler", onClick: onUndo } });
}
