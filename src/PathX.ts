/**
 * Typed filesystem path abstraction with root-type and leaf-type discrimination.
 *
 * Each `Path` value encodes both how the path is rooted and how it ends:
 * - **Root type:** `"absolute"` | `"relative-up"` | `"relative-down"`
 * - **Leaf type:** `"dirlike"` | `"filelike"`
 *
 * Paths are stored in normalised form (via `node:path`'s `normalize`) and can
 * only be constructed through {@link fromPathString}, which is the single entry
 * point for this module.
 *
 * @since 0.0.0
 */
import nodePath from "node:path";
import { Predicate, Schema, SchemaGetter, pipe } from "effect";

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

const RAW_UP_DIR = "..";
const RAW_THIS_DIR = ".";

const PathStructSchema = Schema.Struct({
  path: Schema.String,
  rootType: Schema.Literals(["absolute", "relative-down", "relative-up"]),
  leafType: Schema.Literals(["dirlike", "filelike"]),
});

type PathData = Schema.Schema.Type<typeof PathStructSchema>;

const PathSchema = Schema.String.pipe(
  Schema.decodeTo(PathStructSchema, {
    decode: SchemaGetter.transform((rawPath: string): PathData => {
      const normalizedPath = nodePath.normalize(rawPath);
      // Split on the platform separator to get the first segment; an absolute
      // path's first segment is "" (POSIX) or the drive letter (Windows), so it
      // will never equal "..".
      const firstSegment = normalizedPath.split(nodePath.sep)[0] ?? "";
      const rootType: PathData["rootType"] = nodePath.isAbsolute(rawPath)
        ? "absolute"
        : firstSegment === RAW_UP_DIR
          ? "relative-up"
          : "relative-down";
      const leafType: PathData["leafType"] = normalizedPath.endsWith(
        nodePath.sep,
      )
        ? "dirlike"
        : "filelike";
      return { path: normalizedPath, rootType, leafType };
    }),
    encode: SchemaGetter.transform(({ path }: PathData): string => path),
  }),
);

/**
 * Asserts that `a` satisfies `refinement`, returning the narrowed `B`, or
 * throws an `Error` built from `message`.
 * @internal
 */
const assertRefinement =
  <A, B extends A>(
    refinement: Predicate.Refinement<A, B>,
    message: (a: A) => string,
  ) =>
  (a: A): B => {
    if (refinement(a)) {
      return a;
    }
    throw new Error(message(a));
  };

// ---------------------------------------------------------------------------
// Path interface
// ---------------------------------------------------------------------------

/**
 * A typed filesystem path discriminated by root type (`R`) and leaf type (`L`).
 *
 * - `R` narrows which root types are valid: `"absolute"`, `"relative-up"`, or
 *   `"relative-down"`. All three are allowed by default.
 * - `L` narrows whether the path ends like a directory (`"dirlike"`) or a file
 *   (`"filelike"`). Both are allowed by default.
 *
 * Use {@link fromPathString} to construct a `Path` from a raw string. The
 * narrower type aliases — {@link AbsolutePath}, {@link DirlikePath},
 * {@link AbsoluteDirlikePath}, etc. — are produced by the typed predicates and
 * combinators in this module.
 *
 * @example
 * ```ts
 * import { PathX } from "@nunofyobiz/effect-extras"
 *
 * const p = PathX.fromPathString("/usr/local")
 * const dirlikeP = PathX.asDirlike(p)
 * assert.deepStrictEqual(dirlikeP.rootType, "absolute")
 * assert.deepStrictEqual(dirlikeP.leafType, "dirlike")
 * ```
 *
 * @category models
 * @since 0.0.0
 */
export interface Path<
  R extends "absolute" | "relative-up" | "relative-down" =
    | "absolute"
    | "relative-up"
    | "relative-down",
  L extends "dirlike" | "filelike" = "dirlike" | "filelike",
> {
  readonly path: string;
  readonly rootType: R;
  readonly leafType: L;
}

// ---------------------------------------------------------------------------
// Root-type aliases
// ---------------------------------------------------------------------------

/**
 * A path rooted at the filesystem root (e.g. `/usr/local`).
 *
 * @example
 * ```ts
 * import { PathX } from "@nunofyobiz/effect-extras"
 *
 * const p = PathX.fromPathString("/usr/local")
 * assert.deepStrictEqual(p.rootType, "absolute")
 * ```
 *
 * @category models
 * @since 0.0.0
 */
export type AbsolutePath = Path<"absolute">;

/**
 * A relative path whose first segment is `..` (moves up from the current
 * directory, e.g. `../config`).
 *
 * @example
 * ```ts
 * import { PathX } from "@nunofyobiz/effect-extras"
 *
 * const p = PathX.fromPathString("../config")
 * assert.deepStrictEqual(p.rootType, "relative-up")
 * ```
 *
 * @category models
 * @since 0.0.0
 */
export type RelativeUpPath = Path<"relative-up">;

/**
 * A relative path that stays at or below the current directory (e.g.
 * `src/index.ts`).
 *
 * @example
 * ```ts
 * import { PathX } from "@nunofyobiz/effect-extras"
 *
 * const p = PathX.fromPathString("src/index.ts")
 * assert.deepStrictEqual(p.rootType, "relative-down")
 * ```
 *
 * @category models
 * @since 0.0.0
 */
export type RelativeDownPath = Path<"relative-down">;

/**
 * Any relative path — either {@link RelativeUpPath} or {@link RelativeDownPath}.
 *
 * @example
 * ```ts
 * import { PathX } from "@nunofyobiz/effect-extras"
 *
 * const upPath = PathX.fromPathString("../foo")
 * const downPath = PathX.fromPathString("src/")
 * assert.deepStrictEqual(PathX.isRelativePath(upPath), true)
 * assert.deepStrictEqual(PathX.isRelativePath(downPath), true)
 * ```
 *
 * @category models
 * @since 0.0.0
 */
export type RelativePath = Path<"relative-up" | "relative-down">;

// ---------------------------------------------------------------------------
// Leaf-type aliases
// ---------------------------------------------------------------------------

/**
 * A path whose last segment represents a directory — ends with the platform
 * path separator (e.g. `/usr/local/` or `src/`).
 *
 * @example
 * ```ts
 * import { PathX } from "@nunofyobiz/effect-extras"
 *
 * const p = PathX.fromPathString("/usr/local/")
 * assert.deepStrictEqual(p.leafType, "dirlike")
 * ```
 *
 * @category models
 * @since 0.0.0
 */
export type DirlikePath = Path<
  "absolute" | "relative-up" | "relative-down",
  "dirlike"
>;

/**
 * A path whose last segment represents a file (does not end with the platform
 * separator).
 *
 * @example
 * ```ts
 * import { PathX } from "@nunofyobiz/effect-extras"
 *
 * const p = PathX.fromPathString("/usr/local")
 * assert.deepStrictEqual(p.leafType, "filelike")
 * ```
 *
 * @category models
 * @since 0.0.0
 */
export type FilelikePath = Path<
  "absolute" | "relative-up" | "relative-down",
  "filelike"
>;

// ---------------------------------------------------------------------------
// Combined root × leaf aliases
// ---------------------------------------------------------------------------

/**
 * The cross-product of {@link AbsolutePath} and {@link DirlikePath}.
 *
 * @example
 * ```ts
 * import { PathX } from "@nunofyobiz/effect-extras"
 *
 * const p = PathX.fromPathString("/usr/")
 * assert.deepStrictEqual(PathX.isAbsoluteDirlikePath(p), true)
 * ```
 *
 * @category models
 * @since 0.0.0
 */
export type AbsoluteDirlikePath = Path<"absolute", "dirlike">;

/**
 * The cross-product of {@link AbsolutePath} and {@link FilelikePath}.
 *
 * @example
 * ```ts
 * import { PathX } from "@nunofyobiz/effect-extras"
 *
 * const p = PathX.fromPathString("/usr/local")
 * assert.deepStrictEqual(PathX.isAbsoluteFilelikePath(p), true)
 * ```
 *
 * @category models
 * @since 0.0.0
 */
export type AbsoluteFilelikePath = Path<"absolute", "filelike">;

/**
 * The cross-product of {@link RelativeUpPath} and {@link DirlikePath}.
 *
 * @example
 * ```ts
 * import { PathX } from "@nunofyobiz/effect-extras"
 *
 * const p = PathX.fromPathString("../")
 * assert.deepStrictEqual(PathX.isRelativeUpDirlikePath(p), true)
 * ```
 *
 * @category models
 * @since 0.0.0
 */
export type RelativeUpDirlikePath = Path<"relative-up", "dirlike">;

/**
 * The cross-product of {@link RelativeUpPath} and {@link FilelikePath}.
 *
 * @example
 * ```ts
 * import { PathX } from "@nunofyobiz/effect-extras"
 *
 * const p = PathX.fromPathString("../foo.ts")
 * assert.deepStrictEqual(PathX.isRelativeUpFilelikePath(p), true)
 * ```
 *
 * @category models
 * @since 0.0.0
 */
export type RelativeUpFilelikePath = Path<"relative-up", "filelike">;

/**
 * The cross-product of {@link RelativeDownPath} and {@link DirlikePath}.
 *
 * @example
 * ```ts
 * import { PathX } from "@nunofyobiz/effect-extras"
 *
 * const p = PathX.fromPathString("src/")
 * assert.deepStrictEqual(PathX.isRelativeDownDirlikePath(p), true)
 * ```
 *
 * @category models
 * @since 0.0.0
 */
export type RelativeDownDirlikePath = Path<"relative-down", "dirlike">;

/**
 * The cross-product of {@link RelativeDownPath} and {@link FilelikePath}.
 *
 * @example
 * ```ts
 * import { PathX } from "@nunofyobiz/effect-extras"
 *
 * const p = PathX.fromPathString("src/index.ts")
 * assert.deepStrictEqual(PathX.isRelativeDownFilelikePath(p), true)
 * ```
 *
 * @category models
 * @since 0.0.0
 */
export type RelativeDownFilelikePath = Path<"relative-down", "filelike">;

// ---------------------------------------------------------------------------
// Constructors / converters
// ---------------------------------------------------------------------------

/**
 * Parses `rawPath` into a {@link Path}, normalising the string and computing
 * its `rootType` and `leafType`.
 *
 * Throws a `SchemaError` when `rawPath` is empty or otherwise invalid.
 *
 * @example
 * ```ts
 * import { PathX } from "@nunofyobiz/effect-extras"
 *
 * const p = PathX.fromPathString("/usr/local/")
 * assert.deepStrictEqual(p.rootType, "absolute")
 * assert.deepStrictEqual(p.leafType, "dirlike")
 * ```
 *
 * @category constructors
 * @since 0.0.0
 */
export const fromPathString = (rawPath: string): Path =>
  Schema.decodeSync(PathSchema)(rawPath);

/**
 * Serialises a {@link Path} back to its normalised string form.
 *
 * @example
 * ```ts
 * import { PathX } from "@nunofyobiz/effect-extras"
 *
 * const p = PathX.fromPathString("../config.json")
 * assert.deepStrictEqual(PathX.toPathString(p), "../config.json")
 * ```
 *
 * @category conversions
 * @since 0.0.0
 */
export const toPathString = (path: Path): string => path.path;

// ---------------------------------------------------------------------------
// Root-type predicates
// ---------------------------------------------------------------------------

/**
 * Returns `true` when `path` is an {@link AbsolutePath} (starts with the
 * filesystem root).
 *
 * @example
 * ```ts
 * import { PathX } from "@nunofyobiz/effect-extras"
 *
 * assert.deepStrictEqual(PathX.isAbsolutePath(PathX.fromPathString("/usr")), true)
 * assert.deepStrictEqual(PathX.isAbsolutePath(PathX.fromPathString("../foo")), false)
 * ```
 *
 * @category predicates
 * @since 0.0.0
 */
export const isAbsolutePath = (path: Path): path is AbsolutePath =>
  path.rootType === "absolute";

/**
 * Returns `true` when `path` is a {@link RelativeUpPath} (first segment is
 * `..`).
 *
 * @example
 * ```ts
 * import { PathX } from "@nunofyobiz/effect-extras"
 *
 * assert.deepStrictEqual(PathX.isRelativeUpPath(PathX.fromPathString("../foo")), true)
 * assert.deepStrictEqual(PathX.isRelativeUpPath(PathX.fromPathString("./foo")), false)
 * ```
 *
 * @category predicates
 * @since 0.0.0
 */
export const isRelativeUpPath = (path: Path): path is RelativeUpPath =>
  path.rootType === "relative-up";

/**
 * Returns `true` when `path` is a {@link RelativeDownPath} (relative, first
 * segment is not `..`).
 *
 * @example
 * ```ts
 * import { PathX } from "@nunofyobiz/effect-extras"
 *
 * assert.deepStrictEqual(PathX.isRelativeDownPath(PathX.fromPathString("src/index.ts")), true)
 * assert.deepStrictEqual(PathX.isRelativeDownPath(PathX.fromPathString("../foo")), false)
 * ```
 *
 * @category predicates
 * @since 0.0.0
 */
export const isRelativeDownPath = (path: Path): path is RelativeDownPath =>
  path.rootType === "relative-down";

/**
 * Returns `true` when `path` is a {@link RelativePath} (either up or down).
 *
 * @example
 * ```ts
 * import { PathX } from "@nunofyobiz/effect-extras"
 *
 * assert.deepStrictEqual(PathX.isRelativePath(PathX.fromPathString("../foo")), true)
 * assert.deepStrictEqual(PathX.isRelativePath(PathX.fromPathString("./foo")), true)
 * assert.deepStrictEqual(PathX.isRelativePath(PathX.fromPathString("/foo")), false)
 * ```
 *
 * @category predicates
 * @since 0.0.0
 */
export const isRelativePath = (path: Path): path is RelativePath =>
  path.rootType === "relative-up" || path.rootType === "relative-down";

// ---------------------------------------------------------------------------
// Leaf-type predicates
// ---------------------------------------------------------------------------

/**
 * Returns `true` when `path` ends with the platform separator, making it a
 * {@link DirlikePath}.
 *
 * @example
 * ```ts
 * import { PathX } from "@nunofyobiz/effect-extras"
 *
 * assert.deepStrictEqual(PathX.isDirlikePath(PathX.fromPathString("/usr/")), true)
 * assert.deepStrictEqual(PathX.isDirlikePath(PathX.fromPathString("/usr/local")), false)
 * ```
 *
 * @category predicates
 * @since 0.0.0
 */
export const isDirlikePath = (path: Path): path is DirlikePath =>
  path.leafType === "dirlike";

/**
 * Returns `true` when `path` does not end with the platform separator, making
 * it a {@link FilelikePath}.
 *
 * @example
 * ```ts
 * import { PathX } from "@nunofyobiz/effect-extras"
 *
 * assert.deepStrictEqual(PathX.isFilelikePath(PathX.fromPathString("/usr/local")), true)
 * assert.deepStrictEqual(PathX.isFilelikePath(PathX.fromPathString("/usr/")), false)
 * ```
 *
 * @category predicates
 * @since 0.0.0
 */
export const isFilelikePath = (path: Path): path is FilelikePath =>
  path.leafType === "filelike";

// ---------------------------------------------------------------------------
// Combined predicates
// ---------------------------------------------------------------------------

/**
 * Returns `true` when `path` is an {@link AbsoluteDirlikePath}.
 *
 * @example
 * ```ts
 * import { PathX } from "@nunofyobiz/effect-extras"
 *
 * assert.deepStrictEqual(PathX.isAbsoluteDirlikePath(PathX.fromPathString("/usr/")), true)
 * assert.deepStrictEqual(PathX.isAbsoluteDirlikePath(PathX.fromPathString("/usr")), false)
 * ```
 *
 * @category predicates
 * @since 0.0.0
 */
export const isAbsoluteDirlikePath = (
  path: Path,
): path is AbsoluteDirlikePath =>
  path.rootType === "absolute" && path.leafType === "dirlike";

/**
 * Returns `true` when `path` is an {@link AbsoluteFilelikePath}.
 *
 * @example
 * ```ts
 * import { PathX } from "@nunofyobiz/effect-extras"
 *
 * assert.deepStrictEqual(PathX.isAbsoluteFilelikePath(PathX.fromPathString("/usr/local")), true)
 * assert.deepStrictEqual(PathX.isAbsoluteFilelikePath(PathX.fromPathString("/usr/")), false)
 * ```
 *
 * @category predicates
 * @since 0.0.0
 */
export const isAbsoluteFilelikePath = (
  path: Path,
): path is AbsoluteFilelikePath =>
  path.rootType === "absolute" && path.leafType === "filelike";

/**
 * Returns `true` when `path` is a {@link RelativeUpDirlikePath}.
 *
 * @example
 * ```ts
 * import { PathX } from "@nunofyobiz/effect-extras"
 *
 * assert.deepStrictEqual(PathX.isRelativeUpDirlikePath(PathX.fromPathString("../")), true)
 * assert.deepStrictEqual(PathX.isRelativeUpDirlikePath(PathX.fromPathString("../foo")), false)
 * ```
 *
 * @category predicates
 * @since 0.0.0
 */
export const isRelativeUpDirlikePath = (
  path: Path,
): path is RelativeUpDirlikePath =>
  path.rootType === "relative-up" && path.leafType === "dirlike";

/**
 * Returns `true` when `path` is a {@link RelativeUpFilelikePath}.
 *
 * @example
 * ```ts
 * import { PathX } from "@nunofyobiz/effect-extras"
 *
 * assert.deepStrictEqual(PathX.isRelativeUpFilelikePath(PathX.fromPathString("../foo.ts")), true)
 * assert.deepStrictEqual(PathX.isRelativeUpFilelikePath(PathX.fromPathString("../")), false)
 * ```
 *
 * @category predicates
 * @since 0.0.0
 */
export const isRelativeUpFilelikePath = (
  path: Path,
): path is RelativeUpFilelikePath =>
  path.rootType === "relative-up" && path.leafType === "filelike";

/**
 * Returns `true` when `path` is a {@link RelativeDownDirlikePath}.
 *
 * @example
 * ```ts
 * import { PathX } from "@nunofyobiz/effect-extras"
 *
 * assert.deepStrictEqual(PathX.isRelativeDownDirlikePath(PathX.fromPathString("src/")), true)
 * assert.deepStrictEqual(PathX.isRelativeDownDirlikePath(PathX.fromPathString("src/index.ts")), false)
 * ```
 *
 * @category predicates
 * @since 0.0.0
 */
export const isRelativeDownDirlikePath = (
  path: Path,
): path is RelativeDownDirlikePath =>
  path.rootType === "relative-down" && path.leafType === "dirlike";

/**
 * Returns `true` when `path` is a {@link RelativeDownFilelikePath}.
 *
 * @example
 * ```ts
 * import { PathX } from "@nunofyobiz/effect-extras"
 *
 * assert.deepStrictEqual(PathX.isRelativeDownFilelikePath(PathX.fromPathString("src/index.ts")), true)
 * assert.deepStrictEqual(PathX.isRelativeDownFilelikePath(PathX.fromPathString("src/")), false)
 * ```
 *
 * @category predicates
 * @since 0.0.0
 */
export const isRelativeDownFilelikePath = (
  path: Path,
): path is RelativeDownFilelikePath =>
  path.rootType === "relative-down" && path.leafType === "filelike";

// ---------------------------------------------------------------------------
// Leaf-type conversions
// ---------------------------------------------------------------------------

/**
 * Ensures `path` ends with the platform separator, returning a
 * {@link DirlikePath}.
 *
 * If `path` is already dirlike it is returned unchanged. Otherwise the
 * platform separator is appended and the result is re-parsed via
 * {@link fromPathString}.
 *
 * The overloads preserve the root-type information when the input type is
 * known: `asDirlike(myAbsolutePath)` returns `AbsoluteDirlikePath`, etc.
 *
 * @example
 * ```ts
 * import { PathX } from "@nunofyobiz/effect-extras"
 *
 * const p = PathX.fromPathString("/usr/local")
 * assert.deepStrictEqual(PathX.asDirlike(p).leafType, "dirlike")
 * assert.deepStrictEqual(PathX.asDirlike(p).path.endsWith("/"), true)
 * ```
 *
 * @category combinators
 * @since 0.0.0
 */
export function asDirlike(path: AbsolutePath): AbsoluteDirlikePath;
export function asDirlike(path: RelativeUpPath): RelativeUpDirlikePath;
export function asDirlike(path: RelativeDownPath): RelativeDownDirlikePath;
export function asDirlike(path: Path): DirlikePath;
export function asDirlike(path: Path): DirlikePath {
  if (isDirlikePath(path)) {
    return path;
  }
  const withSeparator = fromPathString(`${toPathString(path)}${nodePath.sep}`);
  if (!isDirlikePath(withSeparator)) {
    throw new Error(
      `PathX.asDirlike: expected a dirlike path after appending separator, got ${JSON.stringify(withSeparator)}`,
    );
  }
  return withSeparator;
}

/**
 * Strips the trailing platform separator from `path`, returning a
 * {@link FilelikePath}.
 *
 * If `path` is already filelike it is returned unchanged. Otherwise the last
 * character (the separator) is removed and the result is re-parsed via
 * {@link fromPathString}.
 *
 * The overloads preserve the root-type information when the input type is
 * known.
 *
 * @example
 * ```ts
 * import { PathX } from "@nunofyobiz/effect-extras"
 *
 * const p = PathX.fromPathString("/usr/local/")
 * assert.deepStrictEqual(PathX.asFilelike(p).leafType, "filelike")
 * assert.deepStrictEqual(PathX.asFilelike(p).path.endsWith("/"), false)
 * ```
 *
 * @category combinators
 * @since 0.0.0
 */
export function asFilelike(path: AbsolutePath): AbsoluteFilelikePath;
export function asFilelike(path: RelativeUpPath): RelativeUpFilelikePath;
export function asFilelike(path: RelativeDownPath): RelativeDownFilelikePath;
export function asFilelike(path: Path): FilelikePath;
export function asFilelike(path: Path): FilelikePath {
  if (isFilelikePath(path)) {
    return path;
  }
  const withoutSeparator = fromPathString(toPathString(path).slice(0, -1));
  if (!isFilelikePath(withoutSeparator)) {
    throw new Error(
      `PathX.asFilelike: expected a filelike path after removing separator, got ${JSON.stringify(withoutSeparator)}`,
    );
  }
  return withoutSeparator;
}

// ---------------------------------------------------------------------------
// Path joining
// ---------------------------------------------------------------------------

/**
 * Joins two paths using the platform `path.join` and re-parses the result.
 *
 * @example
 * ```ts
 * import { PathX } from "@nunofyobiz/effect-extras"
 *
 * const base = PathX.fromPathString("/usr/local/")
 * const rel  = PathX.fromPathString("bin/node")
 * const result = PathX.join(base, rel)
 * assert.deepStrictEqual(result.path, "/usr/local/bin/node")
 * ```
 *
 * @category combinators
 * @since 0.0.0
 */
export const join = (first: Path, second: Path): Path =>
  fromPathString(nodePath.join(toPathString(first), toPathString(second)));

/**
 * Curried form of {@link join} — data-last: `pipe(first, PathX.joinWith(second))`.
 *
 * @example
 * ```ts
 * import { pipe } from "effect"
 * import { PathX } from "@nunofyobiz/effect-extras"
 *
 * const appendBin = PathX.joinWith(PathX.fromPathString("bin/node"))
 * const result = appendBin(PathX.fromPathString("/usr/local/"))
 * assert.deepStrictEqual(result.path, "/usr/local/bin/node")
 * ```
 *
 * @category combinators
 * @since 0.0.0
 */
export const joinWith =
  (second: Path) =>
  (first: Path): Path =>
    join(first, second);

/**
 * Curried form of {@link join} — arguments flipped: `pipe(second, PathX.joinTo(first))`.
 *
 * @example
 * ```ts
 * import { pipe } from "effect"
 * import { PathX } from "@nunofyobiz/effect-extras"
 *
 * const prependBase = PathX.joinTo(PathX.fromPathString("/usr/local/"))
 * const result = prependBase(PathX.fromPathString("bin/node"))
 * assert.deepStrictEqual(result.path, "/usr/local/bin/node")
 * ```
 *
 * @category combinators
 * @since 0.0.0
 */
export const joinTo =
  (first: Path) =>
  (second: Path): Path =>
    join(first, second);

// ---------------------------------------------------------------------------
// Named constants
// ---------------------------------------------------------------------------

/**
 * The canonical relative-up dirlike path (`../`).
 *
 * @example
 * ```ts
 * import { PathX } from "@nunofyobiz/effect-extras"
 *
 * assert.deepStrictEqual(PathX.up.rootType, "relative-up")
 * assert.deepStrictEqual(PathX.up.leafType, "dirlike")
 * ```
 *
 * @category constants
 * @since 0.0.0
 */
export const up: RelativeUpDirlikePath = pipe(
  fromPathString(`${RAW_UP_DIR}${nodePath.sep}`),
  assertRefinement(
    isRelativeUpDirlikePath,
    (p) =>
      `PathX: expected "../" to be RelativeUpDirlikePath, got ${JSON.stringify(p)}`,
  ),
);

/**
 * The canonical relative-down dirlike path representing the current directory
 * (`./`).
 *
 * @example
 * ```ts
 * import { PathX } from "@nunofyobiz/effect-extras"
 *
 * assert.deepStrictEqual(PathX.thisDirectory.rootType, "relative-down")
 * assert.deepStrictEqual(PathX.thisDirectory.leafType, "dirlike")
 * ```
 *
 * @category constants
 * @since 0.0.0
 */
export const thisDirectory: RelativeDownDirlikePath = pipe(
  fromPathString(`${RAW_THIS_DIR}${nodePath.sep}`),
  assertRefinement(
    isRelativeDownDirlikePath,
    (p) =>
      `PathX: expected "./" to be RelativeDownDirlikePath, got ${JSON.stringify(p)}`,
  ),
);
