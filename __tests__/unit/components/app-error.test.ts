// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ErrorPage from "@/app/error";

afterEach(cleanup);

describe("app/error : filet de sécurité si une erreur inattendue remonte", () => {
  it("affiche un message clair, sans le détail technique, et permet de réessayer", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const retry = vi.fn();
    render(createElement(ErrorPage, { error: new Error("SQLITE_BUSY: database is locked"), retry }));

    expect(screen.getByRole("heading", { name: "Quelque chose s'est mal passé" })).toBeTruthy();
    expect(screen.queryByText(/SQLITE_BUSY/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
