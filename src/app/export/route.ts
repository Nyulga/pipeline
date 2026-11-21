import { connection } from "next/server";
import { stageStyles, statusStyles } from "@/components/status-badge";
import { exportFileName, listContactsForExport, toCsv } from "@/services/contacts";
import { stageOf } from "@/services/tracking";

const HEADER = [
  "Nom",
  "Entreprise",
  "Téléphone",
  "E-mail",
  "Appelé",
  "Réponse",
  "Étape",
  "Prochaine relance",
  "Date de création",
  "Dernière note",
];

/** JJ/MM/AAAA pour un jour AAAA-MM-JJ : Excel en français le lit comme une date. */
const day = (d: string | null) => (d ? d.split("-").reverse().join("/") : null);

const CREATED = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});
/** JJ/MM/AAAA HH:MM à l'heure de Paris. */
const created = (iso: string) => CREATED.format(new Date(iso)).replace(",", "");

/** Le fichier CSV de tous les contacts, généré à chaque demande. */
export async function GET() {
  // Avec cacheComponents, un GET serait prérendu au build : on le lit à chaque requête.
  await connection();
  const rows = (await listContactsForExport()).map(({ contact: c, lastNote }) => [
    c.name,
    c.company,
    c.phone,
    c.email,
    c.called ? "Oui" : "Non",
    statusStyles[c.response].label,
    stageStyles[stageOf(c)].label,
    day(c.nextFollowUp),
    created(c.createdAt),
    lastNote,
  ]);

  return new Response(toCsv([HEADER, ...rows]), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFileName(new Date())}"`,
      "Cache-Control": "no-store",
    },
  });
}
