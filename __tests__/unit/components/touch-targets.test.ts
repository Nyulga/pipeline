// @vitest-environment jsdom
// Zones à toucher ≥ 44 px sur écran tactile (lot 11) : `pointer-coarse:min-h-11` (2,75 rem = 44 px).
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions", () => ({ setStageAction: vi.fn() }));

import { toast } from "sonner";
import { BackToContacts } from "@/components/contacts/back-to-contacts";
import { ContactCard } from "@/components/contacts/contact-card";
import { TOUCH_TARGET } from "@/components/touch-target";
import { Toaster } from "@/components/ui/sonner";
import { ContactSearch } from "@/components/contacts/contact-search";
import { StageFilter } from "@/components/contacts/stage-filter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { makeContact } from "./helpers/contact";

afterEach(cleanup);

const TALL = "pointer-coarse:min-h-11";
const WIDE = "pointer-coarse:min-w-11";

describe("zones à toucher ≥ 44 px sur écran tactile (lot 11)", () => {
  const sizes = ["default", "xs", "sm", "lg"] as const;
  const iconSizes = ["icon", "icon-xs", "icon-sm", "icon-lg"] as const;

  it.each(sizes)("Button, taille %s", (size) => {
    render(createElement(Button, { size }, "OK"));
    expect(screen.getByRole("button").className).toContain(TALL);
  });

  it.each(iconSizes)("Button icône, taille %s : haut et large", (size) => {
    render(createElement(Button, { size, "aria-label": "Icône" }));
    const cls = screen.getByRole("button").className;
    expect(cls).toContain(TALL);
    expect(cls).toContain(WIDE);
  });

  it("Input", () => {
    render(createElement(Input, { "aria-label": "Champ" }));
    expect(screen.getByRole("textbox").className).toContain(TALL);
  });

  it("SelectTrigger", () => {
    render(createElement(Select, null, createElement(SelectTrigger, { "aria-label": "Choix" }, createElement(SelectValue))));
    expect(screen.getByRole("combobox").className).toContain(TALL);
  });

  it("TabsTrigger (et sa liste)", () => {
    render(
      createElement(
        Tabs,
        { defaultValue: "a" },
        createElement(TabsList, null, createElement(TabsTrigger, { value: "a" }, "A")),
      ),
    );
    expect(screen.getByRole("tab").className).toContain(TALL);
    // La liste a 3 px de marge autour de l'onglet : elle prend 44 px + 6 px (revue de la PR #25).
    expect(screen.getByRole("tablist").className).toContain("pointer-coarse:min-h-[calc(2.75rem+6px)]");
  });

  it("carte de contact : nom, téléphone, e-mail et éléments du menu d'étape", async () => {
    const c = makeContact({ name: "Claire Martin", phone: "06 12 34 56 78", email: "claire@exemple.fr" });
    render(createElement(ContactCard, { contact: c, onStageChange: vi.fn() }));
    for (const name of ["Claire Martin", "06 12 34 56 78", "claire@exemple.fr"])
      expect(screen.getByRole("link", { name }).className).toContain(TALL);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^Étape de Claire Martin/ }));
    });
    for (const item of screen.getAllByRole("menuitemradio")) expect(item.className).toContain(TALL);
  });

  it("le bouton « Annuler » du message (revue de la PR #25)", async () => {
    render(createElement(Toaster));
    await act(async () => {
      toast("Ana : Accepté", { action: { label: "Annuler", onClick: () => {} } });
    });
    expect((await screen.findByRole("button", { name: "Annuler" })).className).toContain(TALL);
  });

  it("le lien de retour « Mes contacts » de la page de fiche (revue de la PR #25)", () => {
    render(createElement(BackToContacts));
    expect(screen.getByRole("link", { name: "Mes contacts" }).className).toContain(TALL);
  });

  it("un lien au doigt reste sur une ligne normale : hauteur minimale, pas d'interligne de 44 px (revue de la PR #25)", () => {
    expect(TOUCH_TARGET).toContain(TALL);
    expect(TOUCH_TARGET).not.toContain("leading-11");
  });

  it("pastilles d'étape et « Effacer la recherche »", () => {
    render(createElement(StageFilter, { contacts: [], active: null, query: "" }));
    render(createElement(ContactSearch, { query: "nord" }));
    for (const link of screen.getAllByRole("link")) expect(link.className).toContain(TALL);
  });
});
