---
title: OptionX.ts
nav_order: 10
parent: Modules
---

## OptionX overview

Generic, framework-agnostic extensions to Effect's `Option` module.

Added in v0.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [combinators](#combinators)
  - [tupleOf](#tupleof)
- [constructors](#constructors)
  - [fromNullableOption](#fromnullableoption)
- [mapping](#mapping)
  - [mapSomeOrNull](#mapsomeornull)
  - [mapSomeOrUndefined](#mapsomeorundefined)
- [sequencing](#sequencing)
  - [ifSome](#ifsome)
  - [inspectSome](#inspectsome)

---

# combinators

## tupleOf

Combines two `Option`s into an `Option` of a tuple, succeeding only when both
are `Some`.

Returns `Some([a, b])` when both inputs are `Some`, and `None` if either is
`None`. Useful when an operation needs two optional values present at once.

**Signature**

```ts
export declare const tupleOf: (<B>(b: Option.Option<B>) => <A>(a: Option.Option<A>) => Option.Option<[A, B]>) &
  (<A, B>(a: Option.Option<A>, b: Option.Option<B>) => Option.Option<[A, B]>)
```

**Example**

```ts
import { Option, pipe } from "effect"
import { OptionX } from "@nunofyobiz/effect-extras"

// Both Some — succeeds with the pair
assert.deepStrictEqual(OptionX.tupleOf(Option.some(1), Option.some("a")), Option.some([1, "a"]))

// Either None collapses to None
assert.deepStrictEqual(OptionX.tupleOf(Option.some(1), Option.none()), Option.none())

// Data-last (piped): the piped Option fills the first tuple slot
assert.deepStrictEqual(pipe(Option.some(1), OptionX.tupleOf(Option.some("a"))), Option.some([1, "a"]))
```

Added in v0.0.0

# constructors

## fromNullableOption

Normalizes a possibly-nullish `Option` into a plain `Option`, mapping `null`
and `undefined` to `None`.

Handy at boundaries where an `Option` value might itself arrive as `null` or
`undefined` (for example an optional field that holds an `Option`): the result
is always a well-formed `Option`, never `null`/`undefined`.

**Signature**

```ts
export declare const fromNullableOption: <A>(nullableOption: Option.Option<A> | null | undefined) => Option.Option<A>
```

**Example**

```ts
import { Option } from "effect"
import { OptionX } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(OptionX.fromNullableOption(Option.some(1)), Option.some(1))
assert.deepStrictEqual(OptionX.fromNullableOption(null), Option.none())
assert.deepStrictEqual(OptionX.fromNullableOption(undefined), Option.none())
```

Added in v0.0.0

# mapping

## mapSomeOrNull

Maps the value of an `Option` when it is `Some`, returning `null` when it is
`None`.

A shorthand for `pipe(self, Option.map(map), Option.getOrNull)`. The `null`
fallback makes it especially convenient in JSX/React, where rendering `null`
skips output — `mapSomeOrNull(value, (v) => render(v))` replaces a more verbose
`Option.match` with `onNone: () => null`.

**Signature**

```ts
export declare const mapSomeOrNull: (<A, B>(map: (a: A) => B) => (self: Option.Option<A>) => B | null) &
  (<A, B>(self: Option.Option<A>, map: (a: A) => B) => B | null)
```

**Example**

```ts
import { Option, pipe } from "effect"
import { OptionX } from "@nunofyobiz/effect-extras"

// data-first
assert.deepStrictEqual(
  OptionX.mapSomeOrNull(Option.some(1), (v) => v + 1),
  2
)

// None maps to null
assert.deepStrictEqual(
  OptionX.mapSomeOrNull(Option.none<number>(), (v) => v + 1),
  null
)

// data-last (piped)
assert.deepStrictEqual(
  pipe(
    Option.some(1),
    OptionX.mapSomeOrNull((v) => v + 1)
  ),
  2
)
```

Added in v0.0.0

## mapSomeOrUndefined

Maps the value of an `Option` when it is `Some`, returning `undefined` when it
is `None`.

The `undefined`-returning counterpart of {@link mapSomeOrNull}: a shorthand for
`pipe(self, Option.map(map), Option.getOrUndefined)`. Reach for it when the
consuming API expects `undefined` rather than `null` for "absent" (for example
an optional prop or a value spread into an object).

**Signature**

```ts
export declare const mapSomeOrUndefined: (<A, B>(map: (a: A) => B) => (self: Option.Option<A>) => B | undefined) &
  (<A, B>(self: Option.Option<A>, map: (a: A) => B) => B | undefined)
```

**Example**

```ts
import { Option, pipe } from "effect"
import { OptionX } from "@nunofyobiz/effect-extras"

// data-first
assert.deepStrictEqual(
  OptionX.mapSomeOrUndefined(Option.some(1), (v) => v + 1),
  2
)

// None maps to undefined
assert.deepStrictEqual(
  OptionX.mapSomeOrUndefined(Option.none<number>(), (v) => v + 1),
  undefined
)

// data-last (piped)
assert.deepStrictEqual(
  pipe(
    Option.some(1),
    OptionX.mapSomeOrUndefined((v) => v + 1)
  ),
  2
)
```

Added in v0.0.0

# sequencing

## ifSome

Runs a side effect with the value of an `Option` when it is `Some`, doing
nothing when it is `None`.

A shorthand for the "if Some, do something" branch of `Option.match` where the
`None` case is a no-op. The callback's return value is ignored — `ifSome`
always returns `void`.

**Signature**

```ts
export declare const ifSome: (<A>(ifSome: (value: A) => void) => (self: Option.Option<A>) => void) &
  (<A>(self: Option.Option<A>, ifSome: (value: A) => void) => void)
```

**Example**

```ts
import { Option } from "effect"
import { OptionX } from "@nunofyobiz/effect-extras"

const log: Array<number> = []
OptionX.ifSome(Option.some(1), (value) => log.push(value))
OptionX.ifSome(Option.none<number>(), (value) => log.push(value))

assert.deepStrictEqual(log, [1])
```

Added in v0.0.0

## inspectSome

Runs a side effect with the value of an `Option` when it is `Some`, then
returns the `Option` unchanged.

The pass-through counterpart of {@link ifSome}: it taps into a `Some` value
(for logging, metrics, debugging) without breaking a `pipe` chain, since it
returns the original `Option`. For `None` it is a no-op.

**Signature**

```ts
export declare const inspectSome: (<A>(function_: (value: A) => void) => (self: Option.Option<A>) => Option.Option<A>) &
  (<A>(self: Option.Option<A>, function_: (value: A) => void) => Option.Option<A>)
```

**Example**

```ts
import { Option, pipe } from "effect"
import { OptionX } from "@nunofyobiz/effect-extras"

const log: Array<number> = []
const result = pipe(
  Option.some(1),
  OptionX.inspectSome((value) => log.push(value)),
  Option.map((value) => value + 1)
)

assert.deepStrictEqual(result, Option.some(2))
assert.deepStrictEqual(log, [1])
```

Added in v0.0.0
