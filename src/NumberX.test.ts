import { describe, expect, test } from "vitest";
import { Option } from "effect";
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
    expect(indexToExcel(Number.NaN)).toStrictEqual(Option.some("undefined"));
    expect(indexToExcel(26.5)).toStrictEqual(Option.some("Aundefined"));
  });
});
