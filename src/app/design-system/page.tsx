import type { Metadata } from "next";
import { StatusBadge, statusStyles, type Status } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "cn";

export const metadata: Metadata = {
  title: "Design system · Pipeline",
};

const colorGroups: { title: string; tokens: { name: string; role: string }[] }[] = [
  {
    title: "Surfaces",
    tokens: [
      { name: "background", role: "Fond de page" },
      { name: "foreground", role: "Texte" },
      { name: "card", role: "Cartes" },
      { name: "muted", role: "Zones discrètes" },
      { name: "muted-foreground", role: "Texte secondaire" },
      { name: "border", role: "Bordures" },
      { name: "input", role: "Bordure des champs" },
    ],
  },
  {
    title: "Actions",
    tokens: [
      { name: "primary", role: "Action principale" },
      { name: "secondary", role: "Action secondaire" },
      { name: "accent", role: "Survol" },
      { name: "ring", role: "Focus" },
      { name: "destructive", role: "Suppression, refusé" },
    ],
  },
  {
    title: "Suivi",
    tokens: [
      { name: "info", role: "Appelé" },
      { name: "success", role: "Accepté" },
      { name: "warning", role: "En attente" },
      { name: "destructive", role: "Refusé" },
    ],
  },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border-t border-border pt-8">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

const responses = ["Accepté", "Refusé", "En attente"] as const;

export default function DesignSystemPage() {
  return (
    <main className="mx-auto w-full max-w-4xl space-y-10 px-4 py-12">
      <header className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Pipeline · design system
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">Papier</h1>
        <p className="max-w-prose text-muted-foreground">
          Carnet de prospection chaleureux : fond crème, encre brune, terracotta pour
          l&apos;action. Tout ce qui suit est rendu avec les vrais tokens et composants de
          l&apos;app ; bascule le mode sombre en haut à droite pour voir la variante.
        </p>
      </header>

      <Section title="Couleurs">
        {colorGroups.map((group) => (
          <div key={group.title} className="space-y-2">
            <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {group.title}
            </h3>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {group.tokens.map((token) => (
                <li key={token.name + token.role}>
                  <div
                    className="h-12 rounded-md border border-border"
                    style={{ background: `var(--${token.name})` }}
                  />
                  <p className="mt-1.5 font-mono text-xs">--{token.name}</p>
                  <p className="text-xs text-muted-foreground">{token.role}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Section>

      <Section title="Typographie">
        <dl className="divide-y divide-dashed divide-border">
          {[
            { label: "Titre · Fraunces", node: <p className="font-heading text-4xl font-semibold tracking-tight">Mes contacts</p> },
            { label: "Sous-titre · Fraunces", node: <p className="font-heading text-xl font-semibold">Claire Martin</p> },
            { label: "Corps · Source Sans 3", node: <p>Rappeler après la démo de jeudi.</p> },
            { label: "Légende", node: <p className="text-sm text-muted-foreground">Ajouté le 12 nov.</p> },
            { label: "Données · IBM Plex Mono", node: <p className="font-mono text-sm">06 12 34 56 78</p> },
          ].map((row) => (
            <div key={row.label} className="grid gap-1 py-3 sm:grid-cols-[12rem_1fr] sm:items-baseline">
              <dt className="font-mono text-xs text-muted-foreground">{row.label}</dt>
              <dd>{row.node}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Boutons">
        <div className="flex flex-wrap items-center gap-2">
          <Button>Ajouter un contact</Button>
          <Button variant="secondary">Secondaire</Button>
          <Button variant="outline">Contour</Button>
          <Button variant="ghost">Fantôme</Button>
          <Button variant="destructive">Supprimer</Button>
          <Button variant="link">Lien</Button>
          <Button disabled>Désactivé</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="xs">Très petit</Button>
          <Button size="sm">Petit</Button>
          <Button>Normal</Button>
          <Button size="lg">Grand</Button>
        </div>
      </Section>

      <Section title="Champs">
        <div className="grid max-w-xl gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="ds-nom">Nom</Label>
            <Input id="ds-nom" placeholder="Claire Martin" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ds-entreprise">Entreprise</Label>
            <Input id="ds-entreprise" defaultValue="Atelier Nord" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ds-tel">Téléphone</Label>
            <Input id="ds-tel" defaultValue="06 12" aria-invalid aria-describedby="ds-tel-err" />
            <p id="ds-tel-err" className="text-xs text-destructive">
              Numéro incomplet.
            </p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ds-email">E-mail</Label>
            <Input id="ds-email" disabled placeholder="Désactivé" />
          </div>
        </div>
      </Section>

      <Section title="Statuts de suivi">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(statusStyles) as Status[]).map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Par défaut, un nouveau contact est « non appelé » et « en attente ».
        </p>
      </Section>

      <Section title="Carte de contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-lg">Claire Martin</CardTitle>
              <CardDescription>Directrice · Atelier Nord</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-mono text-xs leading-relaxed text-muted-foreground">
                06 12 34 56 78
                <br />
                claire@ateliernord.fr
              </p>
              <div className="flex flex-wrap gap-1.5">
                <StatusBadge status="appele" />
                <StatusBadge status="accepte" />
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                Marquer non appelé
              </Button>
              <div role="group" aria-label="Réponse" className="inline-flex overflow-hidden rounded-md border border-input">
                {responses.map((r, i) => (
                  <button
                    key={r}
                    type="button"
                    aria-pressed={r === "Accepté"}
                    className={cn(
                      "h-7 px-2.5 text-xs font-medium text-muted-foreground",
                      i > 0 && "border-l border-input",
                      "aria-pressed:bg-primary aria-pressed:text-primary-foreground",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-lg">Thomas Bernard</CardTitle>
              <CardDescription>Gérant · Boulangerie du Port</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-mono text-xs leading-relaxed text-muted-foreground">
                07 98 76 54 32
              </p>
              <div className="flex flex-wrap gap-1.5">
                <StatusBadge status="nonAppele" />
                <StatusBadge status="enAttente" />
              </div>
            </CardContent>
            <CardFooter>
              <Button size="sm">Marquer appelé</Button>
            </CardFooter>
          </Card>
        </div>
      </Section>
    </main>
  );
}
