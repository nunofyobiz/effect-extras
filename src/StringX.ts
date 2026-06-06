/**
 * Generic, framework-agnostic extensions to Effect's `String` module.
 *
 * @since 0.0.0
 */
import { Array } from "effect";
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

/**
 * Replaces the inclusive line range `[startLine, endLine]` of `content` with
 * `replacement` lines, returning the rejoined string.
 *
 * `content` is split on `\n`; the zero-based lines `startLine` through `endLine`
 * (both inclusive) are dropped and `replacement` is spliced into their place.
 * Pass an empty `replacement` to delete the range. Indices clamp naturally via
 * `Array.take`/`Array.drop`, so out-of-range values don't throw.
 *
 * @example
 * ```ts
 * import { pipe } from "effect"
 * import { StringX } from "@nunofyobiz/effect-extras"
 *
 * // data-first — replace lines 1..2 with a single line
 * assert.deepStrictEqual(
 *   StringX.replaceLineRange("a\nb\nc\nd", 1, 2, ["X"]),
 *   "a\nX\nd",
 * )
 *
 * // an empty replacement deletes the range
 * assert.deepStrictEqual(StringX.replaceLineRange("a\nb\nc\nd", 1, 2, []), "a\nd")
 *
 * // data-last (piped)
 * assert.deepStrictEqual(
 *   pipe("a\nb\nc", StringX.replaceLineRange(1, 1, ["X", "Y"])),
 *   "a\nX\nY\nc",
 * )
 * ```
 *
 * @category combinators
 * @since 0.0.0
 */
export const replaceLineRange = dual<
  (
    startLine: number,
    endLine: number,
    replacement: readonly string[],
  ) => (content: string) => string,
  (
    content: string,
    startLine: number,
    endLine: number,
    replacement: readonly string[],
  ) => string
>(
  4,
  (
    content: string,
    startLine: number,
    endLine: number,
    replacement: readonly string[],
  ): string => {
    const lines = content.split("\n");
    return Array.join(
      [
        ...Array.take(lines, startLine),
        ...replacement,
        ...Array.drop(lines, endLine + 1),
      ],
      "\n",
    );
  },
);

/**
 * Inserts `lines` immediately before the line at `anchorIndex`, preserving the
 * anchor line and everything after it; returns the rejoined string.
 *
 * `content` is split on `\n` and `lines` are spliced in just before the
 * zero-based `anchorIndex`. An `anchorIndex` of `0` prepends, and one at or past
 * the end appends.
 *
 * @example
 * ```ts
 * import { pipe } from "effect"
 * import { StringX } from "@nunofyobiz/effect-extras"
 *
 * // data-first — insert before line 1, keeping the anchor and the rest
 * assert.deepStrictEqual(StringX.insertBeforeLine("a\nb\nc", 1, ["X"]), "a\nX\nb\nc")
 *
 * // an anchor at the end appends
 * assert.deepStrictEqual(StringX.insertBeforeLine("a\nb", 2, ["X"]), "a\nb\nX")
 *
 * // data-last (piped)
 * assert.deepStrictEqual(pipe("a\nb", StringX.insertBeforeLine(0, ["X"])), "X\na\nb")
 * ```
 *
 * @category combinators
 * @since 0.0.0
 */
export const insertBeforeLine = dual<
  (
    anchorIndex: number,
    lines: readonly string[],
  ) => (content: string) => string,
  (content: string, anchorIndex: number, lines: readonly string[]) => string
>(
  3,
  (content: string, anchorIndex: number, lines: readonly string[]): string => {
    const split = content.split("\n");
    return Array.join(
      [
        ...Array.take(split, anchorIndex),
        ...lines,
        ...Array.drop(split, anchorIndex),
      ],
      "\n",
    );
  },
);
