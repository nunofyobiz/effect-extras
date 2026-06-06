import { Predicate, pipe } from "effect";
import { describe, expect, test } from "vitest";
import { isNonEmptyString, matchRefine, unsafeIsRecord } from "./PredicateX.js";

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

    test("data-last (piped) matching value", () => {
      const result = pipe(
        "hello",
        matchRefine(Predicate.isString, {
          whenTrue: (value) => `String: ${value}`,
          whenFalse: () => "Not a string",
        }),
      );
      expect(result).toBe("String: hello");
    });

    test("data-last (piped) non-matching value", () => {
      const result = pipe(
        42,
        matchRefine(Predicate.isString, {
          whenTrue: (value) => `String: ${value}`,
          whenFalse: () => "Not a string",
        }),
      );
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

  describe("unsafeIsRecord", () => {
    test("plain objects", () => {
      expect(unsafeIsRecord({})).toBe(true);
      expect(unsafeIsRecord({ a: 1 })).toBe(true);
      expect(unsafeIsRecord(Object.create(null))).toBe(true);
    });

    test("arrays, null, undefined, and primitives", () => {
      expect(unsafeIsRecord([])).toBe(false);
      expect(unsafeIsRecord([1, 2, 3])).toBe(false);
      expect(unsafeIsRecord(null)).toBe(false);
      expect(unsafeIsRecord(undefined)).toBe(false);
      expect(unsafeIsRecord("x")).toBe(false);
      expect(unsafeIsRecord(123)).toBe(false);
      expect(unsafeIsRecord(true)).toBe(false);
    });

    test("rules out Map, Set, Date, RegExp, and custom-prototype objects", () => {
      expect(unsafeIsRecord(new Map())).toBe(false);
      expect(unsafeIsRecord(new Set())).toBe(false);
      expect(unsafeIsRecord(new Date())).toBe(false);
      expect(unsafeIsRecord(new Error("boom"))).toBe(false);
      expect(unsafeIsRecord(/re/u)).toBe(false);
      expect(unsafeIsRecord(Object.create({ inherited: true }))).toBe(false);
    });
  });
});
