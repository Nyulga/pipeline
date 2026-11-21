import type { Contact } from "@/services/contacts";

let next = 0;

/** Un contact de test : « non appelé », « en attente », avec un id unique, sauf ce que le test précise. */
export function makeContact(over: Partial<Contact> = {}): Contact {
  next += 1;
  return {
    id: `c${next}`,
    name: `Contact ${next}`,
    company: null,
    phone: null,
    email: null,
    called: false,
    response: "enAttente",
    nextFollowUp: null,
    createdAt: "2026-11-19T10:00:00.000Z",
    ...over,
  };
}
