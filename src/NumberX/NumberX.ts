import { Number as EffectNumber, Option, pipe } from "effect";
import { dual } from "effect/Function";

// Internal — used by unsafeLogBase.
const logBase = dual<
  // Data-last typing
  (base: number) => (number: number) => Option.Option<number>,
  // Data-first typing
  (number: number, base: number) => Option.Option<number>
>(2, (number: number, base: number): Option.Option<number> => {
  if (number <= 0) {
    return Option.none();
  }

  if (base <= 0 || base === 1) {
    return Option.none();
  }

  if (base < 1 && number >= 1) {
    return Option.none();
  }

  if (base >= 1 && number < 1) {
    return Option.none();
  }

  return Option.some(Math.log(number) / Math.log(base));
});

export const unsafeLogBase = dual<
  (base: number) => (number: number) => number,
  (number: number, base: number) => number
>(2, (number: number, base: number): number =>
  Option.getOrThrowWith(
    logBase(number, base),
    () => new Error(`Error calculating log base ${base} of ${number}`),
  ),
);

/**
 * Converts a number to a percentage of some total.
 *
 * Internal — used by unsafeToPercentOf.
 */
const toPercentOf = dual<
  // Data-last typing
  (total: number) => (numerator: number) => Option.Option<number>,
  // Data-first typing
  (numerator: number, total: number) => Option.Option<number>
>(
  2,
  (numerator: number, total: number): Option.Option<number> =>
    pipe(
      EffectNumber.divide(numerator, total),
      Option.map((ratio) => ratio * 100),
    ),
);

/**
 * Same as {@link toPercentOf} but will throw an error for division by zero
 */
export const unsafeToPercentOf = dual<
  // Data-last typing
  (total: number) => (numerator: number) => number,
  // Data-first typing
  (numerator: number, total: number) => number
>(2, (numerator: number, total: number): number =>
  Option.getOrThrowWith(
    toPercentOf(numerator, total),
    () => new Error(`Division by zero when dividing ${numerator} by ${total}`),
  ),
);

export const toFixed = dual<
  (numberDigits: number) => (number: number) => string,
  (number: number, numberDigits: number) => string
>(2, (number: number, numberDigits: number): string =>
  number.toFixed(numberDigits),
);

/**
 * Rounds a number to a certain number of decimal places
 * See https://stackoverflow.com/a/29494612/22875620
 */
export const roundToDigits = dual<
  // Data-last typing
  (numberDigits: number) => (number: number) => number,
  // Data-first typing
  (number: number, numberDigits: number) => number
>(2, (number: number, numberDigits: number): number =>
  Number(number.toFixed(numberDigits)),
);

/**
 * Pads a number with zeroes to the left
 * until a certain number of digits are reached
 *
 * If the number is already longer than the number of digits,
 * it is returned unchanged
 */
export const padLeftZeroes = dual<
  (numberDigits: number) => (number: number) => string,
  (number: number, numberDigits: number) => string
>(2, (number: number, numberDigits: number): string =>
  number.toString().padStart(numberDigits, "0"),
);

/**
 * Just does +1
 *
 * Converts a 0-indexed value to a 1-indexed value
 * which is useful for UI presentation (eg. step index 0 is presented as "Step 1")
 */
export const indexToRank = (index: number): number => index + 1;

const EXCEL_COLUMNS_BASE_CHARS = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];

export const indexToExcel = (index: number): Option.Option<string> => {
  if (index < 0) {
    return Option.none();
  }

  const baseChars = EXCEL_COLUMNS_BASE_CHARS;

  let excel = "";
  const base = baseChars.length;
  do {
    excel = baseChars[index % base] + excel;
    index = Math.floor(index / base) - 1;
  } while (index >= 0);

  return Option.some(excel);
};
