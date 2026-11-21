import { describe, expect, it } from "vitest";
import { csvCell, exportFileName, toCsv } from "@/services/csv";

describe("csvCell : une valeur ne casse jamais le fichier (lot 5)", () => {
  it("laisse telle quelle une valeur simple, accents compris", () => {
    expect(csvCell("Hélène Dupré")).toBe("Hélène Dupré");
    expect(csvCell(null)).toBe("");
  });

  it("met entre guillemets une valeur avec ;, guillemets ou retour à la ligne, en doublant les guillemets", () => {
    expect(csvCell("Nord; Sud")).toBe('"Nord; Sud"');
    expect(csvCell('Le "Café"')).toBe('"Le ""Café"""');
    expect(csvCell("ligne 1\nligne 2")).toBe('"ligne 1\nligne 2"');
    expect(csvCell("a\r\nb")).toBe('"a\r\nb"');
  });

  it("neutralise une valeur qui commencerait une formule (=, +, -, @, tabulation, CR)", () => {
    expect(csvCell("=HYPERLINK(\"x\")")).toBe("\"'=HYPERLINK(\"\"x\"\")\"");
    expect(csvCell("+33 6 12 34 56 78")).toBe("'+33 6 12 34 56 78");
    expect(csvCell("-2")).toBe("'-2");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csvCell("\tcmd")).toBe("'\tcmd");
  });
});

describe("toCsv : un fichier qu'Excel en français ouvre correctement", () => {
  it("commence par le BOM UTF-8, sépare par ; et termine chaque ligne par CRLF", () => {
    expect(toCsv([["Nom", "Ville"], ["Zoé", "Lyon; centre"]])).toBe('﻿Nom;Ville\r\nZoé;"Lyon; centre"\r\n');
  });
});

describe("exportFileName : pipeline-contacts-AAAA-MM-JJ.csv, jour à Paris", () => {
  it("donne la date du jour à Paris", () => {
    expect(exportFileName(new Date("2026-11-21T09:00:00Z"))).toBe("pipeline-contacts-2026-11-21.csv");
    expect(exportFileName(new Date("2026-11-21T23:30:00Z"))).toBe("pipeline-contacts-2026-11-22.csv");
  });
});
