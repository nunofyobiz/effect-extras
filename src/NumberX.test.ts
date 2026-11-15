import { describe, expect, test } from "vitest";
import { Option, pipe } from "effect";
import {
  indexToExcel,
  indexToRank,
  padLeftZeroes,
  roundToDigits,
  toFixed,
  unsafeLogBase,
  unsafeToPercentOf,
} from "./NumberX.js";

describe("lib/number", () => {
  test("unsafeLogBase", () => {
    // Valid cases
    expect(unsafeLogBase(8, 2)).toBe(3);
    expect(unsafeLogBase(100, 10)).toBe(2);
    expect(unsafeLogBase(0.25, 0.5)).toBe(2);

    // Error cases should throw with full error message including numbers
    expect(() => unsafeLogBase(0, 2)).toThrow(
      "Error calculating log base 2 of 0",
    );
    expect(() => unsafeLogBase(-1, 2)).toThrow(
      "Error calculating log base 2 of -1",
    );
    expect(() => unsafeLogBase(8, 0)).toThrow(
      "Error calculating log base 0 of 8",
    );
    expect(() => unsafeLogBase(8, -2)).toThrow(
      "Error calculating log base -2 of 8",
    );
    expect(() => unsafeLogBase(8, 1)).toThrow(
      "Error calculating log base 1 of 8",
    );
    expect(() => unsafeLogBase(1, 0.5)).toThrow(
      "Error calculating log base 0.5 of 1",
    );
    expect(() => unsafeLogBase(0.5, 2)).toThrow(
      "Error calculating log base 2 of 0.5",
    );

    expect(unsafeLogBase(1, 2)).toBe(0);
    expect(() => unsafeLogBase(-0, 2)).toThrow(
      "Error calculating log base 2 of 0",
    );
    expect(Number.isNaN(unsafeLogBase(Number.NaN, 2))).toBe(true);
    expect(Number.isNaN(unsafeLogBase(8, Number.NaN))).toBe(true);
    expect(unsafeLogBase(Infinity, 2)).toBe(Infinity);
    expect(unsafeLogBase(8, Infinity)).toBe(0);
    expect(() => unsafeLogBase(Infinity, 0.5)).toThrow(
      "Error calculating log base 0.5 of Infinity",
    );
    expect(() => unsafeLogBase(0.5, Infinity)).toThrow(
      "Error calculating log base Infinity of 0.5",
    );
  });

  test("unsafeToPercentOf", () => {
    expect(unsafeToPercentOf(0, 1)).toBe(0);
    expect(unsafeToPercentOf(0, 2)).toBe(0);

    expect(unsafeToPercentOf(1, 1)).toBe(100);
    expect(unsafeToPercentOf(1, 2)).toBe(50);

    expect(unsafeToPercentOf(2, 1)).toBe(200);
    expect(unsafeToPercentOf(2, 2)).toBe(100);

    expect(() => unsafeToPercentOf(1, 0)).toThrow(/Division by zero/u);
    expect(() => unsafeToPercentOf(0, 0)).toThrow(/Division by zero/u);
    expect(() => unsafeToPercentOf(1, -0)).toThrow(/Division by zero/u);
  });

  test("toFixed", () => {
    expect(toFixed(3.236_242, 3)).toBe("3.236");
    expect(toFixed(3.236_242, 2)).toBe("3.24");
    expect(toFixed(3.236_242, 1)).toBe("3.2");
    expect(toFixed(3.236_242, 0)).toBe("3");

    expect(toFixed(3.736_242, 0)).toBe("4");
  });

  test("roundToDigits", () => {
    expect(roundToDigits(3.236_242, 3)).toBe(3.236);
    expect(roundToDigits(3.236_242, 2)).toBe(3.24);
    expect(roundToDigits(3.236_242, 1)).toBe(3.2);
    expect(roundToDigits(3.236_242, 0)).toBe(3);

    expect(roundToDigits(3.736_242, 0)).toBe(4);

    expect(roundToDigits(-2.5, 0)).toBe(-3);
    expect(roundToDigits(-0.5, 0)).toBe(-1);
    expect(roundToDigits(1.45, 1)).toBe(1.4);
    expect(roundToDigits(2.675, 2)).toBe(2.67);
    expect(Object.is(roundToDigits(-0, 2), 0)).toBe(true);
    expect(Object.is(roundToDigits(-0, 2), -0)).toBe(false);
    expect(roundToDigits(1e21, 2)).toBe(1e21);
  });

  test("padLeftZeroes", () => {
    expect(padLeftZeroes(1, 3)).toBe("001");
    expect(padLeftZeroes(10, 3)).toBe("010");
    expect(padLeftZeroes(100, 3)).toBe("100");
    expect(padLeftZeroes(1000, 3)).toBe("1000");
    expect(padLeftZeroes(-1, 3)).toBe("0-1");
    expect(padLeftZeroes(-0, 3)).toBe("000");
    expect(padLeftZeroes(Number.NaN, 5)).toBe("00NaN");
    expect(padLeftZeroes(Infinity, 3)).toBe("Infinity");
    expect(padLeftZeroes(0.5, 5)).toBe("000.5");
  });

  test("indexToRank", () => {
    expect(indexToRank(0)).toBe(1);
    expect(indexToRank(4)).toBe(5);
    expect(indexToRank(-1)).toBe(0);
  });

  test("indexToExcel", () => {
    // These test cases come from https://www.vishalon.net/blog/excel-column-letter-to-number-quick-reference
    // Just note that here, we are 0-indexed, but their conversion is 1-indexed.

    expect(indexToExcel(-1)).toStrictEqual(Option.none());

    expect(indexToExcel(0)).toStrictEqual(Option.some("A"));
    expect(indexToExcel(25)).toStrictEqual(Option.some("Z"));
    expect(indexToExcel(26)).toStrictEqual(Option.some("AA"));
    expect(indexToExcel(27)).toStrictEqual(Option.some("AB"));

    expect(indexToExcel(701)).toStrictEqual(Option.some("ZZ"));
    expect(indexToExcel(702)).toStrictEqual(Option.some("AAA"));
    expect(indexToExcel(18_277)).toStrictEqual(Option.some("ZZZ"));
    expect(indexToExcel(18_278)).toStrictEqual(Option.some("AAAA"));
    expect(indexToExcel(-Infinity)).toStrictEqual(Option.none());
    expect(indexToExcel(-0)).toStrictEqual(Option.some("A"));
    expect(Option.isSome(indexToExcel(Number.MAX_SAFE_INTEGER))).toBe(true);

    // Only non-negative safe integers identify columns; invalid inputs return None.
    expect(indexToExcel(Number.NaN)).toStrictEqual(Option.none());
    expect(indexToExcel(26.5)).toStrictEqual(Option.none());
    expect(indexToExcel(Infinity)).toStrictEqual(Option.none());
    expect(indexToExcel(0.5)).toStrictEqual(Option.none());
    expect(indexToExcel(-0.5)).toStrictEqual(Option.none());
    expect(indexToExcel(2 ** 53)).toStrictEqual(Option.none());
    // @ts-expect-error - untyped callers can pass null instead of a numeric column index
    expect(indexToExcel(null)).toStrictEqual(Option.none());
  });

  test.each([
    { number: 8, base: 2, expected: 3 },
    { number: 0.5, base: 0.5, expected: 1 },
    { number: 1, base: 2, expected: 0 },
    { number: Number.NaN, base: 0.5, expected: Number.NaN },
    { number: 0.5, base: Number.NaN, expected: Number.NaN },
    { number: Infinity, base: Infinity, expected: Number.NaN },
  ])(
    "unsafeLogBase both forms: $number base $base",
    ({ number, base, expected }) => {
      const dataFirst = unsafeLogBase(number, base);
      expect(dataFirst).toBe(expected);
      expect(pipe(number, unsafeLogBase(base))).toBe(dataFirst);
    },
  );

  test.each([
    { number: -Infinity, base: 2 },
    { number: 8, base: -Infinity },
    { number: 8, base: -0 },
    { number: 2, base: 0.5 },
  ])(
    "unsafeLogBase rejects $number base $base in both forms",
    ({ number, base }) => {
      const message = `Error calculating log base ${base} of ${number}`;
      expect(() => unsafeLogBase(number, base)).toThrow(message);
      expect(() => pipe(number, unsafeLogBase(base))).toThrow(message);
    },
  );

  test("unsafeLogBase rejects an untyped null number through its non-positive rule", () => {
    // @ts-expect-error - null is not a numeric logarithm operand
    expect(() => unsafeLogBase(null, 2)).toThrow(
      "Error calculating log base 2 of null",
    );
  });

  test.each([
    { numerator: 15, total: 60, expected: 25 },
    { numerator: -15, total: 60, expected: -25 },
    { numerator: 15, total: -60, expected: -25 },
    { numerator: -15, total: -60, expected: 25 },
    { numerator: -0, total: 60, expected: -0 },
    { numerator: 0, total: -60, expected: -0 },
    { numerator: 0.5, total: 2.5, expected: 20 },
    { numerator: Number.NaN, total: 60, expected: Number.NaN },
    { numerator: 15, total: Number.NaN, expected: Number.NaN },
    { numerator: Infinity, total: 60, expected: Infinity },
    { numerator: -Infinity, total: 60, expected: -Infinity },
    { numerator: 15, total: Infinity, expected: 0 },
    { numerator: 15, total: -Infinity, expected: -0 },
    { numerator: Infinity, total: Infinity, expected: Number.NaN },
    { numerator: -Infinity, total: -Infinity, expected: Number.NaN },
  ])(
    "unsafeToPercentOf both forms: $numerator of $total",
    ({ numerator, total, expected }) => {
      const dataFirst = unsafeToPercentOf(numerator, total);
      expect(dataFirst).toBe(expected);
      expect(pipe(numerator, unsafeToPercentOf(total))).toBe(dataFirst);
    },
  );

  test.each([0, -0])(
    "unsafeToPercentOf rejects zero total %s in both forms",
    (total) => {
      const message = "Division by zero when dividing 15 by 0";
      expect(() => unsafeToPercentOf(15, total)).toThrow(message);
      expect(() => pipe(15, unsafeToPercentOf(total))).toThrow(message);
    },
  );

  test("unsafeToPercentOf propagates an untyped undefined operand as NaN", () => {
    // @ts-expect-error - undefined is not a numeric percentage operand
    expect(unsafeToPercentOf(undefined, 60)).toBeNaN();
  });

  test.each([
    { number: 12.5, digits: 2, text: "12.50", rounded: 12.5 },
    { number: 0, digits: 2, text: "0.00", rounded: 0 },
    { number: -0, digits: 2, text: "0.00", rounded: 0 },
    { number: -12.5, digits: 2, text: "-12.50", rounded: -12.5 },
    { number: -0.001, digits: 2, text: "-0.00", rounded: -0 },
    { number: Number.NaN, digits: 2, text: "NaN", rounded: Number.NaN },
    { number: Infinity, digits: 2, text: "Infinity", rounded: Infinity },
    { number: -Infinity, digits: 2, text: "-Infinity", rounded: -Infinity },
    { number: 1e21, digits: 2, text: "1e+21", rounded: 1e21 },
    { number: -1e21, digits: 2, text: "-1e+21", rounded: -1e21 },
    {
      number: 1e20,
      digits: 2,
      text: "100000000000000000000.00",
      rounded: 1e20,
    },
    { number: 12.5, digits: 0, text: "13", rounded: 13 },
    { number: 1, digits: 100, text: `1.${"0".repeat(100)}`, rounded: 1 },
    { number: 12.5, digits: 2.9, text: "12.50", rounded: 12.5 },
    { number: 12.5, digits: -0.9, text: "13", rounded: 13 },
    { number: 12.5, digits: Number.NaN, text: "13", rounded: 13 },
    { number: 12.5, digits: -0, text: "13", rounded: 13 },
  ])(
    "formatting both forms: $number with $digits digits",
    ({ number, digits, text, rounded }) => {
      const fixed = toFixed(number, digits);
      expect(fixed).toBe(text);
      expect(pipe(number, toFixed(digits))).toBe(fixed);
      const dataFirst = roundToDigits(number, digits);
      expect(dataFirst).toBe(rounded);
      expect(pipe(number, roundToDigits(digits))).toBe(dataFirst);
    },
  );

  test.each([-1, 101, Infinity, -Infinity])(
    "formatting rejects digit count %s in both forms",
    (digits) => {
      expect(() => toFixed(12.5, digits)).toThrow(RangeError);
      expect(() => pipe(12.5, toFixed(digits))).toThrow(RangeError);
      expect(() => roundToDigits(12.5, digits)).toThrow(RangeError);
      expect(() => pipe(12.5, roundToDigits(digits))).toThrow(RangeError);
    },
  );

  test("formatting rejects untyped null receivers", () => {
    // @ts-expect-error - null has no toFixed method
    expect(() => toFixed(null, 2)).toThrow(TypeError);
    // @ts-expect-error - null has no toFixed method for numeric rounding
    expect(() => roundToDigits(null, 2)).toThrow(TypeError);
    // @ts-expect-error - null has no toString method for padding
    expect(() => padLeftZeroes(null, 5)).toThrow(TypeError);
  });

  test.each([
    { number: 42, width: 5, expected: "00042" },
    { number: 0, width: 3, expected: "000" },
    { number: -Infinity, width: 3, expected: "-Infinity" },
    { number: Infinity, width: 10, expected: "00Infinity" },
    { number: -Infinity, width: 10, expected: "0-Infinity" },
    { number: 42, width: 0, expected: "42" },
    { number: 42, width: -0, expected: "42" },
    { number: 42, width: -5, expected: "42" },
    { number: 42, width: 5.9, expected: "00042" },
    { number: 42, width: Number.NaN, expected: "42" },
    { number: 42, width: -Infinity, expected: "42" },
  ])(
    "padLeftZeroes both forms: $number to width $width",
    ({ number, width, expected }) => {
      const dataFirst = padLeftZeroes(number, width);
      expect(dataFirst).toBe(expected);
      expect(pipe(number, padLeftZeroes(width))).toBe(dataFirst);
    },
  );

  test("padLeftZeroes rejects an infinite positive width in both forms", () => {
    expect(() => padLeftZeroes(42, Infinity)).toThrow(RangeError);
    expect(() => pipe(42, padLeftZeroes(Infinity))).toThrow(RangeError);
  });

  test.each([
    { index: -0, expected: 1 },
    { index: 0.5, expected: 1.5 },
    { index: -1.5, expected: -0.5 },
    { index: Number.NaN, expected: Number.NaN },
    { index: Infinity, expected: Infinity },
    { index: -Infinity, expected: -Infinity },
    { index: Number.MAX_SAFE_INTEGER, expected: 2 ** 53 },
  ])(
    "indexToRank adds one without validating $index",
    ({ index, expected }) => {
      expect(indexToRank(index)).toBe(expected);
    },
  );
});
