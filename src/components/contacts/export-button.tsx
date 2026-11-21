import { DownloadIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

/** Télécharge tous les contacts en CSV (servi par la route /export). */
export function ExportButton() {
  return (
    // Un vrai lien : le navigateur télécharge le fichier, sans JavaScript ni navigation client.
    <a href="/export" download className={buttonVariants({ variant: "outline" })}>
      <DownloadIcon data-icon="inline-start" />
      Exporter en CSV
    </a>
  );
}
