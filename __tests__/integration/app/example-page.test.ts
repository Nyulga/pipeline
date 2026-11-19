import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ExamplePage from "@/app/example/page";

describe("page /example (présentation → service → données)", () => {
  it("affiche la valeur venue de la couche données", () => {
    const html = renderToStaticMarkup(createElement(ExamplePage));
    expect(html).toContain("<p>data</p>");
  });
});
