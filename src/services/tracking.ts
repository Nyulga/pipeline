// Règles de suivi d'un contact : fonctions pures, sans accès à la base.
// Ce module peut donc être importé partout, y compris par un composant client
// (mise à jour optimiste), sans embarquer la couche données.
// Les libellés et les couleurs des étapes relèvent de la présentation (design system).

import type { Contact, ContactResponse } from "@/services/contact-model";

/** Le suivi d'un contact : ce que les règles lisent et produisent. */
export type Tracking = Pick<Contact, "called" | "response">;

export type Stage = "aAppeler" | "appeleEnAttente" | "accepte" | "refuse";

/** Les étapes, dans l'ordre du parcours de prospection. */
export const STAGES: readonly Stage[] = ["aAppeler", "appeleEnAttente", "accepte", "refuse"];

/** L'étape se déduit de appelé + réponse. */
export function stageOf({ called, response }: Tracking): Stage {
  if (response === "accepte") return "accepte";
  if (response === "refuse") return "refuse";
  return called ? "appeleEnAttente" : "aAppeler";
}

/** Marquer appelé garde la réponse. */
export function markCalled(t: Tracking): Tracking {
  return { called: true, response: t.response };
}

/** Repasser en « non appelé » remet la réponse à « en attente ». */
export function markNotCalled(): Tracking {
  return { called: false, response: "enAttente" };
}

/**
 * L'appel et la réponse d'une étape : l'inverse exact de stageOf.
 * Revenir à l'étape d'avant redonne donc exactement le suivi d'avant (« Annuler »).
 */
export function trackingForStage(stage: Stage): Tracking {
  switch (stage) {
    case "aAppeler":
      return markNotCalled();
    case "appeleEnAttente":
      return { called: true, response: "enAttente" };
    case "accepte":
    case "refuse":
      return { called: true, response: stage };
  }
}

/** « Accepté » ou « refusé » marque aussi le contact appelé ; « en attente » ne change pas l'appel. */
export function withResponse(t: Tracking, response: ContactResponse): Tracking {
  return { called: response === "enAttente" ? t.called : true, response };
}

/** Range les contacts par étape, en gardant leur ordre ; les 4 étapes sont toujours présentes. */
export function groupByStage<T extends Tracking>(contacts: readonly T[]): Record<Stage, T[]> {
  const groups = Object.fromEntries(STAGES.map((s) => [s, [] as T[]])) as Record<Stage, T[]>;
  for (const c of contacts) groups[stageOf(c)].push(c);
  return groups;
}

/** L'étape lue dans l'adresse (`?etape=`) : une étape connue, sinon null (« Tous »). */
export function parseStage(value: unknown): Stage | null {
  return typeof value === "string" && (STAGES as readonly string[]).includes(value) ? (value as Stage) : null;
}
