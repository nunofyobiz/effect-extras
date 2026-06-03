import { Array, Number, Order, pipe } from "effect";
import { describe, expect, test } from "vitest";
import {
  fromNullableOrThrow,
  lift,
  map,
  match,
  nullableOrder,
} from "./NonNullableX";

describe("Nullable utils", () => {
  describe("fromNullableOrThrow", () => {
    test("not null", () => {
      expect(fromNullableOrThrow("value")).toBe("value");
    });

    test("null", () => {
      expect(() => fromNullableOrThrow(null)).toThrow(
        "Value is nullable: null",
      );

      expect(() => fromNullableOrThrow(null, "varName")).toThrow(
        "Value is nullable: null (variable name: varName)",
      );
    });

    test("undefined", () => {
      expect(() => fromNullableOrThrow(undefined)).toThrow(
        "Value is nullable: undefined",
      );

      expect(() => fromNullableOrThrow(undefined, "varName")).toThrow(
        "Value is nullable: undefined (variable name: varName)",
      );
    });
  });

  describe("match", () => {
    test("not null", () => {
      const result = match("value", {
        whenNullable: () => "nullable",
        whenNotNullable: (value) => value,
      });

      expect(result).toBe("value");
    });

    test("null", () => {
      const result = match(null, {
        whenNullable: () => "nullable",
        whenNotNullable: (value) => value,
      });

      expect(result).toBe("nullable");
    });

    test("undefined", () => {
      const result = match(undefined, {
        whenNullable: () => "nullable",
        whenNotNullable: (value) => value,
      });

      expect(result).toBe("nullable");
    });

    test("falsy value", () => {
      const result = match("", {
        whenNullable: () => "nullable",
        whenNotNullable: (value) => value,
      });

      expect(result).toBe("");
    });

    test("false", () => {
      const result = match(false, {
        whenNullable: () => "nullable",
        whenNotNullable: (value) => `boolean: ${value}`,
      });

      expect(result).toBe("boolean: false");
    });

    test("works data-first or data-last", () => {
      // Data-first
      expect(
        match({
          whenNullable: () => "null",
          whenNotNullable: (value) => value,
        })(null),
      ).toBe("null");

      // Data-last
      expect(
        pipe(
          null,
          match({
            whenNullable: () => "null",
            whenNotNullable: (value) => value,
          }),
        ),
      ).toBe("null");
    });
  });

  describe("map", () => {
    test("null", () => {
      expect(map(null, (v: number) => v + 1)).toBeNull();
    });

    test("undefined", () => {
      expect(map(undefined, (v: number) => v + 1)).toBeUndefined();
    });

    test("number", () => {
      expect(map(1, (v: number) => v + 1)).toBe(2);
    });

    test("works data-first or data-last", () => {
      // Data-first
      expect(map(1, (v: number) => v + 1)).toBe(2);

      // Data-last
      expect(
        pipe(
          1,
          map((v: number) => v + 1),
        ),
      ).toBe(2);
    });
  });

  describe("lift", () => {
    test("on non-nullable", () => {
      expect(pipe(1, lift(Number.sum(1)))).toBe(2);
    });

    test("on undefined", () => {
      expect(pipe(undefined, lift(Number.sum(1)))).toBeUndefined();
    });

    test("on null", () => {
      expect(pipe(null, lift(Number.sum(1)))).toBeNull();
    });
  });

  describe("nullableOrder", () => {
    test("strategy: value-null", () => {
      const nullableNumberOrder = nullableOrder("value-null")(Order.Number);

      expect(
        pipe([null, 1, 3, null, 2], Array.sort(nullableNumberOrder)),
      ).toStrictEqual([1, 2, 3, null, null]);
    });

    test("strategy: null-value", () => {
      const nullableNumberOrder = nullableOrder("null-value")(Order.Number);

      expect(
        pipe([null, 1, 3, null, 2], Array.sort(nullableNumberOrder)),
      ).toStrictEqual([null, null, 1, 2, 3]);
    });
  });
});
