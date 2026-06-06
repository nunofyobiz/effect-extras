import { Predicate } from "effect";
import { describe, expect, test } from "vitest";
import { isNonEmptyString, matchRefine } from "./PredicateX.js";

describe("PredicateX", () => {
  describe("matchRefine", () => {
    test("matching value", () => {
      const result = matchRefine("hello", Predicate.isString, {
        whenTrue: (value) => `String: ${value}`,
        whenFalse: () => "Not a string",
      });
      expect(result).toBe("String: hello");
    });

    test("not matching value", () => {
      const result = matchRefine(42, Predicate.isString, {
        whenTrue: (value) => `String: ${value}`,
        whenFalse: () => "Not a string",
      });
      expect(result).toBe("Not a string");
    });
  });

  describe("isNonEmptyString", () => {
    test("null", () => {
      expect(isNonEmptyString(null)).toBe(false);
    });

    test("undefined", () => {
      expect(isNonEmptyString(undefined)).toBe(false);
    });

    test("empty string", () => {
      expect(isNonEmptyString("")).toBe(false);
    });

    test("non-empty string", () => {
      expect(isNonEmptyString("hello")).toBe(true);
    });

    test("other input types", () => {
      expect(isNonEmptyString(123)).toBe(false);

      expect(isNonEmptyString(true)).toBe(false);
      expect(isNonEmptyString(false)).toBe(false);

      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(undefined)).toBe(false);

      expect(isNonEmptyString(new Error("test"))).toBe(false);
      expect(isNonEmptyString(new Date())).toBe(false);

      expect(isNonEmptyString([])).toBe(false);
      expect(isNonEmptyString([1, 2, 3])).toBe(false);

      expect(isNonEmptyString({})).toBe(false);
      expect(isNonEmptyString({ a: 1 })).toBe(false);
    });
  });
});
