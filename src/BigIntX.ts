/**
 * Generic, framework-agnostic extensions to Effect's `BigInt` module.
 *
 * @since 0.0.0
 */
import { BigInt, Option } from "effect";

/**
 * Converts a `bigint` to a `number` within JavaScript's inclusive safe integer
 * bounds, throwing outside `Number.MIN_SAFE_INTEGER` to `Number.MAX_SAFE_INTEGER`.
 *
 * Use it when a byte count or another bigint must become a number for display
 * or a numeric API, and an out-of-range value should fail instead of losing
 * precision. Delegates to Effect's `BigInt.toNumber` and unwraps its `Option`.
 *
 * @example
 * ```ts
 * import { BigIntX } from "@nunofyobiz/effect-extras"
 *
 * const fileSize = 5_242_880n
 * const bytes = BigIntX.toNumberOrThrow(fileSize)
 *
 * // This file fits safely in a number: display its size as five MiB.
 * assert.deepStrictEqual(bytes, 5_242_880)
 * assert.deepStrictEqual(bytes / (1024 * 1024), 5)
 *
 * // Larger counts outside the safe integer range fail the checked conversion.
 * assert.throws(() => BigIntX.toNumberOrThrow(9007199254740993n))
 * ```
 *
 * @category unsafe
 * @since 0.0.0
 */
export const toNumberOrThrow = (value: bigint): number =>
  BigInt.toNumber(value).pipe(
    Option.getOrThrowWith(
      () => new Error(`Value ${value} is outside safe integer range`),
    ),
  );
