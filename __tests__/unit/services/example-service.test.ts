import { describe, expect, it } from "vitest";
import { getExample } from "@/services/example-service";

describe("getExample (service)", () => {
  it("renvoie la valeur fournie par la couche données", () => {
    expect(getExample()).toBe("data");
  });
});
