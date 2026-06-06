/**
 * Generic, framework-agnostic extensions to Effect's `String` module.
 *
 * @since 0.0.0
 */
import { dual } from "effect/Function";

/**
 * Prepends `start` to `string_`.
 *
 * v4's `String` module has no native `prepend` (only `concat`), so this fills
 * the gap as a pipeable helper.
 *
 * @example
 * ```ts
 * import { pipe } from "effect"
 * import { StringX } from "@nunofyobiz/effect-extras"
 *
 * // data-first
 * assert.deepStrictEqual(StringX.prepend("world", "hello "), "hello world")
 *
 * // data-last (piped)
 * assert.deepStrictEqual(pipe("world", StringX.prepend("hello ")), "hello world")
 * ```
 *
 * @category combinators
 * @since 0.0.0
 */
export const prepend = dual<
  (start: string) => (string_: string) => string,
  (string_: string, start: string) => string
>(2, (string_: string, start: string): string => `${start}${string_}`);

/**
 * Wraps `string_` between `start` and `end`.
 *
 * No v4 native equivalent — handy for quoting, bracketing, or fencing a value.
 *
 * @example
 * ```ts
 * import { pipe } from "effect"
 * import { StringX } from "@nunofyobiz/effect-extras"
 *
 * // data-first
 * assert.deepStrictEqual(StringX.surround("value", "[", "]"), "[value]")
 *
 * // data-last (piped)
 * assert.deepStrictEqual(pipe("value", StringX.surround("(", ")")), "(value)")
 * ```
 *
 * @category combinators
 * @since 0.0.0
 */
export const surround = dual<
  (start: string, end: string) => (string_: string) => string,
  (string_: string, start: string, end: string) => string
>(
  3,
  (string_: string, start: string, end: string): string =>
    `${start}${string_}${end}`,
);

/**
 * Prepends `start` to `string_` unless `string_` already starts with it.
 *
 * Idempotent: applying it to an already-prefixed string is a no-op, so
 * `ensurePrepend("foofoo", "foo")` stays `"foofoo"` rather than gaining a
 * second `"foo"`.
 *
 * @example
 * ```ts
 * import { pipe } from "effect"
 * import { StringX } from "@nunofyobiz/effect-extras"
 *
 * // data-first — adds the prefix when missing
 * assert.deepStrictEqual(StringX.ensurePrepend("bar", "foo"), "foobar")
 *
 * // idempotent — already prefixed, returned unchanged
 * assert.deepStrictEqual(StringX.ensurePrepend("foobar", "foo"), "foobar")
 *
 * // data-last (piped)
 * assert.deepStrictEqual(pipe("bar", StringX.ensurePrepend("foo")), "foobar")
 * ```
 *
 * @category combinators
 * @since 0.0.0
 */
export const ensurePrepend = dual<
  (start: string) => (string_: string) => string,
  (string_: string, start: string) => string
>(2, (string_: string, start: string): string => {
  if (string_.startsWith(start)) {
    return string_;
  }

  return `${start}${string_}`;
});
