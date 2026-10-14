/**
 * Generic, framework-agnostic extensions to Effect's `Option` module.
 *
 * @since 0.0.0
 */
import { Option, Predicate } from "effect";
import { constVoid, dual } from "effect/Function";

/**
 * Combines two `Option`s into an `Option` of a tuple, succeeding only when both
 * are `Some`.
 *
 * Returns `Some([a, b])` when both inputs are `Some`, and `None` if either is
 * `None`. Useful when an operation needs two optional values present at once.
 *
 * @example
 * ```ts
 * import { Option } from "effect"
 *
 * // Both Some — succeeds with the pair
 * assert.deepStrictEqual(
 *   Option.product(Option.some(1), Option.some("a")),
 *   Option.some([1, "a"]),
 * )
 *
 * // Either None collapses to None
 * assert.deepStrictEqual(
 *   Option.product(Option.some(1), Option.none()),
 *   Option.none(),
 * )
 *
 * ```
 *
 * @deprecated Use `Option.product` instead.
 * @category combinators
 * @since 0.0.0
 */
export const tupleOf = dual<
  <B>(b: Option.Option<B>) => <A>(a: Option.Option<A>) => Option.Option<[A, B]>,
  <A, B>(a: Option.Option<A>, b: Option.Option<B>) => Option.Option<[A, B]>
>(
  2,
  <A, B>(a: Option.Option<A>, b: Option.Option<B>): Option.Option<[A, B]> =>
    Option.product(a, b),
);

/**
 * Runs a side effect with the value of an `Option` when it is `Some`, doing
 * nothing when it is `None`.
 *
 * A shorthand for the "if Some, do something" branch of `Option.match` where the
 * `None` case is a no-op. The callback's return value is ignored — `ifSome`
 * always returns `undefined`. Use it to notify another part of your program
 * when an optional value is present and you do not need to continue a pipeline.
 *
 * @example
 * ```ts
 * import { Option } from "effect"
 * import { OptionX } from "@nunofyobiz/effect-extras"
 *
 * const notifications: Array<string> = []
 * const notify = (address: string) => notifications.push(`Notify ${address}`)
 * // A present contact address records a notification; an absent one records nothing.
 * const result = OptionX.ifSome(Option.some("sam@example.com"), notify)
 * OptionX.ifSome(Option.none<string>(), notify)
 *
 * assert.deepStrictEqual(notifications, ["Notify sam@example.com"])
 * // The array length returned by push is ignored.
 * assert.strictEqual(result, undefined)
 * ```
 *
 * @category sequencing
 * @since 0.0.0
 */
export const ifSome = dual<
  <A>(ifSome: (value: A) => void) => (self: Option.Option<A>) => void,
  <A>(self: Option.Option<A>, ifSome: (value: A) => void) => void
>(2, <A>(self: Option.Option<A>, ifSome: (value: A) => void): void => {
  Option.match(self, { onNone: constVoid, onSome: ifSome });
});

/**
 * Runs a side effect with the value of an `Option` when it is `Some`, then
 * returns the `Option` unchanged.
 *
 * The pass-through counterpart of {@link ifSome}: it taps into a `Some` value
 * (for logging, metrics, debugging) without breaking a `pipe` chain, since it
 * returns the original `Option` by reference. For `None` it is a no-op.
 * The callback's return value is ignored.
 *
 * @example
 * ```ts
 * import { Option, pipe } from "effect"
 * import { OptionX } from "@nunofyobiz/effect-extras"
 *
 * const selectedProduct = Option.some({ name: "Desk lamp", price: 35 })
 * const observedNames: Array<string> = []
 * // Observe the selected product before extracting its display name.
 * const result = pipe(
 *   selectedProduct,
 *   OptionX.inspectSome((product) => observedNames.push(product.name)),
 *   Option.map((product) => product.name),
 * )
 *
 * assert.deepStrictEqual(result, Option.some("Desk lamp"))
 * assert.deepStrictEqual(observedNames, ["Desk lamp"])
 * ```
 *
 * @category sequencing
 * @since 0.0.0
 */
export const inspectSome = dual<
  <A>(
    function_: (value: A) => void,
  ) => (self: Option.Option<A>) => Option.Option<A>,
  <A>(self: Option.Option<A>, function_: (value: A) => void) => Option.Option<A>
>(
  2,
  <A>(
    self: Option.Option<A>,
    function_: (value: A) => void,
  ): Option.Option<A> => {
    ifSome(self, function_);
    return self;
  },
);

/**
 * Normalizes a possibly-nullish `Option` into a plain `Option`, mapping `null`
 * and `undefined` to `None`.
 *
 * Handy at boundaries where an `Option` value might itself arrive as `null` or
 * `undefined` (for example an optional field that holds an `Option`): the result
 * is always a well-formed `Option`, never `null`/`undefined`. Only the outer
 * nullish value is normalized: existing Options are returned by reference,
 * including `Some(null)` and `Some(undefined)`.
 *
 * @example
 * ```ts
 * import { Option } from "effect"
 * import { OptionX } from "@nunofyobiz/effect-extras"
 *
 * const preferences: { theme?: Option.Option<string> | null } = {
 *   theme: Option.some("dark"),
 * }
 * // A saved theme stays the same Option; a missing or null field becomes None.
 * assert.strictEqual(OptionX.fromNullableOption(preferences.theme), preferences.theme)
 * assert.deepStrictEqual(OptionX.fromNullableOption({ ...preferences, theme: null }.theme), Option.none())
 * const noPreferences: { theme?: Option.Option<string> | null } = {}
 * assert.deepStrictEqual(OptionX.fromNullableOption(noPreferences.theme), Option.none())
 * ```
 *
 * @category constructors
 * @since 0.0.0
 */
export const fromNullableOption = <A>(
  nullableOption: Option.Option<A> | null | undefined,
): Option.Option<A> =>
  Predicate.isNotNullish(nullableOption) ? nullableOption : Option.none();

/**
 * Maps the value of an `Option` when it is `Some`, returning `null` when it is
 * `None`.
 *
 * A shorthand for `pipe(self, Option.map(map), Option.getOrNull)`. Use it when
 * building a record whose absent values are represented by `null`. The mapper
 * runs only for `Some`, and its result passes through unchanged, including
 * falsy values, `null`, and `undefined`.
 *
 * Also useful in React/JSX when mapping optional data to rendered content:
 * `None` produces `null`, so nothing is rendered.
 *
 * @example
 * ```ts
 * import { Option } from "effect"
 * import { OptionX } from "@nunofyobiz/effect-extras"
 *
 * const selectedProduct = Option.some({ name: "Desk lamp", price: 35 })
 * // Store the product name in a record, using null when nothing is selected.
 * const selection = {
 *   productName: OptionX.mapSomeOrNull(selectedProduct, (product) => product.name),
 * }
 * assert.deepStrictEqual(selection, { productName: "Desk lamp" })
 * assert.strictEqual(
 *   OptionX.mapSomeOrNull(Option.none<{ name: string }>(), (product) => product.name),
 *   null,
 * )
 * ```
 *
 * @category mapping
 * @since 0.0.0
 */
export const mapSomeOrNull = dual<
  <A, B>(map: (a: A) => B) => (self: Option.Option<A>) => B | null,
  <A, B>(self: Option.Option<A>, map: (a: A) => B) => B | null
>(2, <A, B>(self: Option.Option<A>, map: (a: A) => B): B | null =>
  Option.getOrNull(Option.map(self, map)),
);

/**
 * Maps the value of an `Option` when it is `Some`, returning `undefined` when it
 * is `None`.
 *
 * The `undefined`-returning counterpart of {@link mapSomeOrNull}: a shorthand for
 * `pipe(self, Option.map(map), Option.getOrUndefined)`. Reach for it when the
 * consuming API expects `undefined` rather than `null` for "absent", such as a
 * function argument that selects a default. The mapper runs only for `Some`,
 * and its result passes through unchanged, including falsy values, `null`,
 * and `undefined`.
 *
 * @example
 * ```ts
 * import { Option } from "effect"
 * import { OptionX } from "@nunofyobiz/effect-extras"
 *
 * const savedConfig = Option.some({ timeoutSeconds: 10 })
 * const timeoutOrDefault = (seconds: number | undefined) => seconds ?? 30
 * // Pass a saved timeout to the function; an absent configuration selects its default.
 * const timeout = OptionX.mapSomeOrUndefined(savedConfig, (config) => config.timeoutSeconds)
 * assert.strictEqual(timeoutOrDefault(timeout), 10)
 * const noConfig = Option.none<{ timeoutSeconds: number }>()
 * assert.strictEqual(
 *   timeoutOrDefault(OptionX.mapSomeOrUndefined(noConfig, (config) => config.timeoutSeconds)),
 *   30,
 * )
 * ```
 *
 * @category mapping
 * @since 0.0.0
 */
export const mapSomeOrUndefined = dual<
  <A, B>(map: (a: A) => B) => (self: Option.Option<A>) => B | undefined,
  <A, B>(self: Option.Option<A>, map: (a: A) => B) => B | undefined
>(2, <A, B>(self: Option.Option<A>, map: (a: A) => B): B | undefined =>
  Option.getOrUndefined(Option.map(self, map)),
);
