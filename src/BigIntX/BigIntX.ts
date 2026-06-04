/**
 * Generic, framework-agnostic extensions to Effect's `BigInt` module.
 *
 * @since 0.0.0
 */
import { BigInt, Option } from "effect";

/**
 * Converts a `bigint` to a `number`, throwing when the value cannot be
 * represented exactly.
 *
 * Delegates to Effect's `BigInt.toNumber`, which returns `None` once the
 * `bigint` falls outside the safe integer range (`Number.MAX_SAFE_INTEGER`).
 * This unwraps that `Option`, throwing instead of silently losing precision —
 * use it only when the value is known to fit.
 *
 * @example
 * ```ts
 * import { BigIntX } from "@nunofyobiz/effect-extras"
 *
 * assert.deepStrictEqual(BigIntX.toNumberOrThrow(42n), 42)
 *
 * // throws when outside the safe integer range
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
