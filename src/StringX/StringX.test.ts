import { pipe } from "effect";
import { describe, expect, test } from "vitest";
import { ensurePrepend, prepend, surround } from "./StringX";

describe("String utils", () => {
  describe("prepend", () => {
    test("works", () => {
      expect(pipe("pray", prepend("eat"))).toBe("eatpray");
    });

    test("data-first form", () => {
      expect(prepend("pray", "eat")).toBe("eatpray");
    });
  });

  describe("surround", () => {
    test("works", () => {
      expect(pipe("pray", surround("eat", "love"))).toBe("eatpraylove");
    });

    test("data-first form", () => {
      expect(surround("pray", "eat", "love")).toBe("eatpraylove");
    });
  });

  describe("ensurePrepend", () => {
    test("does not already start with", () => {
      expect(pipe("pray", ensurePrepend("eat"))).toBe("eatpray");
    });

    test("already starts with", () => {
      expect(pipe("eatpray", ensurePrepend("eat"))).toBe("eatpray");
    });

    test("data-first form", () => {
      expect(ensurePrepend("pray", "eat")).toBe("eatpray");
      expect(ensurePrepend("eatpray", "eat")).toBe("eatpray");
    });
  });
});
