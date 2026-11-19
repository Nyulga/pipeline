// Règles de suivi d'un contact : fonctions pures, sans accès à la base.
// Ce module peut donc être importé partout, y compris par un composant client
// (mise à jour optimiste), sans embarquer la couche données.

export type ContactResponse = "accepte" | "refuse" | "enAttente";
export const RESPONSES: readonly ContactResponse[] = ["accepte", "refuse", "enAttente"];

export type Tracking = { called: boolean; response: ContactResponse };

/** Un contact, tel que le voit le reste de l'app (défini ici pour rester importable côté client). */
export type Contact = Tracking & {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
};

export type Stage = "aAppeler" | "appeleEnAttente" | "accepte" | "refuse";

/** Les étapes, dans l'ordre du parcours de prospection. */
export const STAGES: readonly { id: Stage; label: string }[] = [
  { id: "aAppeler", label: "À appeler" },
  { id: "appeleEnAttente", label: "Appelé · en attente" },
  { id: "accepte", label: "Accepté" },
  { id: "refuse", label: "Refusé" },
];

export function isContactResponse(value: unknown): value is ContactResponse {
  return typeof value === "string" && (RESPONSES as readonly string[]).includes(value);
}

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

/** Une réponse « accepté » ou « refusé » marque aussi le contact comme appelé. */
export function withResponse(t: Tracking, response: ContactResponse): Tracking {
  return { called: response === "enAttente" ? t.called : true, response };
}

/** Range les contacts par étape, en gardant leur ordre ; toutes les étapes sont présentes. */
export function groupByStage<T extends Tracking>(contacts: readonly T[]): Record<Stage, T[]> {
  const groups = Object.fromEntries(STAGES.map((s) => [s.id, [] as T[]])) as Record<Stage, T[]>;
  for (const c of contacts) groups[stageOf(c)].push(c);
  return groups;
}
