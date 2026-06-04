/**
 * Generic, framework-agnostic extensions to Effect's `Number` module.
 *
 * @since 0.0.0
 */
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

/**
 * Computes the logarithm of `number` in the given `base`, throwing when the
 * inputs fall outside the domain of `log`.
 *
 * Throws when `number <= 0`, when `base` is `<= 0` or `1`, or when `number` and
 * `base` sit on opposite sides of `1` (a fractional base with `number >= 1`, or
 * a base `>= 1` with `number < 1`) — cases where the real logarithm is
 * undefined or non-finite. Reach for it only when the inputs are already known
 * to be valid.
 *
 * @example
 * ```ts
 * import { pipe } from "effect"
 * import { NumberX } from "@nunofyobiz/effect-extras"
 *
 * // data-first
 * assert.deepStrictEqual(NumberX.unsafeLogBase(8, 2), 3)
 * assert.deepStrictEqual(NumberX.unsafeLogBase(100, 10), 2)
 *
 * // data-last (piped)
 * assert.deepStrictEqual(pipe(8, NumberX.unsafeLogBase(2)), 3)
 *
 * // throws outside the domain of log
 * assert.throws(() => NumberX.unsafeLogBase(0, 2))
 * ```
 *
 * @category unsafe
 * @since 0.0.0
 */
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
 * Expresses `numerator` as a percentage of `total`, throwing on division by
 * zero.
 *
 * Returns `(numerator / total) * 100`. When `total` is `0` the percentage is
 * undefined, so this throws rather than returning `Infinity` or `NaN` — use it
 * only when `total` is known to be non-zero.
 *
 * @example
 * ```ts
 * import { pipe } from "effect"
 * import { NumberX } from "@nunofyobiz/effect-extras"
 *
 * // data-first
 * assert.deepStrictEqual(NumberX.unsafeToPercentOf(1, 2), 50)
 * assert.deepStrictEqual(NumberX.unsafeToPercentOf(2, 1), 200)
 *
 * // data-last (piped)
 * assert.deepStrictEqual(pipe(1, NumberX.unsafeToPercentOf(2)), 50)
 *
 * // throws on division by zero
 * assert.throws(() => NumberX.unsafeToPercentOf(1, 0))
 * ```
 *
 * @category unsafe
 * @since 0.0.0
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

/**
 * Formats `number` with a fixed number of decimal places, returning a `string`.
 *
 * A pipeable wrapper around `Number.prototype.toFixed` — the result is rounded
 * (not truncated) to `numberDigits` decimals and always carries exactly that
 * many digits after the point.
 *
 * @example
 * ```ts
 * import { pipe } from "effect"
 * import { NumberX } from "@nunofyobiz/effect-extras"
 *
 * // data-first
 * assert.deepStrictEqual(NumberX.toFixed(3.236242, 2), "3.24")
 *
 * // data-last (piped)
 * assert.deepStrictEqual(pipe(3.236242, NumberX.toFixed(0)), "3")
 * ```
 *
 * @category conversions
 * @since 0.0.0
 */
export const toFixed = dual<
  (numberDigits: number) => (number: number) => string,
  (number: number, numberDigits: number) => string
>(2, (number: number, numberDigits: number): string =>
  number.toFixed(numberDigits),
);

/**
 * Rounds `number` to a fixed number of decimal places, returning a `number`.
 *
 * Unlike {@link toFixed}, the result stays a `number` (no trailing zeroes) — it
 * formats via `toFixed` then parses back, which sidesteps the usual
 * floating-point rounding artifacts. See
 * https://stackoverflow.com/a/29494612/22875620.
 *
 * @example
 * ```ts
 * import { pipe } from "effect"
 * import { NumberX } from "@nunofyobiz/effect-extras"
 *
 * // data-first
 * assert.deepStrictEqual(NumberX.roundToDigits(3.236242, 2), 3.24)
 *
 * // data-last (piped)
 * assert.deepStrictEqual(pipe(3.736242, NumberX.roundToDigits(0)), 4)
 * ```
 *
 * @category mapping
 * @since 0.0.0
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
 * Renders `number` as a `string`, left-padded with zeroes to at least
 * `numberDigits` characters.
 *
 * If the number's string representation is already as long as (or longer than)
 * `numberDigits`, it is returned unchanged.
 *
 * @example
 * ```ts
 * import { pipe } from "effect"
 * import { NumberX } from "@nunofyobiz/effect-extras"
 *
 * // data-first
 * assert.deepStrictEqual(NumberX.padLeftZeroes(1, 3), "001")
 *
 * // longer than the target width is returned unchanged
 * assert.deepStrictEqual(NumberX.padLeftZeroes(1000, 3), "1000")
 *
 * // data-last (piped)
 * assert.deepStrictEqual(pipe(10, NumberX.padLeftZeroes(3)), "010")
 * ```
 *
 * @category conversions
 * @since 0.0.0
 */
export const padLeftZeroes = dual<
  (numberDigits: number) => (number: number) => string,
  (number: number, numberDigits: number) => string
>(2, (number: number, numberDigits: number): string =>
  number.toString().padStart(numberDigits, "0"),
);

/**
 * Converts a `0`-indexed value to its `1`-indexed rank by adding `1`.
 *
 * Handy for presentation where humans count from one (e.g. the element at
 * index `0` is shown as "item 1").
 *
 * @example
 * ```ts
 * import { NumberX } from "@nunofyobiz/effect-extras"
 *
 * assert.deepStrictEqual(NumberX.indexToRank(0), 1)
 * assert.deepStrictEqual(NumberX.indexToRank(4), 5)
 * ```
 *
 * @category mapping
 * @since 0.0.0
 */
export const indexToRank = (index: number): number => index + 1;

const EXCEL_COLUMNS_BASE_CHARS = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];

/**
 * Converts a `0`-indexed column number into its bijective base-26 spreadsheet
 * label (`A`, `B`, …, `Z`, `AA`, `AB`, …).
 *
 * Returns `None` for a negative `index`; every non-negative index maps to a
 * `Some` label. Indexing is `0`-based here, so `0` is `"A"` and `25` is `"Z"`,
 * unlike the `1`-based numbering shown in most spreadsheet references.
 *
 * @example
 * ```ts
 * import { Option } from "effect"
 * import { NumberX } from "@nunofyobiz/effect-extras"
 *
 * assert.deepStrictEqual(NumberX.indexToExcel(0), Option.some("A"))
 * assert.deepStrictEqual(NumberX.indexToExcel(26), Option.some("AA"))
 * assert.deepStrictEqual(NumberX.indexToExcel(-1), Option.none())
 * ```
 *
 * @category conversions
 * @since 0.0.0
 */
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
