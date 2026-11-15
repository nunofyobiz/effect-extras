/**
 * Generic, framework-agnostic extensions to Effect's `String` module.
 *
 * @since 0.0.0
 */
import { Array, Match, String } from "effect";
import { dual } from "effect/Function";

/**
 * Adds `start` to the beginning of `string_`. Use it to label a filename or
 * add a fixed prefix while building a string in a pipeline.
 *
 * @example
 * ```ts
 * import { pipe } from "effect"
 * import { StringX } from "@nunofyobiz/effect-extras"
 *
 * // Label a saved report as a backup without changing its extension.
 * assert.deepStrictEqual(StringX.prepend("report.csv", "backup-"), "backup-report.csv")
 *
 * // The pipeable form adds the same filename label.
 * assert.deepStrictEqual(pipe("report.csv", StringX.prepend("backup-")), "backup-report.csv")
 * ```
 *
 * @category combinators
 * @since 0.0.0
 */
export const prepend = dual<
  (start: string) => (string_: string) => string,
  (string_: string, start: string) => string
>(2, (string_: string, start: string): string => String.concat(start, string_));

/**
 * Wraps `string_` between `start` and `end`. Use it to quote a value or put
 * brackets around text. Wrapping is literal: embedded quotes are not escaped.
 *
 * @example
 * ```ts
 * import { pipe } from "effect"
 * import { StringX } from "@nunofyobiz/effect-extras"
 *
 * // Quote a CSV cell containing a comma; this cell has no embedded quotes to escape.
 * assert.deepStrictEqual(StringX.surround("Paris, France", '"', '"'), '"Paris, France"')
 *
 * // The pipeable form quotes the same cell.
 * assert.deepStrictEqual(pipe("Paris, France", StringX.surround('"', '"')), '"Paris, France"')
 * ```
 *
 * @category combinators
 * @since 0.0.0
 */
export const surround = dual<
  (start: string, end: string) => (string_: string) => string,
  (string_: string, start: string, end: string) => string
>(3, (string_: string, start: string, end: string): string =>
  String.concat(String.concat(start, string_), end),
);

/**
 * Adds `start` to the beginning of `string_` only when it is missing.
 * Use it to give a URL path a leading slash without adding another slash
 * to a path that already has one.
 *
 * @example
 * ```ts
 * import { pipe } from "effect"
 * import { StringX } from "@nunofyobiz/effect-extras"
 *
 * // Give a settings URL path its missing leading slash.
 * assert.deepStrictEqual(StringX.ensurePrepend("settings/profile", "/"), "/settings/profile")
 *
 * // An already-prefixed path stays unchanged.
 * assert.deepStrictEqual(StringX.ensurePrepend("/settings/profile", "/"), "/settings/profile")
 *
 * // The pipeable form adds the same leading slash.
 * assert.deepStrictEqual(pipe("settings/profile", StringX.ensurePrepend("/")), "/settings/profile")
 * ```
 *
 * @category combinators
 * @since 0.0.0
 */
export const ensurePrepend = dual<
  (start: string) => (string_: string) => string,
  (string_: string, start: string) => string
>(2, (string_: string, start: string): string =>
  Match.value(string_).pipe(
    Match.when(String.startsWith(start), () => string_),
    Match.orElse((value) => String.concat(start, value)),
  ),
);

/**
 * Replaces lines `startLine` through `endLine`, including both ends, with
 * `replacement` lines. Use it to update or delete settings in a text config file.
 *
 * `content` is split on `\n`; the zero-based lines `startLine` through `endLine`
 * (both inclusive) are dropped and `replacement` is spliced into their place.
 * Pass an empty `replacement` to delete the range. The prefix length (`startLine`)
 * and suffix offset (`endLine + 1`) are rounded down and clamped to the line count;
 * negative values and NaN become zero. A start after the end can repeat lines.
 *
 * @example
 * ```ts
 * import { pipe } from "effect"
 * import { StringX } from "@nunofyobiz/effect-extras"
 *
 * const config = "host=localhost\nport=3000\ndebug=true\nlogging=info"
 *
 * // Replace the port and debug settings, keeping the host and logging lines.
 * assert.deepStrictEqual(
 *   StringX.replaceLineRange(config, 1, 2, ["port=8080", "debug=false"]),
 *   "host=localhost\nport=8080\ndebug=false\nlogging=info",
 * )
 *
 * // Delete the port and debug overrides so their defaults can apply.
 * assert.deepStrictEqual(StringX.replaceLineRange(config, 1, 2, []), "host=localhost\nlogging=info")
 *
 * // The pipeable form makes the same settings update.
 * assert.deepStrictEqual(
 *   pipe(config, StringX.replaceLineRange(1, 2, ["port=8080", "debug=false"])),
 *   "host=localhost\nport=8080\ndebug=false\nlogging=info",
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
    const lines = String.split(content, "\n");
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
 * anchor line and everything after it. Use it to add a comment above a setting
 * in a text config file.
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
 * const config = "host=localhost\nport=8080"
 *
 * // Explain the port setting without replacing it.
 * assert.deepStrictEqual(
 *   StringX.insertBeforeLine(config, 1, ["# Local development port"]),
 *   "host=localhost\n# Local development port\nport=8080",
 * )
 *
 * // An anchor at the end appends a new setting.
 * assert.deepStrictEqual(StringX.insertBeforeLine(config, 2, ["debug=false"]), "host=localhost\nport=8080\ndebug=false")
 *
 * // The pipeable form inserts the same explanatory comment.
 * assert.deepStrictEqual(
 *   pipe(config, StringX.insertBeforeLine(1, ["# Local development port"])),
 *   "host=localhost\n# Local development port\nport=8080",
 * )
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
    const split = String.split(content, "\n");
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
