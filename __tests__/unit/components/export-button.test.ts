// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { ExportButton } from "@/components/contacts/export-button";

afterEach(cleanup);

describe("ExportButton (lot 5)", () => {
  it("« Exporter en CSV » télécharge le fichier servi par /export", () => {
    render(createElement(ExportButton));
    const link = screen.getByRole("link", { name: "Exporter en CSV" });
    expect(link.getAttribute("href")).toBe("/export");
    expect(link.hasAttribute("download")).toBe(true);
  });
});
