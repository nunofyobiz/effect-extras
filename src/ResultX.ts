/**
 * Generic, framework-agnostic extensions to Effect's `Result` module.
 *
 * @since 0.0.0
 */
import { Option, Result } from "effect";
import { constVoid } from "effect/Function";

/**
 * Converts optional data into a `Result` with a `void` failure. `Some(value)`
 * preserves its payload as a success, even when the payload is `undefined`;
 * `None` becomes a failure containing `undefined` (`Result.failVoid`).
 *
 * Useful with `Array.filterMap` and `Record.filterMap`, which use
 * `Result`-returning predicates: a `Success` keeps the value and a `Failure`
 * drops it.
 *
 * Effect ships `Result.fromOption(option, onNone)`, which requires an `onNone`
 * thunk. This helper specializes it to the common "drop the item, no error
 * needed" case used by `filterMap`.
 *
 * @example
 * ```ts
 * import { Array, Option, Result } from "effect"
 * import { ResultX } from "@nunofyobiz/effect-extras"
 *
 * const settings = { theme: "dark", autosave: true }
 * const available = Option.some(settings)
 * const missing = Option.none<typeof settings>()
 *
 * // Available settings are preserved; missing settings need no error details.
 * assert.deepStrictEqual(
 *   ResultX.fromOption(available),
 *   Result.succeed(settings),
 * )
 * assert.deepStrictEqual(ResultX.fromOption(missing), Result.failVoid)
 *
 * // Select only the available settings entries: failures drop missing entries.
 * assert.deepStrictEqual(
 *   Array.filterMap([available, missing], ResultX.fromOption),
 *   [settings],
 * )
 * ```
 *
 * @category conversions
 * @since 0.0.0
 */
export const fromOption = <A>(
  option: Option.Option<A>,
): Result.Result<A, void> => Result.fromOption(option, constVoid);
