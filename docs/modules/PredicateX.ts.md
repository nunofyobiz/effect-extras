---
title: PredicateX.ts
nav_order: 13
parent: Modules
---

## PredicateX overview

Generic, framework-agnostic extensions to Effect's `Predicate` module.

Added in v0.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [pattern matching](#pattern-matching)
  - [matchRefine](#matchrefine)
- [refinements](#refinements)
  - [isNonEmptyString](#isnonemptystring)
  - [unsafeIsRecord](#unsafeisrecord)

---

# pattern matching

## matchRefine

Runs a refinement against `value` and branches on the result, passing the
narrowed value to the `whenTrue` handler.

It pairs a `Predicate.Refinement<A, B>` with two continuations so the success
branch receives `value` already narrowed to `B`, replacing an `if`/`else` that
would otherwise re-check or cast. Supports both data-first and data-last
(pipeable) call styles.

**Signature**

```ts
export declare const matchRefine: (<A, B extends A, C>(
  predicate: Predicate.Refinement<A, B>,
  handlers: { whenFalse: () => C; whenTrue: (value: B) => C }
) => (value: A) => C) &
  (<A, B extends A, C>(
    value: A,
    predicate: Predicate.Refinement<A, B>,
    handlers: { whenFalse: () => C; whenTrue: (value: B) => C }
  ) => C)
```

**Example**

```ts
import { PredicateX } from "@nunofyobiz/effect-extras"
import { Predicate, pipe } from "effect"

// Data-first
assert.deepStrictEqual(
  PredicateX.matchRefine("hello", Predicate.isString, {
    whenTrue: (value) => `String: ${value}`,
    whenFalse: () => "Not a string"
  }),
  "String: hello"
)

// Data-last (pipeable)
assert.deepStrictEqual(
  pipe(
    42,
    PredicateX.matchRefine(Predicate.isString, {
      whenTrue: (value) => `String: ${value}`,
      whenFalse: () => "Not a string"
    })
  ),
  "Not a string"
)
```

Added in v0.0.0

# refinements

## isNonEmptyString

Refines an `unknown` value to a non-empty `string`, returning `true` only when
the value is present, is a `string`, and has at least one character.

This is the compound guard the repo's conventions call for: it folds
`Predicate.isNotNullish`, `Predicate.isString`, and `String.isNonEmpty` into a
single reusable refinement so call sites get `value is string` narrowing
without restating the three checks.

**Signature**

```ts
export declare function isNonEmptyString(value: unknown): value is string
```

**Example**

```ts
import { PredicateX } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(PredicateX.isNonEmptyString("hello"), true)
assert.deepStrictEqual(PredicateX.isNonEmptyString(""), false)
assert.deepStrictEqual(PredicateX.isNonEmptyString(null), false)
assert.deepStrictEqual(PredicateX.isNonEmptyString(123), false)
```

Added in v0.0.0

## unsafeIsRecord

Refines an `unknown` value to a plain `Record<string, unknown>` — `true` only
for a non-null, non-array object whose prototype is `Object.prototype` (an
object literal) or `null` (an `Object.create(null)` map).

Effect ships no `Predicate.isRecord`. `Predicate.isObject` is the closest, but
it also accepts `Map`, `Set`, `Date`, `RegExp`, and class instances. This guard
adds a prototype check to rule those out, narrowing to `Record<string, unknown>`
so the JSON-tree helpers (`RecordX.deepMerge`, `RecordX.canonicalize`,
`RecordX.deleteByPath`) can compose without an `as` cast.

It is named **`unsafe`** because the narrowing comes purely from the value's
runtime shape — it does _not_ validate the key or value types. A symbol-keyed
entry still passes despite the `string` key claim, and values are asserted
`unknown` without any check. Treat it as a structural convenience, not a
`Schema` validation: reach for `Schema` when you need real key/value guarantees.

**Signature**

```ts
export declare function unsafeIsRecord(value: unknown): value is Record<string, unknown>
```

**Example**

```ts
import { PredicateX } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(PredicateX.unsafeIsRecord({ a: 1 }), true)
assert.deepStrictEqual(PredicateX.unsafeIsRecord(Object.create(null)), true)
assert.deepStrictEqual(PredicateX.unsafeIsRecord([1, 2]), false)
assert.deepStrictEqual(PredicateX.unsafeIsRecord(new Map()), false)
assert.deepStrictEqual(PredicateX.unsafeIsRecord(null), false)
```

Added in v0.0.0
