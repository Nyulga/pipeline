// Données 100 % fictives, utilisées uniquement par la page /simulation.
// Rien ici ne passe par la couche données : c'est un bac à sable visuel.
import type { ContactResponse } from "@/services/contact-model";

export type Company = { id: string; name: string; sector: string; city: string };

export type SimContact = {
  id: string;
  name: string;
  role: string;
  companyId: string;
  phone: string;
  email: string;
  called: boolean;
  response: ContactResponse;
};

export const companies: Company[] = [
  { id: "atelier-nord", name: "Atelier Nord", sector: "Artisanat", city: "Lille" },
  { id: "boulangerie-port", name: "Boulangerie du Port", sector: "Artisanat", city: "La Rochelle" },
  { id: "menuiserie-lacombe", name: "Menuiserie Lacombe", sector: "Artisanat", city: "Rodez" },
  { id: "nebula", name: "Nébula Logiciels", sector: "Numérique", city: "Nantes" },
  { id: "pixel-fils", name: "Pixel & Fils", sector: "Numérique", city: "Lyon" },
  { id: "datavelo", name: "Datavélo", sector: "Numérique", city: "Grenoble" },
  { id: "ravel-conseil", name: "Cabinet Ravel Conseil", sector: "Services", city: "Bordeaux" },
  { id: "clair-comptable", name: "Clair Comptable", sector: "Services", city: "Tours" },
  { id: "agence-hirondelle", name: "Agence Hirondelle", sector: "Services", city: "Marseille" },
  { id: "epicerie-verte", name: "L'Épicerie Verte", sector: "Commerce", city: "Rennes" },
  { id: "maison-solene", name: "Maison Solène", sector: "Commerce", city: "Annecy" },
  { id: "librairie-pages", name: "Librairie Les Pages", sector: "Commerce", city: "Dijon" },
  { id: "clinique-tilleuls", name: "Clinique des Tilleuls", sector: "Santé", city: "Metz" },
  { id: "pharmacie-croix", name: "Pharmacie de la Croix", sector: "Santé", city: "Nîmes" },
];

export const sectors = [...new Set(companies.map((c) => c.sector))];

export const initialContacts: SimContact[] = [
  { id: "c1", name: "Claire Martin", role: "Directrice", companyId: "atelier-nord", phone: "06 12 34 56 78", email: "claire@ateliernord.fr", called: true, response: "accepte" },
  { id: "c2", name: "Thomas Bernard", role: "Gérant", companyId: "boulangerie-port", phone: "07 98 76 54 32", email: "thomas@boulangerieduport.fr", called: false, response: "enAttente" },
  { id: "c3", name: "Inès Morel", role: "CTO", companyId: "nebula", phone: "06 45 12 78 90", email: "ines.morel@nebula.dev", called: true, response: "enAttente" },
  { id: "c4", name: "Julien Lacombe", role: "Artisan", companyId: "menuiserie-lacombe", phone: "05 65 42 18 07", email: "contact@menuiserie-lacombe.fr", called: true, response: "refuse" },
  { id: "c5", name: "Sarah Benali", role: "Associée", companyId: "ravel-conseil", phone: "06 77 03 21 54", email: "s.benali@ravel-conseil.fr", called: true, response: "accepte" },
  { id: "c6", name: "Hugo Petit", role: "Fondateur", companyId: "pixel-fils", phone: "07 11 22 33 44", email: "hugo@pixeletfils.fr", called: false, response: "enAttente" },
  { id: "c7", name: "Léa Fontaine", role: "Responsable achats", companyId: "maison-solene", phone: "04 50 61 72 83", email: "lea@maisonsolene.fr", called: true, response: "enAttente" },
  { id: "c8", name: "Mehdi Haddad", role: "Pharmacien titulaire", companyId: "pharmacie-croix", phone: "04 66 12 98 45", email: "m.haddad@pharmacie-croix.fr", called: false, response: "enAttente" },
  { id: "c9", name: "Camille Roux", role: "Libraire", companyId: "librairie-pages", phone: "03 80 44 55 66", email: "camille@lespages.fr", called: true, response: "refuse" },
  { id: "c10", name: "Antoine Girard", role: "Directeur administratif", companyId: "clinique-tilleuls", phone: "03 87 20 30 40", email: "a.girard@clinique-tilleuls.fr", called: true, response: "accepte" },
  { id: "c11", name: "Nadia Lefèvre", role: "Expert-comptable", companyId: "clair-comptable", phone: "02 47 88 99 00", email: "nadia@clair-comptable.fr", called: false, response: "enAttente" },
  { id: "c12", name: "Paul Dubois", role: "Gérant", companyId: "epicerie-verte", phone: "02 99 13 57 91", email: "paul@epicerieverte.bzh", called: true, response: "enAttente" },
];
