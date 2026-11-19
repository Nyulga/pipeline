// Analyse statique des imports de src/, utilisée par les tests d'architecture.
// S'appuie sur le parseur TypeScript : couvre `import`, `import type`,
// `export … from`, `import()` dynamique et `require()`.
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

export type Layer = "presentation" | "service" | "data" | "shared";

/** Paquets qui parlent à une base : seule la couche données peut les importer. */
export const DB_PACKAGE =
  /^(@libsql|@tursodatabase|@prisma)\/|^(libsql|better-sqlite3|sqlite3|drizzle-orm|prisma|kysely|pg|mysql2?)(\/|$)/;

const EXTENSIONS = [".ts", ".tsx", ".mts", ".js", ".jsx", ".mjs"];

export type SourceFile = {
  /** Chemin relatif à la racine du projet, avec des "/" (ex. src/app/page.tsx). */
  file: string;
  layer: Layer;
  isClient: boolean;
  /** Fichier de Server Functions (`"use server"`) : appelé à distance, jamais embarqué côté client. */
  isServerAction: boolean;
  /** Imports résolus vers un fichier de src/ (chemins relatifs à la racine). */
  internal: string[];
  /** Imports de paquets externes (ex. "react", "@libsql/client"). */
  external: string[];
  /** Imports internes impossibles à résoudre (signalés par un test dédié). */
  unresolved: string[];
};

export function layerOf(file: string): Layer {
  if (/^src\/(app|components)\//.test(file)) return "presentation";
  if (file.startsWith("src/services/")) return "service";
  if (file.startsWith("src/data/")) return "data";
  return "shared";
}

const toPosix = (p: string) => p.split(path.sep).join("/");

function resolveInternal(root: string, fromFile: string, spec: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = path.join(root, "src", spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(path.join(root, fromFile)), spec);
  else return null;

  const candidates = [
    base,
    ...EXTENSIONS.map((ext) => base + ext),
    ...EXTENSIONS.map((ext) => path.join(base, "index" + ext)),
  ];
  const hit = candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile());
  return hit ? toPosix(path.relative(root, hit)) : null;
}

/** Directive en tête de fichier (après d'éventuels commentaires). */
function hasDirective(code: string, directive: string): boolean {
  const leading = /^(\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*/.exec(code)?.[0].length ?? 0;
  return new RegExp(`^["']${directive}["']`).test(code.slice(leading));
}

export function scanProject(root: string): Map<string, SourceFile> {
  const srcDir = path.join(root, "src");
  const files = (fs.readdirSync(srcDir, { recursive: true }) as string[])
    .map((f) => toPosix(path.join("src", f)))
    .filter((f) => EXTENSIONS.includes(path.extname(f)) && !f.endsWith(".d.ts"));

  const graph = new Map<string, SourceFile>();
  for (const file of files) {
    const code = fs.readFileSync(path.join(root, file), "utf8");
    const info = ts.preProcessFile(code, true, true);
    const entry: SourceFile = {
      file,
      layer: layerOf(file),
      isClient: hasDirective(code, "use client"),
      isServerAction: hasDirective(code, "use server"),
      internal: [],
      external: [],
      unresolved: [],
    };
    for (const { fileName: spec } of info.importedFiles) {
      if (spec.startsWith("@/") || spec.startsWith(".")) {
        const target = resolveInternal(root, file, spec);
        if (target) entry.internal.push(target);
        else entry.unresolved.push(spec);
      } else {
        entry.external.push(spec);
      }
    }
    graph.set(file, entry);
  }
  return graph;
}

/**
 * Parcourt le graphe depuis `start` et renvoie le premier chemin qui atteint
 * la couche données ou un paquet de base, sans passer par les fichiers que
 * `canTraverse` refuse. Renvoie null si aucun chemin n'existe.
 */
export function findPathToDatabase(
  graph: Map<string, SourceFile>,
  start: string,
  canTraverse: (f: SourceFile) => boolean = () => true,
): string[] | null {
  const seen = new Set<string>();
  const walk = (file: string, trail: string[]): string[] | null => {
    if (seen.has(file)) return null;
    seen.add(file);
    const node = graph.get(file);
    if (!node) return null;
    const db = node.external.find((p) => DB_PACKAGE.test(p));
    if (db) return [...trail, file, db];
    for (const next of node.internal) {
      const target = graph.get(next);
      if (!target) continue;
      if (target.layer === "data") return [...trail, file, next];
      if (!canTraverse(target)) continue;
      const found = walk(next, [...trail, file]);
      if (found) return found;
    }
    return null;
  };
  return walk(start, []);
}
