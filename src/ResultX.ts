/**
 * Generic, framework-agnostic extensions to Effect's `Result` module.
 *
 * @since 0.0.0
 */
import { Option, Result } from "effect";
import { constVoid } from "effect/Function";

/**
 * Lifts an `Option` into a `Result` with a `void` failure: `Some(value)` becomes
 * `Result.succeed(value)` and `None` becomes `Result.failVoid`.
 *
 * Useful with `Array.filterMap` and `Record.filterMap`, which use
 * `Result`-returning predicates: a `Success` keeps the value and a `Failure`
 * drops it.
 *
 * ```ts
 * import { Array } from "effect"
 * import { ResultX } from "@nunofyobiz/effect-extras"
 *
 * declare const items: ReadonlyArray<number>
 * declare const maybeTransform: (item: number) => import("effect").Option.Option<string>
 *
 * Array.filterMap(items, (item) => ResultX.fromOption(maybeTransform(item)))
 * ```
 *
 * Effect ships `Result.fromOption(option, onNone)`, which requires an `onNone`
 * thunk. This helper specializes it to the common "drop the item, no error
 * needed" case used by `filterMap`.
 *
 * @example
 * ```ts
 * import { Option, Result } from "effect"
 * import { ResultX } from "@nunofyobiz/effect-extras"
 *
 * assert.deepStrictEqual(
 *   ResultX.fromOption(Option.some(1)),
 *   Result.succeed(1),
 * )
 * assert.deepStrictEqual(
 *   ResultX.fromOption(Option.none<number>()),
 *   Result.failVoid,
 * )
 * ```
 *
 * @category conversions
 * @since 0.0.0
 */
export const fromOption = <A>(
  option: Option.Option<A>,
): Result.Result<A, void> => Result.fromOption(option, constVoid);
