import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Example } from "@/components/example";

describe("Example (présentation)", () => {
  it("affiche le message reçu", () => {
    const html = renderToStaticMarkup(createElement(Example, { message: "ok" }));
    expect(html).toBe("<p>ok</p>");
  });
});
