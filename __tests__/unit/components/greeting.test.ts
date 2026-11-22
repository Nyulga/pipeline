// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { Greeting } from "@/components/contacts/greeting";
import { formatGreetingDate, toCallCount } from "@/components/contacts/texts";

afterEach(cleanup);

describe("accueil : « Bonjour », la date et le nombre à rappeler (lot 7)", () => {
  it("la date est celle de Paris : le 22/11 à 23 h 30 UTC, c'est déjà lundi 23 novembre", () => {
    expect(formatGreetingDate(new Date("2026-11-22T23:30:00Z"))).toBe("lundi 23 novembre");
    expect(formatGreetingDate(new Date("2026-11-22T22:30:00Z"))).toBe("dimanche 22 novembre");
  });

  it("le nombre à rappeler, accordé", () => {
    expect(toCallCount(0)).toBe("Personne à rappeler");
    expect(toCallCount(1)).toBe("1 personne à rappeler");
    expect(toCallCount(3)).toBe("3 personnes à rappeler");
  });

  it("affiche « Bonjour » en titre et la date du jour", () => {
    render(createElement(Greeting, { now: new Date("2026-11-23T08:00:00Z") }));
    expect(screen.getByRole("heading", { level: 1, name: "Bonjour" })).toBeTruthy();
    expect(screen.getByText("lundi 23 novembre")).toBeTruthy();
  });
});
