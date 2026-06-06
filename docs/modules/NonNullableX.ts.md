---
title: NonNullableX.ts
nav_order: 9
parent: Modules
---

## NonNullableX overview

Helpers for working with non-nullable values.

Added in v0.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [mapping](#mapping)
  - [lift](#lift)
  - [map](#map)
- [ordering](#ordering)
  - [nullableOrder](#nullableorder)
- [pattern matching](#pattern-matching)
  - [match](#match)
- [unsafe](#unsafe)
  - [fromNullableOrThrow](#fromnullableorthrow)

---

# mapping

## lift

Lifts a total function `(a: A) => B` into one that tolerates nullish input,
applying it to present values and passing `null`/`undefined` through unchanged.

Where `map` operates on a value, `lift` transforms the function itself,
yielding a reusable `(a: A | null | undefined) => B | null | undefined` you can
drop into a `pipe`. Use it to adapt a plain transform to a nullable pipeline
without wrapping each call site.

**Signature**

```ts
export declare const lift: <A, B>(map: (a: A) => B) => (a: A | null | undefined) => B | null | undefined
```

**Example**

```ts
import { NonNullableX } from "@nunofyobiz/effect-extras"
import { Number, pipe } from "effect"

const addOne = NonNullableX.lift(Number.sum(1))

assert.deepStrictEqual(pipe(1, addOne), 2)
assert.deepStrictEqual(pipe(null, addOne), null)
assert.deepStrictEqual(pipe(undefined, addOne), undefined)
```

Added in v0.0.0

## map

Applies `map` to `a` only when it is non-nullish, passing nullish inputs
through unchanged.

This is the nullable-preserving map: a present value is transformed to `B`,
while `null` stays `null` and `undefined` stays `undefined`, so nullability is
carried through the transformation. Supports both data-first and data-last
(pipeable) call styles.

**Signature**

```ts
export declare const map: (<A, B>(map: (a: NonNullable<A>) => B) => (a: A) => B | (null & A) | (undefined & A)) &
  (<A, B>(a: A, map: (a: NonNullable<A>) => B) => B | (null & A) | (undefined & A))
```

**Example**

```ts
import { NonNullableX } from "@nunofyobiz/effect-extras"
import { pipe } from "effect"

// Data-first — present value is transformed
assert.deepStrictEqual(
  NonNullableX.map(1, (v: number) => v + 1),
  2
)

// Data-last — nullish passes through unchanged
const value: number | null = null
assert.deepStrictEqual(
  pipe(
    value,
    NonNullableX.map<number | null, number>((v) => v + 1)
  ),
  null
)
```

Added in v0.0.0

# ordering

## nullableOrder

Extends an `Order.Order<A>` to an `Order.Order<A | null>`, deciding where
`null` sorts relative to present values via the `behavior` argument.

Pass `"value-null"` to push `null`s to the end and `"null-value"` to pull them
to the front; two present values fall back to the wrapped order. Use it to sort
collections that mix real values with gaps without a bespoke comparator.
Supports both data-first and data-last (pipeable) call styles.

**Signature**

```ts
export declare const nullableOrder: ((
  behavior: "value-null" | "null-value"
) => <A>(order: Order.Order<A>) => Order.Order<A | null>) &
  (<A>(order: Order.Order<A>, behavior: "value-null" | "null-value") => Order.Order<A | null>)
```

**Example**

```ts
import { NonNullableX } from "@nunofyobiz/effect-extras"
import { Array, Order, pipe } from "effect"

// "value-null" — nulls sorted last
assert.deepStrictEqual(
  pipe([null, 1, 3, null, 2], Array.sort(NonNullableX.nullableOrder(Order.Number, "value-null"))),
  [1, 2, 3, null, null]
)

// "null-value" — nulls sorted first (data-last)
assert.deepStrictEqual(
  pipe([null, 1, 3, null, 2], Array.sort(pipe(Order.Number, NonNullableX.nullableOrder("null-value")))),
  [null, null, 1, 2, 3]
)
```

Added in v0.0.0

# pattern matching

## match

Branches on whether `value` is nullish, passing the value narrowed to
`NonNullable<A>` to the `whenNotNullable` handler.

A nullable-aware sibling of `Match.value`: it folds a present-or-absent value
into a single `B` without an `if`/`else` or a manual `!= null` check. Note that
falsy-but-present values (`""`, `0`, `false`) take the `whenNotNullable`
branch — only `null` and `undefined` are treated as absent. Supports both
data-first and data-last (pipeable) call styles.

**Signature**

```ts
export declare const match: (<A, B>(handlers: {
  whenNullable: () => B
  whenNotNullable: (value: NonNullable<A>) => B
}) => (value: A) => B) &
  (<A, B>(value: A, handlers: { whenNullable: () => B; whenNotNullable: (value: NonNullable<A>) => B }) => B)
```

**Example**

```ts
import { NonNullableX } from "@nunofyobiz/effect-extras"
import { pipe } from "effect"

// Data-first — present value flows through narrowed
assert.deepStrictEqual(
  NonNullableX.match("value", {
    whenNullable: () => "nullable",
    whenNotNullable: (value) => value
  }),
  "value"
)

// Data-last — null takes the whenNullable branch
assert.deepStrictEqual(
  pipe(
    null,
    NonNullableX.match({
      whenNullable: () => "nullable",
      whenNotNullable: (value) => value
    })
  ),
  "nullable"
)
```

Added in v0.0.0

# unsafe

## fromNullableOrThrow

Returns `value` narrowed to `NonNullable<A>`, throwing an `Error` if it is
`null` or `undefined`.

Use it at trusted boundaries where a value is known to be present but typed as
nullable, turning a silent `undefined` into a loud failure. An optional
`variableName` is woven into the thrown message to aid debugging. This is the
function re-exported as `nn` from the module barrel, a terse shorthand handy
inside string interpolations.

**Signature**

```ts
export declare const fromNullableOrThrow: <A>(value: A, variableName?: string) => NonNullable<A>
```

**Example**

```ts
import { NonNullableX } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(NonNullableX.fromNullableOrThrow("value"), "value")

assert.throws(
  () => NonNullableX.fromNullableOrThrow(null, "varName"),
  /Value is nullable: null \(variable name: varName\)/
)
```

Added in v0.0.0
