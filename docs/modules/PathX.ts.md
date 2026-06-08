---
title: PathX.ts
nav_order: 13
parent: Modules
---

## PathX overview

Typed filesystem path abstraction with root-type and leaf-type discrimination.

Each `Path` value encodes both how the path is rooted and how it ends:

- **Root type:** `"absolute"` | `"relative-up"` | `"relative-down"`
- **Leaf type:** `"dirlike"` | `"filelike"`

Paths are stored in normalised form (via `node:path`'s `normalize`) and can
only be constructed through {@link fromPathString}, which is the single entry
point for this module.

Added in v0.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [combinators](#combinators)
  - [asDirlike](#asdirlike)
  - [asFilelike](#asfilelike)
  - [join](#join)
  - [joinTo](#jointo)
  - [joinWith](#joinwith)
- [constants](#constants)
  - [thisDirectory](#thisdirectory)
  - [up](#up)
- [constructors](#constructors)
  - [fromPathString](#frompathstring)
- [conversions](#conversions)
  - [toPathString](#topathstring)
- [models](#models)
  - [AbsoluteDirlikePath (type alias)](#absolutedirlikepath-type-alias)
  - [AbsoluteFilelikePath (type alias)](#absolutefilelikepath-type-alias)
  - [AbsolutePath (type alias)](#absolutepath-type-alias)
  - [DirlikePath (type alias)](#dirlikepath-type-alias)
  - [FilelikePath (type alias)](#filelikepath-type-alias)
  - [Path (interface)](#path-interface)
  - [RelativeDownDirlikePath (type alias)](#relativedowndirlikepath-type-alias)
  - [RelativeDownFilelikePath (type alias)](#relativedownfilelikepath-type-alias)
  - [RelativeDownPath (type alias)](#relativedownpath-type-alias)
  - [RelativePath (type alias)](#relativepath-type-alias)
  - [RelativeUpDirlikePath (type alias)](#relativeupdirlikepath-type-alias)
  - [RelativeUpFilelikePath (type alias)](#relativeupfilelikepath-type-alias)
  - [RelativeUpPath (type alias)](#relativeuppath-type-alias)
- [predicates](#predicates)
  - [isAbsoluteDirlikePath](#isabsolutedirlikepath)
  - [isAbsoluteFilelikePath](#isabsolutefilelikepath)
  - [isAbsolutePath](#isabsolutepath)
  - [isDirlikePath](#isdirlikepath)
  - [isFilelikePath](#isfilelikepath)
  - [isRelativeDownDirlikePath](#isrelativedowndirlikepath)
  - [isRelativeDownFilelikePath](#isrelativedownfilelikepath)
  - [isRelativeDownPath](#isrelativedownpath)
  - [isRelativePath](#isrelativepath)
  - [isRelativeUpDirlikePath](#isrelativeupdirlikepath)
  - [isRelativeUpFilelikePath](#isrelativeupfilelikepath)
  - [isRelativeUpPath](#isrelativeuppath)

---

# combinators

## asDirlike

Ensures `path` ends with the platform separator, returning a
{@link DirlikePath}.

If `path` is already dirlike it is returned unchanged. Otherwise the
platform separator is appended and the result is re-parsed via
{@link fromPathString}.

The overloads preserve the root-type information when the input type is
known: `asDirlike(myAbsolutePath)` returns `AbsoluteDirlikePath`, etc.

**Signature**

```ts
export declare function asDirlike(path: AbsolutePath): AbsoluteDirlikePath
export declare function asDirlike(path: RelativeUpPath): RelativeUpDirlikePath
export declare function asDirlike(path: RelativeDownPath): RelativeDownDirlikePath
export declare function asDirlike(path: Path): DirlikePath
```

**Example**

```ts
import { PathX } from "@nunofyobiz/effect-extras"

const p = PathX.fromPathString("/usr/local")
assert.deepStrictEqual(PathX.asDirlike(p).leafType, "dirlike")
assert.deepStrictEqual(PathX.asDirlike(p).path.endsWith("/"), true)
```

Added in v0.0.0

## asFilelike

Strips the trailing platform separator from `path`, returning a
{@link FilelikePath}.

If `path` is already filelike it is returned unchanged. Otherwise the last
character (the separator) is removed and the result is re-parsed via
{@link fromPathString}.

The overloads preserve the root-type information when the input type is
known.

**Signature**

```ts
export declare function asFilelike(path: AbsolutePath): AbsoluteFilelikePath
export declare function asFilelike(path: RelativeUpPath): RelativeUpFilelikePath
export declare function asFilelike(path: RelativeDownPath): RelativeDownFilelikePath
export declare function asFilelike(path: Path): FilelikePath
```

**Example**

```ts
import { PathX } from "@nunofyobiz/effect-extras"

const p = PathX.fromPathString("/usr/local/")
assert.deepStrictEqual(PathX.asFilelike(p).leafType, "filelike")
assert.deepStrictEqual(PathX.asFilelike(p).path.endsWith("/"), false)
```

Added in v0.0.0

## join

Joins two paths using the platform `path.join` and re-parses the result.

**Signature**

```ts
export declare const join: (first: Path, second: Path) => Path
```

**Example**

```ts
import { PathX } from "@nunofyobiz/effect-extras"

const base = PathX.fromPathString("/usr/local/")
const rel = PathX.fromPathString("bin/node")
const result = PathX.join(base, rel)
assert.deepStrictEqual(result.path, "/usr/local/bin/node")
```

Added in v0.0.0

## joinTo

Curried form of {@link join} — arguments flipped: `pipe(second, PathX.joinTo(first))`.

**Signature**

```ts
export declare const joinTo: (first: Path) => (second: Path) => Path
```

**Example**

```ts
import { pipe } from "effect"
import { PathX } from "@nunofyobiz/effect-extras"

const prependBase = PathX.joinTo(PathX.fromPathString("/usr/local/"))
const result = prependBase(PathX.fromPathString("bin/node"))
assert.deepStrictEqual(result.path, "/usr/local/bin/node")
```

Added in v0.0.0

## joinWith

Curried form of {@link join} — data-last: `pipe(first, PathX.joinWith(second))`.

**Signature**

```ts
export declare const joinWith: (second: Path) => (first: Path) => Path
```

**Example**

```ts
import { pipe } from "effect"
import { PathX } from "@nunofyobiz/effect-extras"

const appendBin = PathX.joinWith(PathX.fromPathString("bin/node"))
const result = appendBin(PathX.fromPathString("/usr/local/"))
assert.deepStrictEqual(result.path, "/usr/local/bin/node")
```

Added in v0.0.0

# constants

## thisDirectory

The canonical relative-down dirlike path representing the current directory
(`./`).

**Signature**

```ts
export declare const thisDirectory: RelativeDownDirlikePath
```

**Example**

```ts
import { PathX } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(PathX.thisDirectory.rootType, "relative-down")
assert.deepStrictEqual(PathX.thisDirectory.leafType, "dirlike")
```

Added in v0.0.0

## up

The canonical relative-up dirlike path (`../`).

**Signature**

```ts
export declare const up: RelativeUpDirlikePath
```

**Example**

```ts
import { PathX } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(PathX.up.rootType, "relative-up")
assert.deepStrictEqual(PathX.up.leafType, "dirlike")
```

Added in v0.0.0

# constructors

## fromPathString

Parses `rawPath` into a {@link Path}, normalising the string and computing
its `rootType` and `leafType`.

Throws a `SchemaError` when `rawPath` is empty or otherwise invalid.

**Signature**

```ts
export declare const fromPathString: (rawPath: string) => Path
```

**Example**

```ts
import { PathX } from "@nunofyobiz/effect-extras"

const p = PathX.fromPathString("/usr/local/")
assert.deepStrictEqual(p.rootType, "absolute")
assert.deepStrictEqual(p.leafType, "dirlike")
```

Added in v0.0.0

# conversions

## toPathString

Serialises a {@link Path} back to its normalised string form.

**Signature**

```ts
export declare const toPathString: (path: Path) => string
```

**Example**

```ts
import { PathX } from "@nunofyobiz/effect-extras"

const p = PathX.fromPathString("../config.json")
assert.deepStrictEqual(PathX.toPathString(p), "../config.json")
```

Added in v0.0.0

# models

## AbsoluteDirlikePath (type alias)

The cross-product of {@link AbsolutePath} and {@link DirlikePath}.

**Signature**

```ts
export type AbsoluteDirlikePath = Path<"absolute", "dirlike">
```

**Example**

```ts
import { PathX } from "@nunofyobiz/effect-extras"

const p = PathX.fromPathString("/usr/")
assert.deepStrictEqual(PathX.isAbsoluteDirlikePath(p), true)
```

Added in v0.0.0

## AbsoluteFilelikePath (type alias)

The cross-product of {@link AbsolutePath} and {@link FilelikePath}.

**Signature**

```ts
export type AbsoluteFilelikePath = Path<"absolute", "filelike">
```

**Example**

```ts
import { PathX } from "@nunofyobiz/effect-extras"

const p = PathX.fromPathString("/usr/local")
assert.deepStrictEqual(PathX.isAbsoluteFilelikePath(p), true)
```

Added in v0.0.0

## AbsolutePath (type alias)

A path rooted at the filesystem root (e.g. `/usr/local`).

**Signature**

```ts
export type AbsolutePath = Path<"absolute">
```

**Example**

```ts
import { PathX } from "@nunofyobiz/effect-extras"

const p = PathX.fromPathString("/usr/local")
assert.deepStrictEqual(p.rootType, "absolute")
```

Added in v0.0.0

## DirlikePath (type alias)

A path whose last segment represents a directory — ends with the platform
path separator (e.g. `/usr/local/` or `src/`).

**Signature**

```ts
export type DirlikePath = Path<"absolute" | "relative-up" | "relative-down", "dirlike">
```

**Example**

```ts
import { PathX } from "@nunofyobiz/effect-extras"

const p = PathX.fromPathString("/usr/local/")
assert.deepStrictEqual(p.leafType, "dirlike")
```

Added in v0.0.0

## FilelikePath (type alias)

A path whose last segment represents a file (does not end with the platform
separator).

**Signature**

```ts
export type FilelikePath = Path<"absolute" | "relative-up" | "relative-down", "filelike">
```

**Example**

```ts
import { PathX } from "@nunofyobiz/effect-extras"

const p = PathX.fromPathString("/usr/local")
assert.deepStrictEqual(p.leafType, "filelike")
```

Added in v0.0.0

## Path (interface)

A typed filesystem path discriminated by root type (`R`) and leaf type (`L`).

- `R` narrows which root types are valid: `"absolute"`, `"relative-up"`, or
  `"relative-down"`. All three are allowed by default.
- `L` narrows whether the path ends like a directory (`"dirlike"`) or a file
  (`"filelike"`). Both are allowed by default.

Use {@link fromPathString} to construct a `Path` from a raw string. The
narrower type aliases — {@link AbsolutePath}, {@link DirlikePath},
{@link AbsoluteDirlikePath}, etc. — are produced by the typed predicates and
combinators in this module.

**Signature**

```ts
export interface Path<
  R extends "absolute" | "relative-up" | "relative-down" = "absolute" | "relative-up" | "relative-down",
  L extends "dirlike" | "filelike" = "dirlike" | "filelike"
> {
  readonly path: string
  readonly rootType: R
  readonly leafType: L
}
```

**Example**

```ts
import { PathX } from "@nunofyobiz/effect-extras"

const p = PathX.fromPathString("/usr/local")
const dirlikeP = PathX.asDirlike(p)
assert.deepStrictEqual(dirlikeP.rootType, "absolute")
assert.deepStrictEqual(dirlikeP.leafType, "dirlike")
```

Added in v0.0.0

## RelativeDownDirlikePath (type alias)

The cross-product of {@link RelativeDownPath} and {@link DirlikePath}.

**Signature**

```ts
export type RelativeDownDirlikePath = Path<"relative-down", "dirlike">
```

**Example**

```ts
import { PathX } from "@nunofyobiz/effect-extras"

const p = PathX.fromPathString("src/")
assert.deepStrictEqual(PathX.isRelativeDownDirlikePath(p), true)
```

Added in v0.0.0

## RelativeDownFilelikePath (type alias)

The cross-product of {@link RelativeDownPath} and {@link FilelikePath}.

**Signature**

```ts
export type RelativeDownFilelikePath = Path<"relative-down", "filelike">
```

**Example**

```ts
import { PathX } from "@nunofyobiz/effect-extras"

const p = PathX.fromPathString("src/index.ts")
assert.deepStrictEqual(PathX.isRelativeDownFilelikePath(p), true)
```

Added in v0.0.0

## RelativeDownPath (type alias)

A relative path that stays at or below the current directory (e.g.
`src/index.ts`).

**Signature**

```ts
export type RelativeDownPath = Path<"relative-down">
```

**Example**

```ts
import { PathX } from "@nunofyobiz/effect-extras"

const p = PathX.fromPathString("src/index.ts")
assert.deepStrictEqual(p.rootType, "relative-down")
```

Added in v0.0.0

## RelativePath (type alias)

Any relative path — either {@link RelativeUpPath} or {@link RelativeDownPath}.

**Signature**

```ts
export type RelativePath = Path<"relative-up" | "relative-down">
```

**Example**

```ts
import { PathX } from "@nunofyobiz/effect-extras"

const upPath = PathX.fromPathString("../foo")
const downPath = PathX.fromPathString("src/")
assert.deepStrictEqual(PathX.isRelativePath(upPath), true)
assert.deepStrictEqual(PathX.isRelativePath(downPath), true)
```

Added in v0.0.0

## RelativeUpDirlikePath (type alias)

The cross-product of {@link RelativeUpPath} and {@link DirlikePath}.

**Signature**

```ts
export type RelativeUpDirlikePath = Path<"relative-up", "dirlike">
```

**Example**

```ts
import { PathX } from "@nunofyobiz/effect-extras"

const p = PathX.fromPathString("../")
assert.deepStrictEqual(PathX.isRelativeUpDirlikePath(p), true)
```

Added in v0.0.0

## RelativeUpFilelikePath (type alias)

The cross-product of {@link RelativeUpPath} and {@link FilelikePath}.

**Signature**

```ts
export type RelativeUpFilelikePath = Path<"relative-up", "filelike">
```

**Example**

```ts
import { PathX } from "@nunofyobiz/effect-extras"

const p = PathX.fromPathString("../foo.ts")
assert.deepStrictEqual(PathX.isRelativeUpFilelikePath(p), true)
```

Added in v0.0.0

## RelativeUpPath (type alias)

A relative path whose first segment is `..` (moves up from the current
directory, e.g. `../config`).

**Signature**

```ts
export type RelativeUpPath = Path<"relative-up">
```

**Example**

```ts
import { PathX } from "@nunofyobiz/effect-extras"

const p = PathX.fromPathString("../config")
assert.deepStrictEqual(p.rootType, "relative-up")
```

Added in v0.0.0

# predicates

## isAbsoluteDirlikePath

Returns `true` when `path` is an {@link AbsoluteDirlikePath}.

**Signature**

```ts
export declare const isAbsoluteDirlikePath: (path: Path) => path is AbsoluteDirlikePath
```

**Example**

```ts
import { PathX } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(PathX.isAbsoluteDirlikePath(PathX.fromPathString("/usr/")), true)
assert.deepStrictEqual(PathX.isAbsoluteDirlikePath(PathX.fromPathString("/usr")), false)
```

Added in v0.0.0

## isAbsoluteFilelikePath

Returns `true` when `path` is an {@link AbsoluteFilelikePath}.

**Signature**

```ts
export declare const isAbsoluteFilelikePath: (path: Path) => path is AbsoluteFilelikePath
```

**Example**

```ts
import { PathX } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(PathX.isAbsoluteFilelikePath(PathX.fromPathString("/usr/local")), true)
assert.deepStrictEqual(PathX.isAbsoluteFilelikePath(PathX.fromPathString("/usr/")), false)
```

Added in v0.0.0

## isAbsolutePath

Returns `true` when `path` is an {@link AbsolutePath} (starts with the
filesystem root).

**Signature**

```ts
export declare const isAbsolutePath: (path: Path) => path is AbsolutePath
```

**Example**

```ts
import { PathX } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(PathX.isAbsolutePath(PathX.fromPathString("/usr")), true)
assert.deepStrictEqual(PathX.isAbsolutePath(PathX.fromPathString("../foo")), false)
```

Added in v0.0.0

## isDirlikePath

Returns `true` when `path` ends with the platform separator, making it a
{@link DirlikePath}.

**Signature**

```ts
export declare const isDirlikePath: (path: Path) => path is DirlikePath
```

**Example**

```ts
import { PathX } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(PathX.isDirlikePath(PathX.fromPathString("/usr/")), true)
assert.deepStrictEqual(PathX.isDirlikePath(PathX.fromPathString("/usr/local")), false)
```

Added in v0.0.0

## isFilelikePath

Returns `true` when `path` does not end with the platform separator, making
it a {@link FilelikePath}.

**Signature**

```ts
export declare const isFilelikePath: (path: Path) => path is FilelikePath
```

**Example**

```ts
import { PathX } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(PathX.isFilelikePath(PathX.fromPathString("/usr/local")), true)
assert.deepStrictEqual(PathX.isFilelikePath(PathX.fromPathString("/usr/")), false)
```

Added in v0.0.0

## isRelativeDownDirlikePath

Returns `true` when `path` is a {@link RelativeDownDirlikePath}.

**Signature**

```ts
export declare const isRelativeDownDirlikePath: (path: Path) => path is RelativeDownDirlikePath
```

**Example**

```ts
import { PathX } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(PathX.isRelativeDownDirlikePath(PathX.fromPathString("src/")), true)
assert.deepStrictEqual(PathX.isRelativeDownDirlikePath(PathX.fromPathString("src/index.ts")), false)
```

Added in v0.0.0

## isRelativeDownFilelikePath

Returns `true` when `path` is a {@link RelativeDownFilelikePath}.

**Signature**

```ts
export declare const isRelativeDownFilelikePath: (path: Path) => path is RelativeDownFilelikePath
```

**Example**

```ts
import { PathX } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(PathX.isRelativeDownFilelikePath(PathX.fromPathString("src/index.ts")), true)
assert.deepStrictEqual(PathX.isRelativeDownFilelikePath(PathX.fromPathString("src/")), false)
```

Added in v0.0.0

## isRelativeDownPath

Returns `true` when `path` is a {@link RelativeDownPath} (relative, first
segment is not `..`).

**Signature**

```ts
export declare const isRelativeDownPath: (path: Path) => path is RelativeDownPath
```

**Example**

```ts
import { PathX } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(PathX.isRelativeDownPath(PathX.fromPathString("src/index.ts")), true)
assert.deepStrictEqual(PathX.isRelativeDownPath(PathX.fromPathString("../foo")), false)
```

Added in v0.0.0

## isRelativePath

Returns `true` when `path` is a {@link RelativePath} (either up or down).

**Signature**

```ts
export declare const isRelativePath: (path: Path) => path is RelativePath
```

**Example**

```ts
import { PathX } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(PathX.isRelativePath(PathX.fromPathString("../foo")), true)
assert.deepStrictEqual(PathX.isRelativePath(PathX.fromPathString("./foo")), true)
assert.deepStrictEqual(PathX.isRelativePath(PathX.fromPathString("/foo")), false)
```

Added in v0.0.0

## isRelativeUpDirlikePath

Returns `true` when `path` is a {@link RelativeUpDirlikePath}.

**Signature**

```ts
export declare const isRelativeUpDirlikePath: (path: Path) => path is RelativeUpDirlikePath
```

**Example**

```ts
import { PathX } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(PathX.isRelativeUpDirlikePath(PathX.fromPathString("../")), true)
assert.deepStrictEqual(PathX.isRelativeUpDirlikePath(PathX.fromPathString("../foo")), false)
```

Added in v0.0.0

## isRelativeUpFilelikePath

Returns `true` when `path` is a {@link RelativeUpFilelikePath}.

**Signature**

```ts
export declare const isRelativeUpFilelikePath: (path: Path) => path is RelativeUpFilelikePath
```

**Example**

```ts
import { PathX } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(PathX.isRelativeUpFilelikePath(PathX.fromPathString("../foo.ts")), true)
assert.deepStrictEqual(PathX.isRelativeUpFilelikePath(PathX.fromPathString("../")), false)
```

Added in v0.0.0

## isRelativeUpPath

Returns `true` when `path` is a {@link RelativeUpPath} (first segment is
`..`).

**Signature**

```ts
export declare const isRelativeUpPath: (path: Path) => path is RelativeUpPath
```

**Example**

```ts
import { PathX } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(PathX.isRelativeUpPath(PathX.fromPathString("../foo")), true)
assert.deepStrictEqual(PathX.isRelativeUpPath(PathX.fromPathString("./foo")), false)
```

Added in v0.0.0
