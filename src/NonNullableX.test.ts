import { Array, Number, Order, pipe } from "effect";
import { describe, expect, test } from "vitest";
import {
  fromNullableOrThrow,
  lift,
  map,
  match,
  nullableOrder,
} from "./NonNullableX.js";

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

    test("falsy values are present", () => {
      expect(fromNullableOrThrow(0)).toBe(0);
      expect(fromNullableOrThrow("")).toBe("");
      expect(fromNullableOrThrow(false)).toBe(false);
      expect(
        globalThis.Number.isNaN(fromNullableOrThrow(globalThis.Number.NaN)),
      ).toBe(true);
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

    test("calls the nullable handler with no arguments and the present handler with the value", () => {
      let nullableArguments: [] | undefined;
      let presentArguments: [string] | undefined;
      const handlers = {
        whenNullable: (...arguments_: []) => {
          nullableArguments = arguments_;
          return "nullable";
        },
        whenNotNullable: (...arguments_: [string]) => {
          presentArguments = arguments_;
          return "present";
        },
      };

      expect(match(null, handlers)).toBe("nullable");
      expect(match("value", handlers)).toBe("present");
      expect(nullableArguments).toStrictEqual([]);
      expect(presentArguments).toStrictEqual(["value"]);
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

    test("zero and NaN take the non-nullable branch", () => {
      expect(
        match(0, {
          whenNullable: () => "nullable",
          whenNotNullable: () => "present",
        }),
      ).toBe("present");
      expect(
        match(globalThis.Number.NaN, {
          whenNullable: () => "nullable",
          whenNotNullable: () => "present",
        }),
      ).toBe("present");
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

    test("transforms falsy non-nullish values", () => {
      expect(map(0, (value) => value + 1)).toBe(1);
      expect(map("", (value) => `${value}value`)).toBe("value");
      expect(map(false, (value) => !value)).toBe(true);
      expect(
        globalThis.Number.isNaN(map(globalThis.Number.NaN, (value) => value)),
      ).toBe(true);
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

    test("preserves nullish identity and transforms falsy values", () => {
      const addOne = lift((value: number) => value + 1);
      const nullValue = null;
      const undefinedValue = undefined;

      expect(addOne(nullValue)).toBe(nullValue);
      expect(addOne(undefinedValue)).toBe(undefinedValue);
      expect(addOne(0)).toBe(1);
      expect(lift((value: string) => `${value}value`)("")).toBe("value");
      expect(lift((value: boolean) => !value)(false)).toBe(true);
      expect(
        globalThis.Number.isNaN(
          lift((value: number) => value)(globalThis.Number.NaN),
        ),
      ).toBe(true);
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

    test("orders runtime undefined with null while preserving present values", () => {
      const nullsLast = nullableOrder(Order.Number, "value-null");
      const nullsFirst = nullableOrder(Order.Number, "null-value");

      expect(Reflect.apply(nullsLast, undefined, [undefined, 0])).toBe(1);
      expect(Reflect.apply(nullsLast, undefined, [undefined, null])).toBe(0);
      expect(Reflect.apply(nullsLast, undefined, [0, 1])).toBe(-1);
      expect(Reflect.apply(nullsFirst, undefined, [undefined, 0])).toBe(-1);
      expect(Reflect.apply(nullsFirst, undefined, [0, 1])).toBe(-1);
      expect(
        Reflect.apply(nullsLast, undefined, [globalThis.Number.NaN, null]),
      ).toBe(-1);
      expect(
        Reflect.apply(nullableOrder(Order.String, "value-null"), undefined, [
          "",
          null,
        ]),
      ).toBe(-1);
      expect(
        Reflect.apply(nullableOrder(Order.Boolean, "null-value"), undefined, [
          false,
          null,
        ]),
      ).toBe(1);
    });
  });
});
