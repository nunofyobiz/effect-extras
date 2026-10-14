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

Chooses one handler using a type guard. When the guard succeeds, `whenTrue`
receives the original value with its type narrowed; otherwise, `whenFalse`
runs with no arguments.

Use it to turn an optional or mixed-type value into a result, such as a greeting
with a fallback for a missing display name. Supports direct and piped calls.

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
import { pipe, String } from "effect"

const displayName: unknown = "Ada"
// A provided name becomes a personalised greeting.
assert.deepStrictEqual(
  PredicateX.matchRefine(displayName, PredicateX.isNonEmptyString, {
    whenTrue: (name) => `Hello, ${name}!`,
    whenFalse: () => "Hello, guest!"
  }),
  "Hello, Ada!"
)

const missingDisplayName: unknown = undefined
// A missing name uses the fallback, then the greeting is uppercased.
assert.deepStrictEqual(
  pipe(
    missingDisplayName,
    PredicateX.matchRefine(PredicateX.isNonEmptyString, {
      whenTrue: (name) => `Hello, ${name}!`,
      whenFalse: () => "Hello, guest!"
    }),
    String.toUpperCase
  ),
  "HELLO, GUEST!"
)
```

Added in v0.0.0

# refinements

## isNonEmptyString

Checks whether an unknown value is a string with at least one character,
narrowing it to `string` on success. Useful for checking optional display names.

Strings are not trimmed: whitespace-only strings also pass.

**Signature**

```ts
export declare function isNonEmptyString(value: unknown): value is string
```

**Example**

```ts
import { PredicateX } from "@nunofyobiz/effect-extras"

const displayName: unknown = "Ada"
// A provided name passes; an empty or missing name does not.
assert.deepStrictEqual(PredicateX.isNonEmptyString(displayName), true)
assert.deepStrictEqual(PredicateX.isNonEmptyString(""), false)
assert.deepStrictEqual(PredicateX.isNonEmptyString(null), false)
// Spaces count as characters because the guard does not trim.
assert.deepStrictEqual(PredicateX.isNonEmptyString("   "), true)
```

Added in v0.0.0

## unsafeIsRecord

Checks whether an unknown value is an object whose prototype is
`Object.prototype` (an ordinary object) or `null` (an `Object.create(null)` map),
narrowing it to `Record<string, unknown>` on success. Useful for checking whether
a settings value has a record shape before working with its entries.

Arrays, nullish values, primitives, and objects with other prototypes such as
`Map`, `Set`, `Date`, `RegExp`, or class instances fail.

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

const settings: unknown = { theme: "dark", autosave: true }
// Ordinary settings objects and maps with no prototype have a record shape.
assert.deepStrictEqual(PredicateX.unsafeIsRecord(settings), true)
assert.deepStrictEqual(PredicateX.unsafeIsRecord(Object.create(null)), true)
// Symbol keys and unchecked values still pass: this is not validation.
assert.deepStrictEqual(PredicateX.unsafeIsRecord({ [Symbol("setting")]: undefined }), true)
// A list of setting names is not a record.
assert.deepStrictEqual(PredicateX.unsafeIsRecord(["theme", "autosave"]), false)
assert.deepStrictEqual(PredicateX.unsafeIsRecord(new Map()), false)
assert.deepStrictEqual(PredicateX.unsafeIsRecord(null), false)
```

Added in v0.0.0
