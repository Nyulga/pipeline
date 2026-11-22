// Thème « Doux » (lot 6) : vérifié à partir des tokens réels de globals.css.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { followUpStyles, stageStyles, statusStyles } from "@/components/status-badge";
import { STAGES } from "@/services/tracking";

const css = fs.readFileSync(path.join(process.cwd(), "src", "app", "globals.css"), "utf8");

type Oklch = { l: number; c: number; h: number; alpha: number };
type Theme = "clair" | "sombre";

function block(selector: string): string {
  const start = css.search(new RegExp(`^${selector.replace(".", "\\.")}\\s*\\{`, "m"));
  if (start < 0) throw new Error(`bloc ${selector} introuvable`);
  return css.slice(start, css.indexOf("}", start));
}

const blocks: Record<Theme, string> = { clair: block(":root"), sombre: block(".dark") };
const themeInline = block("@theme inline");

function rawVar(theme: Theme, name: string): string {
  const m = blocks[theme].match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!m) throw new Error(`--${name} absent du thème ${theme}`);
  return m[1].trim();
}

function token(theme: Theme, name: string): Oklch {
  const v = rawVar(theme, name);
  const m = v.match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)(%?))?\s*\)$/);
  if (!m) throw new Error(`--${name} (${theme}) n'est pas un oklch : ${v}`);
  const alpha = m[4] === undefined ? 1 : Number(m[4]) / (m[5] ? 100 : 1);
  return { l: Number(m[1]), c: Number(m[2]), h: Number(m[3]), alpha };
}

// oklch → sRGB (gamma), d'après Björn Ottosson.
function toSrgb({ l, c, h }: Oklch): [number, number, number] {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const L = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const M = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const S = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ].map((x) => Math.min(1, Math.max(0, x)));
  return lin.map((x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055)) as [number, number, number];
}

function over(fg: Oklch, bg: [number, number, number]): [number, number, number] {
  const f = toSrgb(fg);
  return f.map((x, i) => x * fg.alpha + bg[i] * (1 - fg.alpha)) as [number, number, number];
}

function luminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: [number, number, number], b: [number, number, number]): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Couleurs d'une pastille, posée sur `surface` : « bg-info-muted text-info », « bg-destructive/10 … ». */
function badgeColors(className: string, theme: Theme, surface: string) {
  if (/\bdark:|\btext-[a-z-]+\//.test(className))
    throw new Error(`pastille non vérifiable (variante dark: ou texte translucide) : ${className}`);
  const bg = className.match(/\bbg-([a-z-]+)(?:\/(\d+))?/);
  const text = className.match(/\btext-([a-z-]+)/);
  if (!bg || !text) throw new Error(`pastille sans fond ou sans texte : ${className}`);
  const base = toSrgb(token(theme, surface));
  const bgTok = token(theme, bg[1]);
  if (bg[2]) bgTok.alpha *= Number(bg[2]) / 100;
  const back = over(bgTok, base);
  return { back, fore: over(token(theme, text[1]), back), textToken: text[1] };
}

const themes: Theme[] = ["clair", "sombre"];

describe("thème Doux : police, arrondis, accent", () => {
  it("texte et titres en Plus Jakarta Sans", () => {
    expect(themeInline).toMatch(/--font-sans:\s*var\(--font-jakarta\)/);
    expect(themeInline).toMatch(/--font-heading:\s*var\(--font-jakarta\)/);
    const layout = fs.readFileSync(path.join(process.cwd(), "src", "app", "layout.tsx"), "utf8");
    expect(layout).toMatch(/Plus_Jakarta_Sans/);
    expect(layout).not.toMatch(/Fraunces|Source_Sans_3/);
  });

  it("arrondis larges (--radius ≥ 0,75 rem)", () => {
    const r = rawVar("clair", "radius").match(/^([\d.]+)rem$/);
    expect(r).not.toBeNull();
    expect(Number(r![1])).toBeGreaterThanOrEqual(0.75);
  });

  it.each(themes)("accent violet en thème %s", (theme) => {
    const { h, c } = token(theme, "primary");
    expect(h).toBeGreaterThanOrEqual(270);
    expect(h).toBeLessThanOrEqual(310);
    expect(c).toBeGreaterThan(0.08);
  });
});

describe("une couleur par étape", () => {
  it.each(themes)("les 4 étapes ont des teintes distinctes (≥ 30°) en thème %s", (theme) => {
    const hues = STAGES.map((s) => {
      const text = stageStyles[s].className.match(/\btext-([a-z-]+)/)![1];
      const t = token(theme, text);
      expect(t.c, `${s} doit être coloré`).toBeGreaterThan(0.04);
      return t.h;
    });
    for (let i = 0; i < hues.length; i++)
      for (let j = i + 1; j < hues.length; j++) {
        const d = Math.abs(hues[i] - hues[j]) % 360;
        expect(Math.min(d, 360 - d), `${STAGES[i]} / ${STAGES[j]}`).toBeGreaterThanOrEqual(30);
      }
  });
});

describe("lisibilité : contraste ≥ 4,5:1", () => {
  const badges = [
    ...Object.entries(stageStyles).map(([k, v]) => [`étape ${k}`, v.className] as const),
    ...Object.entries(statusStyles).map(([k, v]) => [`statut ${k}`, v.className] as const),
    ...Object.entries(followUpStyles).map(([k, v]) => [`relance ${k}`, v.className] as const),
  ];

  for (const theme of themes)
    for (const surface of ["card", "background"])
      it.each(badges)(`%s, sur ${surface}, thème ${theme}`, (_, className) => {
        const { back, fore } = badgeColors(className, theme, surface);
        expect(contrast(fore, back)).toBeGreaterThanOrEqual(4.5);
      });

  it.each(themes)("bouton principal et texte courant, thème %s", (theme) => {
    const rgb = (n: string, on?: string) =>
      on ? over(token(theme, n), toSrgb(token(theme, on))) : toSrgb(token(theme, n));
    const pairs: [string, string][] = [
      ["primary-foreground", "primary"],
      ["foreground", "background"],
      ["foreground", "card"],
      ["muted-foreground", "background"],
      ["muted-foreground", "card"],
      ["muted-foreground", "muted"],
    ];
    for (const [fg, bg] of pairs)
      expect(contrast(rgb(fg, bg), rgb(bg)), `${fg} sur ${bg}`).toBeGreaterThanOrEqual(4.5);
  });
});
