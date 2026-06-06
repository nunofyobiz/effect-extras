---
title: StringX.ts
nav_order: 19
parent: Modules
---

## StringX overview

Generic, framework-agnostic extensions to Effect's `String` module.

Added in v0.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [combinators](#combinators)
  - [ensurePrepend](#ensureprepend)
  - [prepend](#prepend)
  - [surround](#surround)

---

# combinators

## ensurePrepend

Prepends `start` to `string_` unless `string_` already starts with it.

Idempotent: applying it to an already-prefixed string is a no-op, so
`ensurePrepend("foofoo", "foo")` stays `"foofoo"` rather than gaining a
second `"foo"`.

**Signature**

```ts
export declare const ensurePrepend: ((start: string) => (string_: string) => string) &
  ((string_: string, start: string) => string)
```

**Example**

```ts
import { pipe } from "effect"
import { StringX } from "@nunofyobiz/effect-extras"

// data-first — adds the prefix when missing
assert.deepStrictEqual(StringX.ensurePrepend("bar", "foo"), "foobar")

// idempotent — already prefixed, returned unchanged
assert.deepStrictEqual(StringX.ensurePrepend("foobar", "foo"), "foobar")

// data-last (piped)
assert.deepStrictEqual(pipe("bar", StringX.ensurePrepend("foo")), "foobar")
```

Added in v0.0.0

## prepend

Prepends `start` to `string_`.

v4's `String` module has no native `prepend` (only `concat`), so this fills
the gap as a pipeable helper.

**Signature**

```ts
export declare const prepend: ((start: string) => (string_: string) => string) &
  ((string_: string, start: string) => string)
```

**Example**

```ts
import { pipe } from "effect"
import { StringX } from "@nunofyobiz/effect-extras"

// data-first
assert.deepStrictEqual(StringX.prepend("world", "hello "), "hello world")

// data-last (piped)
assert.deepStrictEqual(pipe("world", StringX.prepend("hello ")), "hello world")
```

Added in v0.0.0

## surround

Wraps `string_` between `start` and `end`.

No v4 native equivalent — handy for quoting, bracketing, or fencing a value.

**Signature**

```ts
export declare const surround: ((start: string, end: string) => (string_: string) => string) &
  ((string_: string, start: string, end: string) => string)
```

**Example**

```ts
import { pipe } from "effect"
import { StringX } from "@nunofyobiz/effect-extras"

// data-first
assert.deepStrictEqual(StringX.surround("value", "[", "]"), "[value]")

// data-last (piped)
assert.deepStrictEqual(pipe("value", StringX.surround("(", ")")), "(value)")
```

Added in v0.0.0
