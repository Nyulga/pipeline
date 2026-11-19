import { describe, expect, it } from "vitest";
import { readExample } from "@/data/example-repository";

describe("readExample (données)", () => {
  it("renvoie la valeur d'exemple", () => {
    expect(readExample()).toBe("data");
  });
});
