import { describe, expect, it } from "vitest";
import { databaseConfig } from "@/data/db";

const TOKEN = "jeton-de-test-0123456789";
const REMOTE = "libsql://pipeline-exemple.turso.io";

describe("databaseConfig : SQLite en local, Turso en ligne", () => {
  it("sans DATABASE_URL, en local : le fichier pipeline.db", () => {
    expect(databaseConfig({})).toEqual({ url: "file:pipeline.db" });
  });

  it("un fichier local n'a pas besoin de jeton (et n'en transmet pas)", () => {
    expect(databaseConfig({ DATABASE_URL: "file:autre.db", DATABASE_AUTH_TOKEN: TOKEN })).toEqual({ url: "file:autre.db" });
  });

  it("Turso : URL distante et jeton", () => {
    expect(databaseConfig({ DATABASE_URL: REMOTE, DATABASE_AUTH_TOKEN: TOKEN })).toEqual({ url: REMOTE, authToken: TOKEN });
  });

  it.each([REMOTE, "https://pipeline-exemple.turso.io", "wss://pipeline-exemple.turso.io"])(
    "refuse une URL distante sans jeton (%s), sans afficher l'URL",
    (url) => {
      expect(() => databaseConfig({ DATABASE_URL: url })).toThrow(/DATABASE_AUTH_TOKEN/);
      expect(() => databaseConfig({ DATABASE_URL: url, DATABASE_AUTH_TOKEN: "  " })).toThrow(/DATABASE_AUTH_TOKEN/);
      try {
        databaseConfig({ DATABASE_URL: url });
      } catch (e) {
        expect(String(e)).not.toContain("turso.io");
      }
    },
  );

  it("sur Vercel, refuse de retomber sur un fichier local (disque éphémère)", () => {
    expect(() => databaseConfig({ VERCEL: "1" })).toThrow(/DATABASE_URL/);
    expect(() => databaseConfig({ VERCEL: "1", DATABASE_URL: "   " })).toThrow(/DATABASE_URL/);
    expect(databaseConfig({ VERCEL: "1", DATABASE_URL: REMOTE, DATABASE_AUTH_TOKEN: TOKEN })).toEqual({
      url: REMOTE,
      authToken: TOKEN,
    });
  });

  it("sur Vercel, refuse aussi une base en fichier local", () => {
    expect(() => databaseConfig({ VERCEL: "1", DATABASE_URL: "file:pipeline.db" })).toThrow(/DATABASE_URL/);
    expect(() => databaseConfig({ VERCEL: "1", DATABASE_URL: ":memory:" })).toThrow(/DATABASE_URL/);
  });

  it("serveur libSQL auto-hébergé en http/ws : le jeton est transmis s'il est fourni, sans être exigé", () => {
    expect(databaseConfig({ DATABASE_URL: "http://127.0.0.1:8080", DATABASE_AUTH_TOKEN: TOKEN })).toEqual({
      url: "http://127.0.0.1:8080",
      authToken: TOKEN,
    });
    expect(databaseConfig({ DATABASE_URL: "ws://127.0.0.1:8080" })).toEqual({ url: "ws://127.0.0.1:8080" });
  });

  it("ignore les espaces autour des valeurs (copier-coller depuis le tableau de bord)", () => {
    expect(databaseConfig({ DATABASE_URL: ` ${REMOTE}\n`, DATABASE_AUTH_TOKEN: ` ${TOKEN} ` })).toEqual({
      url: REMOTE,
      authToken: TOKEN,
    });
  });
});
