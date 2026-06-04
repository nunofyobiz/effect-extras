/**
 * Generic, framework-agnostic extensions to Effect's `Boolean` module.
 *
 * @since 0.0.0
 */
/**
 * Converts a `boolean` to its binary digit: `1` for `true`, `0` for `false`.
 *
 * Useful when a numeric flag is required — summing booleans to count how many
 * predicates hold, or feeding a bit into bitwise math or an external API that
 * expects `0`/`1` rather than `false`/`true`.
 *
 * @example
 * ```ts
 * import { BooleanX } from "@nunofyobiz/effect-extras"
 *
 * assert.deepStrictEqual(BooleanX.toBinary(true), 1)
 * assert.deepStrictEqual(BooleanX.toBinary(false), 0)
 * ```
 *
 * @category conversions
 * @since 0.0.0
 */
export const toBinary = (value: boolean): 0 | 1 => (value ? 1 : 0);
