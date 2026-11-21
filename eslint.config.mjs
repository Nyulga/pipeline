import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Séparation des couches (doublée par __tests__/unit/architecture/layers.test.ts,
// qui couvre aussi les import() dynamiques et les chemins indirects).
const DB_CLIENTS = "^(@libsql|@tursodatabase|@prisma)/|^(libsql|better-sqlite3|sqlite3|drizzle-orm|prisma|kysely|pg|mysql2?)(/|$)";
const restrict = (...patterns) => ({
  "no-restricted-imports": ["error", { patterns }],
});

const layerRules = [
  {
    files: ["src/app/**", "src/components/**"],
    rules: restrict(
      {
        regex: "^@/data(/|$)|^(\\.{1,2}/)+(.*/)?data(/|$)",
        message: "Présentation : passe par la couche service (@/services), jamais par @/data.",
      },
      { regex: DB_CLIENTS, message: "Présentation : seule la couche données parle à la base." },
    ),
  },
  {
    files: ["src/services/**"],
    rules: restrict(
      {
        regex: "^@/(app|components)(/|$)|^(react|react-dom|next)(/|$)",
        message: "Service : aucune dépendance vers la présentation, React ou Next.",
      },
      { regex: DB_CLIENTS, message: "Service : passe par la couche données (@/data), pas par le client de base." },
    ),
  },
  {
    files: ["src/data/**"],
    rules: restrict({
      regex: "^@/(services|app|components)(/|$)",
      message: "Données : ne dépend d'aucune couche supérieure.",
    }),
  },
  {
    files: ["src/lib/**"],
    rules: restrict(
      {
        regex: "^@/(services|data|app|components)(/|$)",
        message: "Code partagé : ne dépend d'aucune couche (sinon il sert de contournement).",
      },
      { regex: DB_CLIENTS, message: "Code partagé : seule la couche données parle à la base." },
    ),
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...layerRules,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
