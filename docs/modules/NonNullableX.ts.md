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

Adapts a function `(a: A) => B` to tolerate nullish input,
applying it to present values and passing `null`/`undefined` through unchanged.

Where `map` operates on a value, `lift` transforms the function itself,
yielding a reusable `(a: A | null | undefined) => B | null | undefined` you can
drop into a `pipe`. Use it to adapt a plain transform to a nullable pipeline
without wrapping each call site.

**Signature**

```ts
export declare const lift: <A, B>(function_: (a: A) => B) => (a: A | null | undefined) => B | null | undefined
```

**Example**

```ts
import { NonNullableX } from "@nunofyobiz/effect-extras"
import { pipe } from "effect"

// Reuse the same trimming transform across optional form fields.
const trimField = NonNullableX.lift((field: string) => field.trim())

assert.deepStrictEqual(pipe("  Mira  ", trimField), "Mira")
// Untouched fields keep their original missing value.
assert.deepStrictEqual(pipe(null, trimField), null)
assert.deepStrictEqual(pipe(undefined, trimField), undefined)
```

Added in v0.0.0

## map

Transforms `a` only when it is present, passing nullish inputs
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

// Turn a saved delivery address into a display label.
const address = { street: "12 Oak Street" }
assert.deepStrictEqual(
  NonNullableX.map(address, (address) => `Deliver to ${address.street}`),
  "Deliver to 12 Oak Street"
)

// An address that has not been supplied stays missing (data-last).
const missingAddress: typeof address | null = null
assert.deepStrictEqual(
  pipe(
    missingAddress,
    NonNullableX.map<typeof address | null, string>((address) => `Deliver to ${address.street}`)
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

const deliveryMinutes = [null, 25, 40, null, 30]
// List measured deliveries fastest first, with missing measurements last.
assert.deepStrictEqual(pipe(deliveryMinutes, Array.sort(NonNullableX.nullableOrder(Order.Number, "value-null"))), [
  25,
  30,
  40,
  null,
  null
])

// Put missing measurements first so they can be filled in (data-last).
assert.deepStrictEqual(
  pipe(deliveryMinutes, Array.sort(pipe(Order.Number, NonNullableX.nullableOrder("null-value")))),
  [null, null, 25, 30, 40]
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

// Display the saved nickname when one is present.
assert.deepStrictEqual(
  NonNullableX.match("Mira", {
    whenNullable: () => "Guest",
    whenNotNullable: (nickname) => `Hello, ${nickname}`
  }),
  "Hello, Mira"
)

// Without a saved nickname, show a fallback label (data-last).
assert.deepStrictEqual(
  pipe(
    null,
    NonNullableX.match({
      whenNullable: () => "Guest",
      whenNotNullable: (nickname) => `Hello, ${nickname}`
    })
  ),
  "Guest"
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

const settings: { supportEmail: string | null } = {
  supportEmail: "help@example.com"
}
// A required setting can be used directly after checking this trusted boundary.
assert.deepStrictEqual(NonNullableX.fromNullableOrThrow(settings.supportEmail, "supportEmail"), "help@example.com")

// A missing setting names the field that needs attention.
assert.throws(
  () => NonNullableX.fromNullableOrThrow(null, "supportEmail"),
  /Value is nullable: null \(variable name: supportEmail\)/
)
```

Added in v0.0.0
