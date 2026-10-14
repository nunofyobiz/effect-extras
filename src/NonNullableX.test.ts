import { Array, Number, Order, pipe } from "effect";
import { describe, expect, expectTypeOf, test, vi } from "vitest";
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

    test("removes both nullish types", () => {
      const requireSetting = (value: string | null | undefined) => {
        const result = fromNullableOrThrow(value);
        expectTypeOf(result).toEqualTypeOf<string>();
        return result;
      };

      expect(requireSetting("help@example.com")).toBe("help@example.com");
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

    test.each([null, undefined])(
      "selects the nullable handler for %s",
      (value) => {
        const handlers = {
          whenNullable: vi.fn(() => "nullable"),
          whenNotNullable: vi.fn(() => "present"),
        };

        expect(match(value, handlers)).toBe("nullable");
        expect(handlers.whenNullable).toHaveBeenCalledExactlyOnceWith();
        expect(handlers.whenNotNullable).not.toHaveBeenCalled();
      },
    );

    test("selects the present handler with the original value", () => {
      const value = { nickname: "Mira" };
      const handlers = {
        whenNullable: vi.fn(() => "Guest"),
        whenNotNullable: vi.fn((value: { nickname: string }) => value.nickname),
      };

      expect(match(value, handlers)).toBe("Mira");
      expect(handlers.whenNotNullable).toHaveBeenCalledExactlyOnceWith(value);
      expect(handlers.whenNotNullable.mock.calls[0]?.[0]).toBe(value);
      expect(handlers.whenNullable).not.toHaveBeenCalled();
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

    test.each([
      { value: "Mira", expected: "Hello, Mira" },
      { value: null, expected: "Guest" },
      { value: undefined, expected: "Guest" },
    ])(
      "call styles agree for $value with narrowed callbacks",
      ({ value, expected }) => {
        const dataFirst = match(value, {
          whenNullable: () => "Guest",
          whenNotNullable: (nickname) => {
            expectTypeOf(nickname).toEqualTypeOf<string>();
            return `Hello, ${nickname}`;
          },
        });
        const dataLast = pipe(
          value,
          match<string | null | undefined, string>({
            whenNullable: () => "Guest",
            whenNotNullable: (nickname) => {
              expectTypeOf(nickname).toEqualTypeOf<string>();
              return `Hello, ${nickname}`;
            },
          }),
        );

        expect(dataFirst).toBe(expected);
        expect(dataLast).toBe(expected);
        expect(dataFirst).toBe(dataLast);
      },
    );
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

    test.each([
      { value: 1, expected: 2 },
      { value: null, expected: null },
      { value: undefined, expected: undefined },
    ])(
      "call styles agree for $value with narrowed callbacks",
      ({ value, expected }) => {
        const dataFirst = map(value, (value) => {
          expectTypeOf(value).toEqualTypeOf<number>();
          return value + 1;
        });
        const dataLast = pipe(
          value,
          map<number | null | undefined, number>((value) => {
            expectTypeOf(value).toEqualTypeOf<number>();
            return value + 1;
          }),
        );

        expect(dataFirst).toBe(expected);
        expect(dataLast).toBe(expected);
        expect(dataFirst).toBe(dataLast);
      },
    );

    test.each([null, undefined])("skips the transform for %s", (value) => {
      const transform = vi.fn((value: { street: string }) => value.street);

      expect(map(value, transform)).toBe(value);
      expect(transform).not.toHaveBeenCalled();
    });

    test("transforms the original present value once", () => {
      const value = { street: "12 Oak Street" };
      const transform = vi.fn((value: { street: string }) => value.street);

      expect(map(value, transform)).toBe("12 Oak Street");
      expect(transform).toHaveBeenCalledExactlyOnceWith(value);
      expect(transform.mock.calls[0]?.[0]).toBe(value);
    });

    test("preserves only the applicable nullish result types in both call styles", () => {
      const present = (value: string) => {
        const result = map(value, (value) => value.length);
        expectTypeOf(result).toEqualTypeOf<number>();
        expectTypeOf(
          pipe(
            value,
            map<string, number>((value) => value.length),
          ),
        ).toEqualTypeOf<number>();
        return result;
      };
      const nullable = (value: string | null) => {
        const result = map(value, (value) => value.length);
        expectTypeOf(result).toEqualTypeOf<number | null>();
        expectTypeOf(
          pipe(
            value,
            map<string | null, number>((value) => value.length),
          ),
        ).toEqualTypeOf<number | null>();
        return result;
      };
      const optional = (value: string | undefined) => {
        const result = map(value, (value) => value.length);
        expectTypeOf(result).toEqualTypeOf<number | undefined>();
        expectTypeOf(
          pipe(
            value,
            map<string | undefined, number>((value) => value.length),
          ),
        ).toEqualTypeOf<number | undefined>();
        return result;
      };
      const nullish = (value: string | null | undefined) => {
        const result = map(value, (value) => value.length);
        expectTypeOf(result).toEqualTypeOf<number | null | undefined>();
        expectTypeOf(
          pipe(
            value,
            map<string | null | undefined, number>((value) => value.length),
          ),
        ).toEqualTypeOf<number | null | undefined>();
        return result;
      };

      expect(present("Mira")).toBe(4);
      expect(nullable(null)).toBeNull();
      expect(optional(undefined)).toBeUndefined();
      expect(nullish("Mira")).toBe(4);
    });
  });

  describe("lift", () => {
    test.each([null, undefined])("skips the transform for %s", (value) => {
      const transform = vi.fn((value: { nickname: string }) => value.nickname);

      expect(lift(transform)(value)).toBe(value);
      expect(transform).not.toHaveBeenCalled();
    });

    test("transforms the original present value once", () => {
      const value = { nickname: "Mira" };
      const transform = vi.fn((value: { nickname: string }) => value.nickname);

      expect(lift(transform)(value)).toBe("Mira");
      expect(transform).toHaveBeenCalledExactlyOnceWith(value);
      expect(transform.mock.calls[0]?.[0]).toBe(value);
    });
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
    test.each<{
      strategy: "value-null" | "null-value";
      nullAgainstValue: number;
      valueAgainstNull: number;
    }>([
      { strategy: "value-null", nullAgainstValue: 1, valueAgainstNull: -1 },
      { strategy: "null-value", nullAgainstValue: -1, valueAgainstNull: 1 },
    ])(
      "call styles agree for $strategy",
      ({ strategy, nullAgainstValue, valueAgainstNull }) => {
        const dataFirst = nullableOrder(Order.Number, strategy);
        const dataLast = pipe(Order.Number, nullableOrder(strategy));
        const cases: readonly (readonly [
          number | null,
          number | null,
          number,
        ])[] = [
          [2, 2, 0],
          [1, 2, -1],
          [2, 1, 1],
          [null, 2, nullAgainstValue],
          [2, null, valueAgainstNull],
          [null, null, 0],
        ];

        for (const [left, right, expected] of cases) {
          expect(dataFirst(left, right)).toBe(expected);
          expect(dataLast(left, right)).toBe(expected);
          expect(dataFirst(left, right)).toBe(dataLast(left, right));
        }

        expect(Array.sort([], dataFirst)).toStrictEqual([]);
        expect(Array.sort([2], dataFirst)).toStrictEqual([2]);
        expect(Array.sort([null], dataFirst)).toStrictEqual([null]);
      },
    );

    test.each<{
      strategy: "value-null" | "null-value";
      expected: (number | null)[];
    }>([
      { strategy: "value-null", expected: [3, 2, 1, null, null] },
      { strategy: "null-value", expected: [null, null, 3, 2, 1] },
    ])(
      "preserves descending present order for $strategy",
      ({ strategy, expected }) => {
        const order = nullableOrder(Order.flip(Order.Number), strategy);

        expect(Array.sort([null, 1, 3, null, 2], order)).toStrictEqual(
          expected,
        );
      },
    );
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

      // @ts-expect-error - undefined against a number is outside the nulls-last comparator's domain
      expect(nullsLast(undefined, 0)).toBe(1);
      // @ts-expect-error - undefined against null is outside the nulls-last comparator's domain
      expect(nullsLast(undefined, null)).toBe(0);
      expect(nullsLast(0, 1)).toBe(-1);
      // @ts-expect-error - undefined against a number is outside the nulls-first comparator's domain
      expect(nullsFirst(undefined, 0)).toBe(-1);
      expect(nullsFirst(0, 1)).toBe(-1);
      expect(nullsLast(globalThis.Number.NaN, null)).toBe(-1);
      expect(nullableOrder(Order.String, "value-null")("", null)).toBe(-1);
      expect(nullableOrder(Order.Boolean, "null-value")(false, null)).toBe(1);
    });
  });
});
