import { Predicate, pipe } from "effect";
import { describe, expect, expectTypeOf, test, vi } from "vitest";
import { isNonEmptyString, matchRefine, unsafeIsRecord } from "./PredicateX.js";

describe("PredicateX", () => {
  describe("matchRefine", () => {
    test("matching value", () => {
      const handlers = {
        whenTrue: vi.fn((value: string) => `String: ${value}`),
        whenFalse: vi.fn(() => "Not a string"),
      };
      const result = matchRefine("hello", Predicate.isString, handlers);
      expect(result).toBe("String: hello");
      expect(handlers.whenTrue).toHaveBeenCalledExactlyOnceWith("hello");
      expect(handlers.whenTrue.mock.calls).toStrictEqual([["hello"]]);
      expect(handlers.whenFalse).not.toHaveBeenCalled();

      vi.clearAllMocks();
      const piped = pipe("hello", matchRefine(Predicate.isString, handlers));
      expect(piped).toBe(result);
      expect(piped).toBe("String: hello");
      expect(handlers.whenTrue).toHaveBeenCalledExactlyOnceWith("hello");
      expect(handlers.whenTrue.mock.calls).toStrictEqual([["hello"]]);
      expect(handlers.whenFalse).not.toHaveBeenCalled();
    });

    test("not matching value", () => {
      const handlers = {
        whenTrue: vi.fn((value: string) => `String: ${value}`),
        whenFalse: vi.fn(() => "Not a string"),
      };
      const result = matchRefine(42, Predicate.isString, handlers);
      expect(result).toBe("Not a string");
      expect(handlers.whenFalse).toHaveBeenCalledTimes(1);
      expect(handlers.whenFalse.mock.calls).toStrictEqual([[]]);
      expect(handlers.whenTrue).not.toHaveBeenCalled();

      vi.clearAllMocks();
      const piped = pipe(42, matchRefine(Predicate.isString, handlers));
      expect(piped).toBe(result);
      expect(piped).toBe("Not a string");
      expect(handlers.whenFalse).toHaveBeenCalledTimes(1);
      expect(handlers.whenFalse.mock.calls).toStrictEqual([[]]);
      expect(handlers.whenTrue).not.toHaveBeenCalled();
    });

    test("passes the original refined object to the true handler", () => {
      const settings = { theme: "dark" };
      const handlers = {
        whenFalse: vi.fn(() => "false"),
        whenTrue: vi.fn((value: Record<string, unknown>) => value.theme),
      };
      const result = matchRefine(settings, unsafeIsRecord, handlers);
      expect(result).toBe("dark");
      expect(handlers.whenTrue).toHaveBeenCalledTimes(1);
      expect(handlers.whenTrue.mock.calls).toStrictEqual([[settings]]);
      expect(handlers.whenTrue.mock.calls[0]?.[0]).toBe(settings);
      expect(handlers.whenFalse).not.toHaveBeenCalled();

      vi.clearAllMocks();
      const piped = pipe(settings, matchRefine(unsafeIsRecord, handlers));
      expect(piped).toBe(result);
      expect(handlers.whenTrue).toHaveBeenCalledTimes(1);
      expect(handlers.whenTrue.mock.calls).toStrictEqual([[settings]]);
      expect(handlers.whenTrue.mock.calls[0]?.[0]).toBe(settings);
      expect(handlers.whenFalse).not.toHaveBeenCalled();
    });

    test("infers handler parameters and results in both call styles", () => {
      const result = matchRefine("hello", Predicate.isString, {
        whenTrue: (value) => {
          expectTypeOf(value).toEqualTypeOf<string>();
          return value.length;
        },
        whenFalse: (...arguments_) => {
          expectTypeOf(arguments_).toEqualTypeOf<[]>();
          return 0;
        },
      });
      const piped = pipe(
        "hello",
        matchRefine(Predicate.isString, {
          whenTrue: (value) => {
            expectTypeOf(value).toEqualTypeOf<string>();
            return value.length;
          },
          whenFalse: (...arguments_) => {
            expectTypeOf(arguments_).toEqualTypeOf<[]>();
            return 0;
          },
        }),
      );
      expectTypeOf(result).toEqualTypeOf<number>();
      expectTypeOf(piped).toEqualTypeOf<number>();
      expect(result).toBe(5);
      expect(piped).toBe(result);
    });

    test("rejects null and undefined at runtime outside the refinement domain", () => {
      const refinement: Predicate.Refinement<string | number, string> =
        Predicate.isString;
      const handlers = {
        whenTrue: (value: string) => `String: ${value}`,
        whenFalse: () => "Not a string",
      };
      // @ts-expect-error - null is outside the string | number domain
      const directNull = matchRefine(null, refinement, handlers);
      const pipedNull = pipe(
        // @ts-expect-error - null cannot enter the string | number refinement
        null,
        matchRefine(refinement, handlers),
      );
      // @ts-expect-error - undefined is outside the string | number domain
      const directUndefined = matchRefine(undefined, refinement, handlers);
      const pipedUndefined = pipe(
        // @ts-expect-error - undefined cannot enter the string | number refinement
        undefined,
        matchRefine(refinement, handlers),
      );
      expect(directNull).toBe("Not a string");
      expect(pipedNull).toBe(directNull);
      expect(directUndefined).toBe("Not a string");
      expect(pipedUndefined).toBe(directUndefined);
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

    test("single-character and whitespace-only strings", () => {
      expect(isNonEmptyString("a")).toBe(true);
      expect(isNonEmptyString("   ")).toBe(true);
      expect(isNonEmptyString("\t\n")).toBe(true);
    });

    test("narrows unknown to string", () => {
      const value: unknown = "Ada";
      expect(isNonEmptyString(value)).toBe(true);
      if (isNonEmptyString(value)) {
        expectTypeOf(value).toEqualTypeOf<string>();
      }
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
      expect(
        unsafeIsRecord(Object.create(null, { theme: { value: "dark" } })),
      ).toBe(true);
    });

    test("accepts symbol keys and does not validate values", () => {
      expect(unsafeIsRecord({ [Symbol("setting")]: "dark" })).toBe(true);
      expect(
        unsafeIsRecord({
          missing: undefined,
          callback: () => "dark",
          date: new Date(),
        }),
      ).toBe(true);
    });

    test("narrows unknown to Record<string, unknown>", () => {
      const value: unknown = { theme: "dark" };
      expect(unsafeIsRecord(value)).toBe(true);
      if (unsafeIsRecord(value)) {
        expectTypeOf(value).toEqualTypeOf<Record<string, unknown>>();
      }
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
      class Example {
        readonly example = true;
      }

      expect(unsafeIsRecord(new Map())).toBe(false);
      expect(unsafeIsRecord(new Set())).toBe(false);
      expect(unsafeIsRecord(new Date())).toBe(false);
      expect(unsafeIsRecord(new Error("boom"))).toBe(false);
      expect(unsafeIsRecord(/re/u)).toBe(false);
      expect(unsafeIsRecord(Object.create({ inherited: true }))).toBe(false);
      expect(unsafeIsRecord(new Example())).toBe(false);
    });
  });
});
