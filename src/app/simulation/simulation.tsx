"use client";

import { useMemo, useState } from "react";
import {
  MoreHorizontalIcon,
  PhoneIcon,
  PhoneOffIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import { StatusBadge, statusStyles } from "@/components/status-badge";
import type { ContactResponse } from "@/services/contact-model";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { companies, initialContacts, sectors, type SimContact } from "./fixtures";

const companyById = new Map(companies.map((c) => [c.id, c]));
const companyItems = Object.fromEntries(companies.map((c) => [c.id, c.name]));
const responses: ContactResponse[] = ["accepte", "refuse", "enAttente"];

type Filter = "tous" | "aAppeler" | "enAttente" | "accepte" | "refuse";
const filters: { value: Filter; label: string; match: (c: SimContact) => boolean }[] = [
  { value: "tous", label: "Tous", match: () => true },
  { value: "aAppeler", label: "À appeler", match: (c) => !c.called },
  { value: "enAttente", label: "En attente", match: (c) => c.response === "enAttente" },
  { value: "accepte", label: "Acceptés", match: (c) => c.response === "accepte" },
  { value: "refuse", label: "Refusés", match: (c) => c.response === "refuse" },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function CompanySelectItems() {
  return sectors.map((sector, i) => (
    <SelectGroup key={sector}>
      {i > 0 && <SelectSeparator />}
      <SelectLabel>{sector}</SelectLabel>
      {companies
        .filter((c) => c.sector === sector)
        .map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name}
            <span className="ml-auto pl-3 text-xs text-muted-foreground">{c.city}</span>
          </SelectItem>
        ))}
    </SelectGroup>
  ));
}

export function Simulation() {
  const [contacts, setContacts] = useState<SimContact[]>(initialContacts);
  const [filter, setFilter] = useState<Filter>("tous");
  const [companyFilter, setCompanyFilter] = useState<string>("toutes");
  const [query, setQuery] = useState("");

  const update = (id: string, patch: Partial<SimContact>) =>
    setContacts((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const remove = (id: string) => setContacts((list) => list.filter((c) => c.id !== id));

  const visible = useMemo(() => {
    const match = filters.find((f) => f.value === filter)!.match;
    const q = query.trim().toLowerCase();
    return contacts.filter(
      (c) =>
        match(c) &&
        (companyFilter === "toutes" || c.companyId === companyFilter) &&
        (!q ||
          c.name.toLowerCase().includes(q) ||
          companyById.get(c.companyId)!.name.toLowerCase().includes(q)),
    );
  }, [contacts, filter, companyFilter, query]);

  const stats = [
    { label: "Contacts", value: contacts.length, className: "text-foreground" },
    { label: "Appelés", value: contacts.filter((c) => c.called).length, className: "text-info" },
    { label: "Acceptés", value: contacts.filter((c) => c.response === "accepte").length, className: "text-success" },
    { label: "En attente", value: contacts.filter((c) => c.response === "enAttente").length, className: "text-warning" },
    { label: "Refusés", value: contacts.filter((c) => c.response === "refuse").length, className: "text-destructive" },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-primary">
            Simulation · données fictives
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">Mes contacts</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setContacts(initialContacts)}>
            <RotateCcwIcon data-icon="inline-start" />
            Réinitialiser
          </Button>
          <AddContactDialog onAdd={(c) => setContacts((list) => [c, ...list])} />
        </div>
      </header>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map((s) => (
          <li key={s.label} className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`font-heading text-3xl font-semibold ${s.className}`}>{s.value}</p>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            {filters.map((f) => (
              <TabsTrigger key={f.value} value={f.value}>
                {f.label}
                <span className="ml-1 font-mono text-xs text-muted-foreground">
                  {contacts.filter(f.match).length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8 sm:w-56"
              placeholder="Rechercher…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Rechercher un contact ou une entreprise"
            />
          </div>
          <Select
            items={{ toutes: "Toutes les entreprises", ...companyItems }}
            value={companyFilter}
            onValueChange={(v) => setCompanyFilter(v ?? "toutes")}
          >
            <SelectTrigger className="sm:w-60" aria-label="Filtrer par entreprise">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="toutes">Toutes les entreprises</SelectItem>
              <SelectSeparator />
              <CompanySelectItems />
            </SelectContent>
          </Select>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <UsersIcon className="size-8 text-muted-foreground" />
          <p className="font-heading text-lg font-semibold">Aucun contact ici</p>
          <p className="text-sm text-muted-foreground">Change de filtre ou ajoute un contact.</p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((c) => (
            <li key={c.id}>
              <ContactCard contact={c} onChange={(p) => update(c.id, p)} onDelete={() => remove(c.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ContactCard({
  contact: c,
  onChange,
  onDelete,
}: {
  contact: SimContact;
  onChange: (patch: Partial<SimContact>) => void;
  onDelete: () => void;
}) {
  const company = companyById.get(c.companyId)!;
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-accent font-heading text-sm font-semibold text-accent-foreground">
            {initials(c.name)}
          </div>
          <div className="min-w-0">
            <CardTitle className="truncate font-heading text-lg">{c.name}</CardTitle>
            <CardDescription className="truncate">
              {c.role} · {company.name}
            </CardDescription>
          </div>
        </div>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" aria-label={`Actions pour ${c.name}`} />}
            >
              <MoreHorizontalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Appel</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onChange({ called: !c.called })}>
                  {c.called ? <PhoneOffIcon /> : <PhoneIcon />}
                  {c.called ? "Marquer non appelé" : "Marquer appelé"}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Réponse</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={c.response}
                  onValueChange={(v) => onChange({ response: v as ContactResponse })}
                >
                  {responses.map((r) => (
                    <DropdownMenuRadioItem key={r} value={r}>
                      {statusStyles[r].label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                <Trash2Icon />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="font-mono text-xs leading-relaxed text-muted-foreground">
          {c.phone}
          <br />
          {c.email}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge status={c.called ? "appele" : "nonAppele"} />
          <StatusBadge status={c.response} />
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-2">
        <Button
          size="sm"
          variant={c.called ? "outline" : "default"}
          onClick={() => onChange({ called: !c.called })}
        >
          {c.called ? <PhoneOffIcon data-icon="inline-start" /> : <PhoneIcon data-icon="inline-start" />}
          {c.called ? "Non appelé" : "Marquer appelé"}
        </Button>
        <ToggleGroup
          variant="outline"
          size="sm"
          spacing={0}
          value={[c.response]}
          onValueChange={(v) => v[0] && onChange({ response: v[0] as ContactResponse })}
          aria-label="Réponse"
        >
          {responses.map((r) => (
            <ToggleGroupItem
              key={r}
              value={r}
              className="aria-pressed:bg-primary aria-pressed:text-primary-foreground data-pressed:bg-primary data-pressed:text-primary-foreground"
            >
              {statusStyles[r].label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </CardFooter>
    </Card>
  );
}

function AddContactDialog({ onAdd }: { onAdd: (c: SimContact) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const nameError = submitted && !name.trim();
  const companyError = submitted && !companyId;

  function reset() {
    setName("");
    setRole("");
    setCompanyId(null);
    setPhone("");
    setEmail("");
    setSubmitted(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!name.trim() || !companyId) return;
    // Défauts métier : un nouveau contact est « non appelé » et « en attente ».
    onAdd({
      id: crypto.randomUUID(),
      name: name.trim(),
      role: role.trim() || "Contact",
      companyId,
      phone: phone.trim() || "—",
      email: email.trim() || "—",
      called: false,
      response: "enAttente",
    });
    reset();
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger render={<Button />}>
        <PlusIcon data-icon="inline-start" />
        Ajouter un contact
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-4" noValidate>
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Nouveau contact</DialogTitle>
            <DialogDescription>
              Il sera créé « non appelé » et « en attente ».
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="sim-name">Nom *</Label>
              <Input
                id="sim-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Claire Martin"
                aria-invalid={nameError || undefined}
              />
              {nameError && <p className="text-xs text-destructive">Le nom est obligatoire.</p>}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sim-role">Fonction</Label>
              <Input id="sim-role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Gérante" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="sim-company">Entreprise *</Label>
            <Select items={companyItems} value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger id="sim-company" className="w-full" aria-invalid={companyError || undefined}>
                <SelectValue placeholder="Choisir une entreprise" />
              </SelectTrigger>
              <SelectContent>
                <CompanySelectItems />
              </SelectContent>
            </Select>
            {companyError && <p className="text-xs text-destructive">Choisis une entreprise.</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="sim-phone">Téléphone</Label>
              <Input id="sim-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06 12 34 56 78" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sim-email">E-mail</Label>
              <Input id="sim-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="claire@exemple.fr" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Annuler</DialogClose>
            <Button type="submit">Ajouter</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
