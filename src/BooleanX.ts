/**
 * Generic, framework-agnostic extensions to Effect's `Boolean` module.
 *
 * @since 0.0.0
 */
/**
 * Converts `true` to `1` and `false` to `0`.
 *
 * Use it to store a feature flag in a numeric field or send it to an API that
 * expects a binary digit.
 *
 * @example
 * ```ts
 * import { BooleanX } from "@nunofyobiz/effect-extras"
 *
 * const emailNotificationsEnabled = true
 * const betaDashboardEnabled = false
 *
 * // Store the enabled notification setting as 1 and the disabled beta setting as 0.
 * assert.deepStrictEqual(BooleanX.toBinary(emailNotificationsEnabled), 1)
 * assert.deepStrictEqual(BooleanX.toBinary(betaDashboardEnabled), 0)
 * ```
 *
 * @category conversions
 * @since 0.0.0
 */
export const toBinary = (value: boolean): 0 | 1 => (value ? 1 : 0);
