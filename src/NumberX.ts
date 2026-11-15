/**
 * Generic, framework-agnostic extensions to Effect's `Number` module.
 *
 * @since 0.0.0
 */
import { Number as EffectNumber, Match, Option, String, pipe } from "effect";
import { dual } from "effect/Function";

// Internal — used by unsafeLogBase.
const logBase = dual<
  // Data-last typing
  (base: number) => (number: number) => Option.Option<number>,
  // Data-first typing
  (number: number, base: number) => Option.Option<number>
>(
  2,
  (number: number, base: number): Option.Option<number> =>
    Match.value({ number, base }).pipe(
      Match.when(
        ({ number }) => number <= 0,
        () => Option.none(),
      ),
      Match.when(
        ({ base }) => base <= 0 || base === 1,
        () => Option.none(),
      ),
      Match.when(
        ({ number, base }) => base < 1 && number >= 1,
        () => Option.none(),
      ),
      Match.when(
        ({ number, base }) => base >= 1 && number < 1,
        () => Option.none(),
      ),
      Match.orElse(() => Option.some(Math.log(number) / Math.log(base))),
    ),
);

/**
 * Computes the logarithm of `number` in the given `base`, for example to count
 * how many doublings produce a given increase.
 *
 * Throws when `number <= 0`, when `base` is `<= 0` or `1`, or when `number` and
 * `base` sit on opposite sides of `1` (a fractional base with `number >= 1`, or
 * a base `>= 1` with `number < 1`). These restrictions also reject inputs whose
 * mathematical logarithm would be negative. Use it when inputs meet those rules.
 * NaN passes through as NaN; infinity is not always rejected: an infinite base
 * with a finite number greater than one returns zero.
 *
 * @example
 * ```ts
 * import { pipe } from "effect"
 * import { NumberX } from "@nunofyobiz/effect-extras"
 *
 * const storageIncrease = 8
 * // Three doublings produce an eightfold increase in storage.
 * assert.deepStrictEqual(NumberX.unsafeLogBase(storageIncrease, 2), 3)
 * assert.deepStrictEqual(pipe(storageIncrease, NumberX.unsafeLogBase(2)), 3)
 *
 * // Zero cannot describe a multiplicative increase.
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
      Option.map((ratio) => EffectNumber.multiply(ratio, 100)),
    ),
);

/**
 * Expresses `numerator` as a percentage of `total`, throwing on division by
 * zero. Use it to show a part of a total, such as a discount relative to a cart.
 *
 * Returns `(numerator / total) * 100`. When `total` is `0` the percentage is
 * undefined, so this throws rather than returning `Infinity` or `NaN` — use it
 * only when `total` is known to be neither `0` nor `-0`.
 * Negative operands are allowed; NaN and infinities follow JavaScript division.
 *
 * @example
 * ```ts
 * import { pipe } from "effect"
 * import { NumberX } from "@nunofyobiz/effect-extras"
 *
 * const discount = 15
 * const cartTotal = 60
 * // A $15 discount saves 25% of a $60 cart total.
 * assert.deepStrictEqual(NumberX.unsafeToPercentOf(discount, cartTotal), 25)
 * assert.deepStrictEqual(pipe(discount, NumberX.unsafeToPercentOf(cartTotal)), 25)
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
 * Use it to display a price with trailing zeroes. It uses native `toFixed`
 * rounding, including its floating-point limitations. Digit counts are truncated
 * toward zero and must then be between 0 and 100; NaN means 0. Invalid counts
 * throw RangeError. NaN and infinities render as text, and magnitudes at least
 * `1e21` use exponential notation instead of fixed decimal places.
 *
 * @example
 * ```ts
 * import { pipe } from "effect"
 * import { NumberX } from "@nunofyobiz/effect-extras"
 *
 * const price = 12.5
 * // Display the price with two decimal places, including a trailing zero.
 * assert.deepStrictEqual(NumberX.toFixed(price, 2), "12.50")
 * assert.deepStrictEqual(pipe(price, NumberX.toFixed(2)), "12.50")
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
 * Use it when a rounded price must stay numeric rather than carry trailing
 * zeroes for display. It formats via {@link toFixed} then converts back to a
 * number, inheriting native floating-point limitations: `2.675` rounded to two
 * places is `2.67`. Digit counts are truncated toward zero and must then be
 * between 0 and 100; NaN means 0 and invalid counts throw RangeError.
 * NaN and infinities stay numeric; magnitudes at least `1e21` remain unchanged.
 *
 * @example
 * ```ts
 * import { pipe } from "effect"
 * import { NumberX } from "@nunofyobiz/effect-extras"
 *
 * const discountedPrice = 19.876
 * // Round the price to cents while keeping a number for later calculations.
 * assert.deepStrictEqual(NumberX.roundToDigits(discountedPrice, 2), 19.88)
 * assert.deepStrictEqual(pipe(discountedPrice, NumberX.roundToDigits(2)), 19.88)
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
 * `numberDigits` characters. Use it for fixed-width order numbers.
 *
 * If the number's string representation is already as long as (or longer than)
 * `numberDigits`, it is returned unchanged. Padding applies to the whole string,
 * including signs: `padLeftZeroes(-1, 3)` is `"0-1"`. NaN and infinities are also
 * padded as text. Fractional widths are truncated; NaN and non-positive widths
 * add no padding. An infinite positive width throws RangeError.
 *
 * @example
 * ```ts
 * import { pipe } from "effect"
 * import { NumberX } from "@nunofyobiz/effect-extras"
 *
 * const orderNumber = 42
 * // Print order 42 in a five-character order-number field.
 * assert.deepStrictEqual(NumberX.padLeftZeroes(orderNumber, 5), "00042")
 * assert.deepStrictEqual(pipe(orderNumber, NumberX.padLeftZeroes(5)), "00042")
 * ```
 *
 * @category conversions
 * @since 0.0.0
 */
export const padLeftZeroes = dual<
  (numberDigits: number) => (number: number) => string,
  (number: number, numberDigits: number) => string
>(2, (number: number, numberDigits: number): string =>
  pipe(number.toString(), String.padStart(numberDigits, "0")),
);

/**
 * Converts a `0`-indexed value to its `1`-indexed rank by adding `1`.
 *
 * Use it to show an array position as a leaderboard rank, where people count
 * from one. It only adds one: it does not validate indexes, so fractions,
 * negatives, NaN and infinities follow ordinary JavaScript addition.
 *
 * @example
 * ```ts
 * import { NumberX } from "@nunofyobiz/effect-extras"
 *
 * const leaderboardIndex = 4
 * // The player at array position 4 is in fifth place.
 * assert.deepStrictEqual(NumberX.indexToRank(leaderboardIndex), 5)
 * ```
 *
 * @category mapping
 * @since 0.0.0
 */
export const indexToRank = (index: number): number =>
  EffectNumber.increment(index);

const EXCEL_COLUMNS_BASE_CHARS = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];

/**
 * Converts a `0`-indexed column number into its bijective base-26 spreadsheet
 * label (`A`, `B`, …, `Z`, `AA`, `AB`, …). Use it to label columns in a
 * spreadsheet export.
 *
 * Returns `None` for any `index` that is not a non-negative safe integer.
 * Valid indexes return a `Some` label. Indexing is `0`-based here, so `0` is `"A"` and `25` is `"Z"`,
 * unlike the `1`-based numbering shown in most spreadsheet references.
 *
 * @example
 * ```ts
 * import { Option } from "effect"
 * import { NumberX } from "@nunofyobiz/effect-extras"
 *
 * // Label columns in a spreadsheet export, starting with column A at index 0.
 * const exportColumnIndex = 26
 * assert.deepStrictEqual(NumberX.indexToExcel(0), Option.some("A"))
 * assert.deepStrictEqual(NumberX.indexToExcel(exportColumnIndex), Option.some("AA"))
 * // A fractional column index cannot identify a spreadsheet column.
 * assert.deepStrictEqual(NumberX.indexToExcel(26.5), Option.none())
 * assert.deepStrictEqual(NumberX.indexToExcel(-1), Option.none())
 * ```
 *
 * @category conversions
 * @since 0.0.0
 */
export const indexToExcel = (index: number): Option.Option<string> => {
  if (!Number.isSafeInteger(index) || index < 0) {
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
