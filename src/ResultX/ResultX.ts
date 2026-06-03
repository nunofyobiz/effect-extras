import { Option, Result } from "effect";

/**
 * Lifts an {@link Option} into a {@link Result} with `void` failure.
 *
 * - `Some(value)` → `Result.success(value)`
 * - `None` → `Result.failVoid`
 *
 * Useful in v4 where `Array.filterMap` and `Record.filterMap` expect
 * `Result`-returning predicates (`Success` keeps the value, `Failure` drops
 * it). In v3 those APIs accepted `Option`-returning predicates directly.
 *
 * ```ts
 * // v3
 * Array.filterMap(items, (item) => maybeTransform(item))
 *
 * // v4
 * Array.filterMap(items, (item) => ResultX.fromOption(maybeTransform(item)))
 * ```
 *
 * Effect ships `Result.fromOption(option, onNone)` which requires a non-void
 * failure value. This helper specializes to the common
 * "drop the item, no error needed" case used by `filterMap`.
 */
export const fromOption = <A>(
  option: Option.Option<A>,
): Result.Result<A, void> =>
  Option.isSome(option) ? Result.succeed(option.value) : Result.failVoid;
