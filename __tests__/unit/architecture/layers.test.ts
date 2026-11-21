// Tests d'architecture : garantissent la séparation présentation → service → données.
// Ils lisent les imports réels de src/ ; un import interdit fait échouer `pnpm test`.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  DB_PACKAGE,
  findPathToDatabase,
  scanProject,
  type Layer,
  type SourceFile,
} from "./import-graph";

/** Couches qu'une couche n'a pas le droit d'importer, même pour un simple type. */
const FORBIDDEN: Record<Layer, Layer[]> = {
  presentation: ["data"],
  service: ["presentation"],
  data: ["service", "presentation"],
  shared: ["presentation", "service", "data"],
};

const FRAMEWORK = /^(react|react-dom|next)(\/|$)/;

function layerViolations(graph: Map<string, SourceFile>): string[] {
  const out: string[] = [];
  for (const node of graph.values()) {
    for (const target of node.internal) {
      const targetLayer = graph.get(target)?.layer;
      if (targetLayer && FORBIDDEN[node.layer].includes(targetLayer))
        out.push(`${node.file} (${node.layer}) importe ${target} (${targetLayer})`);
    }
  }
  return out;
}

function dbPackageViolations(graph: Map<string, SourceFile>): string[] {
  return [...graph.values()]
    .filter((n) => n.layer !== "data")
    .flatMap((n) =>
      n.external.filter((p) => DB_PACKAGE.test(p)).map((p) => `${n.file} (${n.layer}) importe ${p}`),
    );
}

/** Depuis la présentation, la base n'est atteignable qu'en passant par un service. */
function presentationBypasses(graph: Map<string, SourceFile>): string[] {
  return [...graph.values()]
    .filter((n) => n.layer === "presentation")
    .map((n) => findPathToDatabase(graph, n.file, (f) => f.layer !== "service"))
    .filter((p): p is string[] => p !== null)
    .map((p) => p.join(" → "));
}

/**
 * Un composant client part dans le navigateur : il ne doit jamais atteindre la base.
 * Seule exception : un fichier de Server Functions (`"use server"`), qui reste sur le serveur
 * et n'est appelé qu'à distance.
 */
function clientReachesDatabase(graph: Map<string, SourceFile>): string[] {
  return [...graph.values()]
    .filter((n) => n.isClient)
    .map((n) => findPathToDatabase(graph, n.file, (f) => !f.isServerAction))
    .filter((p): p is string[] => p !== null)
    .map((p) => p.join(" → "));
}

// ---------------------------------------------------------------------------
// 1. Le vrai code du projet
// ---------------------------------------------------------------------------
describe("architecture en 3 couches (src/)", () => {
  const graph = scanProject(process.cwd());
  const files = [...graph.values()];

  it("trouve des fichiers dans chaque couche (le scan n'est pas vide)", () => {
    for (const layer of ["presentation", "service", "data"] as const)
      expect(files.some((f) => f.layer === layer), `aucun fichier ${layer}`).toBe(true);
  });

  it("résout tous les imports internes", () => {
    expect(files.flatMap((f) => f.unresolved.map((s) => `${f.file} : ${s}`))).toEqual([]);
  });

  it("la présentation n'importe jamais la couche données", () => {
    expect(layerViolations(graph).filter((v) => v.includes("(presentation) importe"))).toEqual([]);
  });

  it("le service n'importe jamais la présentation", () => {
    expect(layerViolations(graph).filter((v) => v.includes("(service) importe"))).toEqual([]);
  });

  it("la couche données n'importe ni le service ni la présentation", () => {
    expect(layerViolations(graph).filter((v) => v.includes("(data) importe"))).toEqual([]);
  });

  it("le code partagé (src/lib…) ne dépend d'aucune couche", () => {
    expect(layerViolations(graph).filter((v) => v.includes("(shared) importe"))).toEqual([]);
  });

  it("seule la couche données importe un client de base (libSQL, Turso…)", () => {
    expect(dbPackageViolations(graph)).toEqual([]);
  });

  it("le service ne dépend pas de React ni de Next", () => {
    const hits = files
      .filter((f) => f.layer === "service")
      .flatMap((f) => f.external.filter((p) => FRAMEWORK.test(p)).map((p) => `${f.file} importe ${p}`));
    expect(hits).toEqual([]);
  });

  it("depuis la présentation, aucun chemin indirect vers la base qui contourne le service", () => {
    expect(presentationBypasses(graph)).toEqual([]);
  });

  it("aucun composant client (« use client ») n'atteint la base, même via un service", () => {
    expect(clientReachesDatabase(graph)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 2. Les détecteurs eux-mêmes : on leur donne un faux projet plein d'infractions
//    pour prouver qu'ils les voient (sinon les tests ci-dessus ne prouvent rien).
// ---------------------------------------------------------------------------
describe("les détecteurs repèrent bien les infractions", () => {
  let root: string;
  let graph: Map<string, SourceFile>;

  const write = (file: string, code: string) => {
    const full = path.join(root, file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, code);
  };

  beforeAll(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "pipeline-archi-"));
    write("src/data/contacts.ts", `import { createClient } from "@libsql/client";\nexport const db = createClient({ url: "file:x.db" });\nexport type Contact = { id: string };`);
    write("src/services/contacts.ts", `import { db } from "@/data/contacts";\nexport const list = () => db;`);
    // Présentation conforme : passe par le service
    write("src/app/ok/page.tsx", `import { list } from "@/services/contacts";\nexport default function P() { list(); return null; }`);
    // Infractions
    write("src/app/alias/page.tsx", `import { db } from "@/data/contacts";\nexport default () => db;`);
    write("src/components/relatif.tsx", `import { db } from "../data/contacts";\nexport const X = db;`);
    write("src/components/type-seul.tsx", `import type { Contact } from "@/data/contacts";\nexport const y: Contact | null = null;`);
    write("src/components/dynamique.tsx", `export const load = () => import("@/data/contacts");`);
    write("src/components/libsql.tsx", `import { createClient } from "@libsql/client";\nexport const c = createClient;`);
    write("src/lib/passe-plat.ts", `export * from "@/data/contacts";`);
    write("src/components/contournement.tsx", `import { db } from "@/lib/passe-plat";\nexport const z = db;`);
    write("src/components/client.tsx", `"use client";\nimport { list } from "@/services/contacts";\nexport const C = list;`);
    // Composant client → Server Functions → service → données : autorisé
    write("src/app/actions.ts", `"use server";
import { list } from "@/services/contacts";
export async function act() { return list(); }`);
    write("src/components/client-action.tsx", `"use client";
import { act } from "@/app/actions";
export const A = act;`);
    write("src/services/vers-ui.ts", `import { X } from "@/components/relatif";\nimport { useState } from "react";\nexport const s = [X, useState];`);
    write("src/data/vers-service.ts", `import { list } from "@/services/contacts";\nexport const d = list;`);
    graph = scanProject(root);
  });

  afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

  it("import direct de la couche données, par alias, chemin relatif, type ou import()", () => {
    const v = layerViolations(graph).join("\n");
    for (const f of ["src/app/alias/page.tsx", "src/components/relatif.tsx", "src/components/type-seul.tsx", "src/components/dynamique.tsx"])
      expect(v).toContain(`${f} (presentation) importe src/data/contacts.ts`);
    expect(v).not.toContain("src/app/ok/page.tsx");
  });

  it("client de base importé hors de la couche données", () => {
    expect(dbPackageViolations(graph)).toEqual(["src/components/libsql.tsx (presentation) importe @libsql/client"]);
  });

  it("contournement via un module partagé qui ré-exporte la couche données", () => {
    expect(layerViolations(graph).join("\n")).toContain("src/lib/passe-plat.ts (shared) importe src/data/contacts.ts");
    expect(presentationBypasses(graph)).toContain(
      "src/components/contournement.tsx → src/lib/passe-plat.ts → src/data/contacts.ts",
    );
    expect(presentationBypasses(graph).join("\n")).not.toContain("src/app/ok/page.tsx");
  });

  it("composant client qui atteint la base à travers un service", () => {
    expect(clientReachesDatabase(graph)).toContain(
      "src/components/client.tsx → src/services/contacts.ts → src/data/contacts.ts",
    );
  });

  it("composant client qui passe par une Server Function (« use server ») : autorisé", () => {
    expect(clientReachesDatabase(graph).join("\n")).not.toContain("src/components/client-action.tsx");
    expect(presentationBypasses(graph).join("\n")).not.toContain("src/app/actions.ts");
  });

  it("dépendances vers le haut : service → présentation, données → service", () => {
    const v = layerViolations(graph);
    expect(v).toContain("src/services/vers-ui.ts (service) importe src/components/relatif.tsx (presentation)");
    expect(v).toContain("src/data/vers-service.ts (data) importe src/services/contacts.ts (service)");
  });
});
