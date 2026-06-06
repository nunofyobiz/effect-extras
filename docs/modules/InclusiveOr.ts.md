---
title: InclusiveOr.ts
nav_order: 7
parent: Modules
---

## InclusiveOr overview

The `InclusiveOr` data type — an inclusive-or carrying a `left`, a `right`, or both at once.

Added in v0.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [combinators](#combinators)
  - [zip](#zip)
- [constructors](#constructors)
  - [LeftAndRight](#leftandright)
  - [LeftOnly](#leftonly)
  - [RightOnly](#rightonly)
  - [WithLeft](#withleft)
  - [WithRight](#withright)
  - [fromNullables](#fromnullables)
  - [optionFromNullables](#optionfromnullables)
- [getters](#getters)
  - [leftOption](#leftoption)
  - [leftOrElse](#leftorelse)
  - [leftOrUndefined](#leftorundefined)
  - [orElse](#orelse)
  - [orUndefined](#orundefined)
  - [rightOption](#rightoption)
  - [rightOrElse](#rightorelse)
  - [rightOrUndefined](#rightorundefined)
- [guards](#guards)
  - [is](#is)
- [mapping](#mapping)
  - [mapBoth](#mapboth)
  - [mapLeft](#mapleft)
  - [mapRight](#mapright)
- [models](#models)
  - [InclusiveOr (type alias)](#inclusiveor-type-alias)
  - [LeftAndRight (type alias)](#leftandright-type-alias)
  - [LeftOnly (type alias)](#leftonly-type-alias)
  - [RightOnly (type alias)](#rightonly-type-alias)
  - [WithLeft (type alias)](#withleft-type-alias)
  - [WithRight (type alias)](#withright-type-alias)
- [pattern matching](#pattern-matching)
  - [match](#match)
  - [matchLeft](#matchleft)
  - [matchRight](#matchright)
- [sequencing](#sequencing)
  - [flatMapLeft](#flatmapleft)
  - [flatMapLeftEffect](#flatmaplefteffect)
  - [flatMapRight](#flatmapright)
  - [flatMapRightEffect](#flatmaprighteffect)
  - [mapBothEffect](#mapbotheffect)
  - [mapLeftEffect](#maplefteffect)
  - [mapRightEffect](#maprighteffect)

---

# combinators

## zip

Zips two arrays into one, calling `f` with an `InclusiveOr` for each index so
that length mismatches are handled explicitly rather than truncated.

Unlike `Array.zipWith` (which stops at the shorter array), this walks to the
length of the _longer_ array. The first array's element fills the `left` side
and the second array's element fills the `right` side, so at each index `f`
receives an `InclusiveOr<A, B>`: `LeftAndRight` when both arrays have an
element, `LeftOnly` when only the first does, and `RightOnly` when only the
second does. Use it when the "extra" tail of either array still carries
meaning.

**Signature**

```ts
export declare const zip: <A, B, C>(
  array1: readonly A[],
  array2: readonly B[],
  f: (inclusiveOr: InclusiveOr<A, B>) => C
) => C[]
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

const describe = InclusiveOr.match({
  LeftOnly: ({ left }) => `left ${left}`,
  RightOnly: ({ right }) => `right ${right}`,
  LeftAndRight: ({ left, right }) => `both ${left}/${right}`
})

assert.deepStrictEqual(InclusiveOr.zip([1, 2, 3], [10, 20], describe), ["both 1/10", "both 2/20", "left 3"])
```

Added in v0.0.0

# constructors

## LeftAndRight

Constructs a `LeftAndRight` — an `InclusiveOr` that carries both a `left` and a
`right`.

**Signature**

```ts
export declare const LeftAndRight: <A, B>(args: {
  readonly left: A
  readonly right: B
}) => Data.TaggedEnum.Value<Data.TaggedEnum.Kind<InclusiveOrDefinition, A, B>, "LeftAndRight">
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

const value = InclusiveOr.LeftAndRight({ left: 1, right: "a" })

assert.deepStrictEqual(value._tag, "LeftAndRight")
assert.deepStrictEqual(value.left, 1)
assert.deepStrictEqual(value.right, "a")
```

Added in v0.0.0

## LeftOnly

Constructs a `LeftOnly` — an `InclusiveOr` that carries only a `left`.

**Signature**

```ts
export declare const LeftOnly: <A, B>(args: {
  readonly left: A
}) => Data.TaggedEnum.Value<Data.TaggedEnum.Kind<InclusiveOrDefinition, A, B>, "LeftOnly">
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

const value = InclusiveOr.LeftOnly({ left: 1 })

assert.deepStrictEqual(value._tag, "LeftOnly")
assert.deepStrictEqual(value.left, 1)
```

Added in v0.0.0

## RightOnly

Constructs a `RightOnly` — an `InclusiveOr` that carries only a `right`.

**Signature**

```ts
export declare const RightOnly: <A, B>(args: {
  readonly right: B
}) => Data.TaggedEnum.Value<Data.TaggedEnum.Kind<InclusiveOrDefinition, A, B>, "RightOnly">
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

const value = InclusiveOr.RightOnly({ right: "a" })

assert.deepStrictEqual(value._tag, "RightOnly")
assert.deepStrictEqual(value.right, "a")
```

Added in v0.0.0

## WithLeft

Builds an `InclusiveOr` known to carry a `left`, choosing `LeftAndRight` when `right`
is present and `LeftOnly` otherwise.

Use it when the `left` is mandatory and the `right` is an optional companion:
pass an absent (`null`/`undefined`) `right` to get a `LeftOnly`, or a present
one to get a `LeftAndRight`. The return type `WithLeft<L, R>` reflects that a
`left` is always present.

**Signature**

```ts
export declare const WithLeft: <L, R>({ left, right }: { left: L; right?: R | undefined }) => WithLeft<L, R>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(InclusiveOr.WithLeft({ left: 1, right: "a" }), InclusiveOr.LeftAndRight({ left: 1, right: "a" }))

assert.deepStrictEqual(InclusiveOr.WithLeft({ left: 1 }), InclusiveOr.LeftOnly({ left: 1 }))
```

Added in v0.0.0

## WithRight

Builds an `InclusiveOr` known to carry a `right`, choosing `LeftAndRight` when `left`
is present and `RightOnly` otherwise.

The mirror of `WithLeft`: the `right` is mandatory and the `left` is an
optional companion. Pass an absent (`null`/`undefined`) `left` to get a
`RightOnly`, or a present one to get a `LeftAndRight`. The return type
`WithRight<L, R>` reflects that a `right` is always present.

**Signature**

```ts
export declare const WithRight: <L, R>({ left, right }: { left?: L | undefined; right: R }) => WithRight<L, R>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(
  InclusiveOr.WithRight({ left: 1, right: "a" }),
  InclusiveOr.LeftAndRight({ left: 1, right: "a" })
)

assert.deepStrictEqual(InclusiveOr.WithRight({ right: "a" }), InclusiveOr.RightOnly({ right: "a" }))
```

Added in v0.0.0

## fromNullables

Builds an `InclusiveOr` from a pair of possibly-nullish inputs, falling back to the
`orElse` thunk when both are absent.

The non-optional companion to `optionFromNullables`: it unwraps the same logic
but resolves the all-absent case with `orElse` instead of an `Option`. The
default `orElse` throws, so omit it only when at least one side is guaranteed
present.

**Signature**

```ts
export declare const fromNullables: <L, R>({
  left,
  right,
  orElse
}: {
  left?: L | null | undefined
  right?: R | null | undefined
  orElse?: () => InclusiveOr<L, R>
}) => InclusiveOr<L, R>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(
  InclusiveOr.fromNullables({ left: 1, right: "a" }),
  InclusiveOr.LeftAndRight({ left: 1, right: "a" })
)

// Both absent — fall back via orElse instead of throwing
assert.deepStrictEqual(
  InclusiveOr.fromNullables({
    left: null,
    right: null,
    orElse: () => InclusiveOr.LeftOnly({ left: 0 })
  }),
  InclusiveOr.LeftOnly({ left: 0 })
)
```

Added in v0.0.0

## optionFromNullables

Builds an `InclusiveOr` from a pair of possibly-nullish inputs, wrapping the result in
an `Option` so the all-absent case is expressible.

Returns `Option.some(LeftAndRight)` when both are present, `Option.some(LeftOnly)`
or `Option.some(RightOnly)` when exactly one is present, and `Option.none()`
when both are nullish. Use it as the total entry point for turning two optional
values into an `InclusiveOr`.

**Signature**

```ts
export declare const optionFromNullables: <L, R>({
  left,
  right
}: {
  left?: L | null | undefined
  right?: R | null | undefined
}) => Option.Option<InclusiveOr<L, R>>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { Option } from "effect"

assert.deepStrictEqual(
  InclusiveOr.optionFromNullables({ left: 1, right: "a" }),
  Option.some(InclusiveOr.LeftAndRight({ left: 1, right: "a" }))
)

assert.deepStrictEqual(
  InclusiveOr.optionFromNullables({ left: 1, right: null }),
  Option.some(InclusiveOr.LeftOnly({ left: 1 }))
)

assert.deepStrictEqual(InclusiveOr.optionFromNullables({ left: null, right: undefined }), Option.none())
```

Added in v0.0.0

# getters

## leftOption

Extracts the `left` of an `InclusiveOr` as an `Option`.

The mirror of `rightOption`: `LeftOnly` and `LeftAndRight` yield
`Option.some(left)`, while `RightOnly` yields `Option.none()`.

**Signature**

```ts
export declare const leftOption: <L, R>(inclusiveOr: InclusiveOr<L, R>) => Option.Option<L>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { Option } from "effect"

assert.deepStrictEqual(InclusiveOr.leftOption(InclusiveOr.LeftOnly({ left: 1 })), Option.some(1))
assert.deepStrictEqual(InclusiveOr.leftOption(InclusiveOr.RightOnly({ right: "a" })), Option.none())
```

Added in v0.0.0

## leftOrElse

Extracts the `left` of an `InclusiveOr`, falling back to `orElseReturn` when no `left`
is present.

`LeftOnly` and `LeftAndRight` return their `left`; `RightOnly` returns the
result of `orElseReturn`. Use it to read the left side with a default in one
step.

**Signature**

```ts
export declare const leftOrElse: <A>(orElseReturn: () => A) => <L, R>(inclusiveOr: InclusiveOr<L, R>) => L | A
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

const leftOrZero = InclusiveOr.leftOrElse(() => 0)

assert.deepStrictEqual(leftOrZero(InclusiveOr.LeftOnly({ left: 1 })), 1)
assert.deepStrictEqual(leftOrZero(InclusiveOr.LeftAndRight({ left: 1, right: "a" })), 1)
assert.deepStrictEqual(leftOrZero(InclusiveOr.RightOnly({ right: "a" })), 0)
```

Added in v0.0.0

## leftOrUndefined

Extracts the `left` of an `InclusiveOr`, returning `undefined` when no `left` is
present.

A specialisation of `leftOrElse` whose fallback is `undefined`: `LeftOnly` and
`LeftAndRight` yield their `left`, while `RightOnly` yields `undefined`.

**Signature**

```ts
export declare const leftOrUndefined: <L, R>(
  inclusiveOr:
    | { readonly _tag: "LeftOnly"; readonly left: L }
    | { readonly _tag: "RightOnly"; readonly right: R }
    | { readonly _tag: "LeftAndRight"; readonly left: L; readonly right: R }
) => L | undefined
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(InclusiveOr.leftOrUndefined(InclusiveOr.LeftOnly({ left: 1 })), 1)
assert.deepStrictEqual(InclusiveOr.leftOrUndefined(InclusiveOr.RightOnly({ right: "a" })), undefined)
```

Added in v0.0.0

## orElse

Completes an `InclusiveOr` into a guaranteed `LeftAndRight` by filling whichever side
is missing from the matching `orElse` thunk.

A `LeftAndRight` passes through unchanged; a `LeftOnly` gains a `right` from
`orElseRight`; a `RightOnly` gains a `left` from `orElseLeft`. Use it to
normalise a partial `InclusiveOr` into the both-present shape before reading both
sides.

**Signature**

```ts
export declare const orElse: <L2, R2>({
  orElseLeft,
  orElseRight
}: {
  orElseLeft: () => L2
  orElseRight: () => R2
}) => <L, R>(inclusiveOr: InclusiveOr<L, R>) => LeftAndRight<L | L2, R | R2>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

const fill = InclusiveOr.orElse({
  orElseLeft: () => 0,
  orElseRight: () => "default"
})

assert.deepStrictEqual(fill(InclusiveOr.LeftOnly({ left: 1 })), InclusiveOr.LeftAndRight({ left: 1, right: "default" }))
assert.deepStrictEqual(fill(InclusiveOr.RightOnly({ right: "a" })), InclusiveOr.LeftAndRight({ left: 0, right: "a" }))
```

Added in v0.0.0

## orUndefined

Completes an `InclusiveOr` into a `LeftAndRight` whose missing side is filled with
`undefined`.

A specialisation of `orElse` that supplies `undefined` for whichever side is
absent, so the result always exposes both `left` and `right` keys (each
possibly `undefined`). Use it when you want to destructure both sides without
branching on the tag.

**Signature**

```ts
export declare const orUndefined: <L, R>(
  inclusiveOr:
    | { readonly _tag: "LeftOnly"; readonly left: L }
    | { readonly _tag: "RightOnly"; readonly right: R }
    | { readonly _tag: "LeftAndRight"; readonly left: L; readonly right: R }
) => LeftAndRight<L | undefined, R | undefined>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(
  InclusiveOr.orUndefined(InclusiveOr.LeftOnly({ left: 1 })),
  InclusiveOr.LeftAndRight({ left: 1, right: undefined })
)
assert.deepStrictEqual(
  InclusiveOr.orUndefined(InclusiveOr.RightOnly({ right: "a" })),
  InclusiveOr.LeftAndRight({ left: undefined, right: "a" })
)
```

Added in v0.0.0

## rightOption

Extracts the `right` of an `InclusiveOr` as an `Option`.

`RightOnly` and `LeftAndRight` yield `Option.some(right)`; `LeftOnly` yields
`Option.none()`. Use it when you want to chain the right side through `Option`
combinators rather than fall back to a default eagerly.

**Signature**

```ts
export declare const rightOption: <L, R>(inclusiveOr: InclusiveOr<L, R>) => Option.Option<R>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { Option } from "effect"

assert.deepStrictEqual(InclusiveOr.rightOption(InclusiveOr.RightOnly({ right: "a" })), Option.some("a"))
assert.deepStrictEqual(InclusiveOr.rightOption(InclusiveOr.LeftOnly({ left: 1 })), Option.none())
```

Added in v0.0.0

## rightOrElse

Extracts the `right` of an `InclusiveOr`, falling back to `orElseReturn` when no
`right` is present.

The mirror of `leftOrElse`: `RightOnly` and `LeftAndRight` return their
`right`; `LeftOnly` returns the result of `orElseReturn`.

**Signature**

```ts
export declare const rightOrElse: <A>(orElseReturn: () => A) => <L, R>(inclusiveOr: InclusiveOr<L, R>) => R | A
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

const rightOrDefault = InclusiveOr.rightOrElse(() => "default")

assert.deepStrictEqual(rightOrDefault(InclusiveOr.RightOnly({ right: "a" })), "a")
assert.deepStrictEqual(rightOrDefault(InclusiveOr.LeftOnly({ left: 1 })), "default")
```

Added in v0.0.0

## rightOrUndefined

Extracts the `right` of an `InclusiveOr`, returning `undefined` when no `right` is
present.

A specialisation of `rightOrElse` whose fallback is `undefined`: `RightOnly` and
`LeftAndRight` yield their `right`, while `LeftOnly` yields `undefined`.

**Signature**

```ts
export declare const rightOrUndefined: <L, R>(
  inclusiveOr:
    | { readonly _tag: "LeftOnly"; readonly left: L }
    | { readonly _tag: "RightOnly"; readonly right: R }
    | { readonly _tag: "LeftAndRight"; readonly left: L; readonly right: R }
) => R | undefined
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(InclusiveOr.rightOrUndefined(InclusiveOr.RightOnly({ right: "a" })), "a")
assert.deepStrictEqual(InclusiveOr.rightOrUndefined(InclusiveOr.LeftOnly({ left: 1 })), undefined)
```

Added in v0.0.0

# guards

## is

Builds per-tag refinements for `InclusiveOr`. `is("LeftOnly")` is a type guard that
narrows an `InclusiveOr` to its `LeftOnly` member, and likewise for `"RightOnly"` and
`"LeftAndRight"`.

**Signature**

```ts
export declare const is: <Tag>(tag: Tag) => {
  <T extends Data.TaggedEnum.Kind<InclusiveOrDefinition, any, any, any, any>>(u: T): u is T & { readonly _tag: Tag }
  (u: unknown): u is Extract<Data.TaggedEnum.Kind<InclusiveOrDefinition>, { readonly _tag: Tag }>
}
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(InclusiveOr.is("LeftOnly")(InclusiveOr.LeftOnly({ left: 1 })), true)
assert.deepStrictEqual(InclusiveOr.is("LeftOnly")(InclusiveOr.RightOnly({ right: "a" })), false)
```

Added in v0.0.0

# mapping

## mapBoth

Transforms both sides of an `InclusiveOr`, applying `mapLeft` to any `left` and
`mapRight` to any `right`.

Each constructor is rebuilt with its mapped contents, so `LeftOnly` maps only
the left, `RightOnly` only the right, and `LeftAndRight` both. The tag is
preserved. Use it as the bifunctor map over `InclusiveOr`.

**Signature**

```ts
export declare const mapBoth: <L1, R1, L2, R2>({
  mapLeft,
  mapRight
}: {
  mapLeft: (left: L1) => L2
  mapRight: (right: R1) => R2
}) => (inclusiveOr: InclusiveOr<L1, R1>) => InclusiveOr<L2, R2>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

const both = InclusiveOr.mapBoth({
  mapLeft: (left: number) => left + 1,
  mapRight: (right: string) => right.toUpperCase()
})

assert.deepStrictEqual(
  both(InclusiveOr.LeftAndRight({ left: 1, right: "a" })),
  InclusiveOr.LeftAndRight({ left: 2, right: "A" })
)
assert.deepStrictEqual(both(InclusiveOr.LeftOnly({ left: 1 })), InclusiveOr.LeftOnly({ left: 2 }))
```

Added in v0.0.0

## mapLeft

Transforms the `left` of an `InclusiveOr`, leaving any `right` untouched.

A specialisation of `mapBoth` with the right mapper set to `identity`:
`LeftOnly` and `LeftAndRight` have their `left` mapped, while `RightOnly` passes
through unchanged.

**Signature**

```ts
export declare const mapLeft: <L1, L2>(
  mapLeft: (left: L1) => L2
) => <R>(inclusiveOr: InclusiveOr<L1, R>) => InclusiveOr<L2, R>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

const inc = InclusiveOr.mapLeft((left: number) => left + 1)

assert.deepStrictEqual(
  inc(InclusiveOr.LeftAndRight({ left: 1, right: "a" })),
  InclusiveOr.LeftAndRight({ left: 2, right: "a" })
)
assert.deepStrictEqual(inc(InclusiveOr.RightOnly({ right: "a" })), InclusiveOr.RightOnly({ right: "a" }))
```

Added in v0.0.0

## mapRight

Transforms the `right` of an `InclusiveOr`, leaving any `left` untouched.

The mirror of `mapLeft`: `RightOnly` and `LeftAndRight` have their `right`
mapped, while `LeftOnly` passes through unchanged.

**Signature**

```ts
export declare const mapRight: <R1, R2>(
  mapRight: (right: R1) => R2
) => <L>(inclusiveOr: InclusiveOr<L, R1>) => InclusiveOr<L, R2>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

const upper = InclusiveOr.mapRight((right: string) => right.toUpperCase())

assert.deepStrictEqual(
  upper(InclusiveOr.LeftAndRight({ left: 1, right: "a" })),
  InclusiveOr.LeftAndRight({ left: 1, right: "A" })
)
assert.deepStrictEqual(upper(InclusiveOr.LeftOnly({ left: 1 })), InclusiveOr.LeftOnly({ left: 1 }))
```

Added in v0.0.0

# models

## InclusiveOr (type alias)

A value carrying a left `L`, a right `R`, or both at once — the data type for
an "inclusive or".

Where `Result<R, L>` models an exclusive choice (success _or_ failure),
`InclusiveOr` adds the third case where both sides are present. It is a tagged enum
with three constructors: `LeftOnly` (only `left`), `RightOnly` (only `right`),
and `LeftAndRight` (both). Reach for it when an operation can produce partial
results — e.g. a parse that yields a value _and_ a list of warnings.

**Signature**

```ts
export type InclusiveOr<L, R> = Data.TaggedEnum<{
  LeftOnly: {
    readonly left: L
  }

  RightOnly: {
    readonly right: R
  }

  LeftAndRight: {
    readonly left: L
    readonly right: R
  }
}>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

const both: InclusiveOr.InclusiveOr<number, string> = InclusiveOr.LeftAndRight({
  left: 1,
  right: "a"
})

assert.deepStrictEqual(both._tag, "LeftAndRight")
```

Added in v0.0.0

## LeftAndRight (type alias)

The `LeftAndRight` member of `InclusiveOr` — a value that carries both a `left` and a
`right`.

**Signature**

```ts
export type LeftAndRight<L, R> = InclusiveOr<L, R> & {
  _tag: "LeftAndRight"
}
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

const value: InclusiveOr.LeftAndRight<number, string> = InclusiveOr.LeftAndRight({
  left: 1,
  right: "a"
})

assert.deepStrictEqual(value, { _tag: "LeftAndRight", left: 1, right: "a" })
```

Added in v0.0.0

## LeftOnly (type alias)

The `LeftOnly` member of `InclusiveOr` — a value that carries only a `left` and no
`right`.

**Signature**

```ts
export type LeftOnly<L> = InclusiveOr<L, never> & {
  _tag: "LeftOnly"
}
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

const value: InclusiveOr.LeftOnly<number> = InclusiveOr.LeftOnly({ left: 1 })

assert.deepStrictEqual(value.left, 1)
```

Added in v0.0.0

## RightOnly (type alias)

The `RightOnly` member of `InclusiveOr` — a value that carries only a `right` and no
`left`.

**Signature**

```ts
export type RightOnly<R> = InclusiveOr<never, R> & {
  _tag: "RightOnly"
}
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

const value: InclusiveOr.RightOnly<string> = InclusiveOr.RightOnly({ right: "a" })

assert.deepStrictEqual(value.right, "a")
```

Added in v0.0.0

## WithLeft (type alias)

Any `InclusiveOr` that is guaranteed to carry a `left` — either `LeftOnly` or
`LeftAndRight`.

**Signature**

```ts
export type WithLeft<L, R> = LeftOnly<L> | LeftAndRight<L, R>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

const value: InclusiveOr.WithLeft<number, string> = InclusiveOr.LeftOnly({ left: 1 })

assert.deepStrictEqual(value.left, 1)
```

Added in v0.0.0

## WithRight (type alias)

Any `InclusiveOr` that is guaranteed to carry a `right` — either `RightOnly` or
`LeftAndRight`.

**Signature**

```ts
export type WithRight<L, R> = RightOnly<R> | LeftAndRight<L, R>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

const value: InclusiveOr.WithRight<number, string> = InclusiveOr.RightOnly({ right: "a" })

assert.deepStrictEqual(value.right, "a")
```

Added in v0.0.0

# pattern matching

## match

Folds an `InclusiveOr` over its three tags. Provide a handler for `LeftOnly`,
`RightOnly`, and `LeftAndRight` and `match` returns a function from an `InclusiveOr`
to the handlers' common result type.

**Signature**

```ts
export declare const match: {
  <A, B, C, D, Cases>(
    cases: Cases
  ): (
    self: Data.TaggedEnum.Kind<InclusiveOrDefinition, A, B, C, D>
  ) => Unify<ReturnType<Cases["LeftOnly" | "RightOnly" | "LeftAndRight"]>>
  <A, B, C, D, Cases>(
    self:
      | { readonly _tag: "LeftOnly"; readonly left: A }
      | { readonly _tag: "RightOnly"; readonly right: B }
      | { readonly _tag: "LeftAndRight"; readonly left: A; readonly right: B },
    cases: Cases
  ): Unify<ReturnType<Cases["LeftOnly" | "RightOnly" | "LeftAndRight"]>>
}
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

const describe = InclusiveOr.match({
  LeftOnly: ({ left }) => `left ${left}`,
  RightOnly: ({ right }) => `right ${right}`,
  LeftAndRight: ({ left, right }) => `both ${left}/${right}`
})

assert.deepStrictEqual(describe(InclusiveOr.LeftAndRight({ left: 1, right: "a" })), "both 1/a")
```

Added in v0.0.0

## matchLeft

Folds an `InclusiveOr` from the left's perspective, collapsing the three tags into two
handlers.

Both `LeftOnly` and `LeftAndRight` carry a `left`, so they route to the `Left`
handler; only `RightOnly` lacks a `left` and routes to `RightOnly`. Use it when
you care about the `left` value and treat the right-only case as the exception.

**Signature**

```ts
export declare const matchLeft: <L, R, A>({
  Left,
  RightOnly
}: {
  Left: (left: L) => A
  RightOnly: (right: R) => A
}) => (inclusiveOr: InclusiveOr<L, R>) => A
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

const onLeft = InclusiveOr.matchLeft({
  Left: (left: number) => `left ${left}`,
  RightOnly: (right: string) => `right ${right}`
})

assert.deepStrictEqual(onLeft(InclusiveOr.LeftOnly({ left: 1 })), "left 1")
assert.deepStrictEqual(onLeft(InclusiveOr.LeftAndRight({ left: 1, right: "a" })), "left 1")
assert.deepStrictEqual(onLeft(InclusiveOr.RightOnly({ right: "a" })), "right a")
```

Added in v0.0.0

## matchRight

Folds an `InclusiveOr` from the right's perspective, collapsing the three tags into two
handlers.

The mirror of `matchLeft`: both `RightOnly` and `LeftAndRight` carry a `right`,
so they route to the `Right` handler; only `LeftOnly` lacks a `right` and routes
to `LeftOnly`. Use it when you care about the `right` value and treat the
left-only case as the exception.

**Signature**

```ts
export declare const matchRight: <L, R, A>({
  LeftOnly,
  Right
}: {
  LeftOnly: (left: L) => A
  Right: (right: R) => A
}) => (inclusiveOr: InclusiveOr<L, R>) => A
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

const onRight = InclusiveOr.matchRight({
  LeftOnly: (left: number) => `left ${left}`,
  Right: (right: string) => `right ${right}`
})

assert.deepStrictEqual(onRight(InclusiveOr.RightOnly({ right: "a" })), "right a")
assert.deepStrictEqual(onRight(InclusiveOr.LeftAndRight({ left: 1, right: "a" })), "right a")
assert.deepStrictEqual(onRight(InclusiveOr.LeftOnly({ left: 1 })), "left 1")
```

Added in v0.0.0

# sequencing

## flatMapLeft

Chains the `left` of an `InclusiveOr` into a new `InclusiveOr`, flattening the result.

Whenever a `left` is present (`LeftOnly` or `LeftAndRight`) it is passed to
`mapLeft`, whose returned `InclusiveOr` replaces the original; `RightOnly` passes
through unchanged. Use it to sequence left-driven computations that themselves
produce an `InclusiveOr`.

**Signature**

```ts
export declare const flatMapLeft: <L1, L2, R2>(
  mapLeft: (left: L1) => InclusiveOr<L2, R2>
) => <R1>(inclusiveOr: InclusiveOr<L1, R1>) => InclusiveOr<L2, R1 | R2>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

const chain = InclusiveOr.flatMapLeft((left: number) =>
  left > 0 ? InclusiveOr.LeftOnly({ left: left * 10 }) : InclusiveOr.RightOnly({ right: "non-positive" })
)

assert.deepStrictEqual(chain(InclusiveOr.LeftOnly({ left: 2 })), InclusiveOr.LeftOnly({ left: 20 }))
assert.deepStrictEqual(chain(InclusiveOr.RightOnly({ right: "a" })), InclusiveOr.RightOnly({ right: "a" }))
```

Added in v0.0.0

## flatMapLeftEffect

Effectful `flatMapLeft`: chains the `left` of an `InclusiveOr` into an `Effect` that
yields a new `InclusiveOr`, flattening the result.

When a `left` is present it is passed to `mapLeft`, whose effectful `InclusiveOr`
replaces the original; `RightOnly` is lifted unchanged via `Effect.succeed`. Use
it to sequence left-driven effectful computations that produce an `InclusiveOr`.

**Signature**

```ts
export declare const flatMapLeftEffect: <L1, L2, R2, EL, RL>(
  mapLeft: (left: L1) => Effect.Effect<InclusiveOr<L2, R2>, EL, RL>
) => <R1>(inclusiveOr: InclusiveOr<L1, R1>) => Effect.Effect<InclusiveOr<L2, R1 | R2>, EL, RL>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { Effect } from "effect"

const chain = InclusiveOr.flatMapLeftEffect((left: number) => Effect.succeed(InclusiveOr.LeftOnly({ left: left * 10 })))

assert.deepStrictEqual(Effect.runSync(chain(InclusiveOr.LeftOnly({ left: 2 }))), InclusiveOr.LeftOnly({ left: 20 }))
assert.deepStrictEqual(
  Effect.runSync(chain(InclusiveOr.RightOnly({ right: "a" }))),
  InclusiveOr.RightOnly({ right: "a" })
)
```

Added in v0.0.0

## flatMapRight

Chains the `right` of an `InclusiveOr` into a new `InclusiveOr`, flattening the result.

The mirror of `flatMapLeft`: whenever a `right` is present (`RightOnly` or
`LeftAndRight`) it is passed to `mapRight`, whose returned `InclusiveOr` replaces the
original; `LeftOnly` passes through unchanged.

**Signature**

```ts
export declare const flatMapRight: <L2, R1, R2>(
  mapRight: (right: R1) => InclusiveOr<L2, R2>
) => <L1>(inclusiveOr: InclusiveOr<L1, R1>) => InclusiveOr<L1 | L2, R2>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

const chain = InclusiveOr.flatMapRight((right: string) => InclusiveOr.RightOnly({ right: right.toUpperCase() }))

assert.deepStrictEqual(chain(InclusiveOr.RightOnly({ right: "a" })), InclusiveOr.RightOnly({ right: "A" }))
assert.deepStrictEqual(chain(InclusiveOr.LeftOnly({ left: 1 })), InclusiveOr.LeftOnly({ left: 1 }))
```

Added in v0.0.0

## flatMapRightEffect

Effectful `flatMapRight`: chains the `right` of an `InclusiveOr` into an `Effect` that
yields a new `InclusiveOr`, flattening the result.

The mirror of `flatMapLeftEffect`: when a `right` is present it is passed to
`mapRight`, whose effectful `InclusiveOr` replaces the original; `LeftOnly` is lifted
unchanged via `Effect.succeed`.

**Signature**

```ts
export declare const flatMapRightEffect: <L2, R1, R2, ER, RR>(
  mapRight: (right: R1) => Effect.Effect<InclusiveOr<L2, R2>, ER, RR>
) => <L1>(inclusiveOr: InclusiveOr<L1, R1>) => Effect.Effect<InclusiveOr<L1 | L2, R2>, ER, RR>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { Effect } from "effect"

const chain = InclusiveOr.flatMapRightEffect((right: string) =>
  Effect.succeed(InclusiveOr.RightOnly({ right: right.toUpperCase() }))
)

assert.deepStrictEqual(
  Effect.runSync(chain(InclusiveOr.RightOnly({ right: "a" }))),
  InclusiveOr.RightOnly({ right: "A" })
)
assert.deepStrictEqual(Effect.runSync(chain(InclusiveOr.LeftOnly({ left: 1 }))), InclusiveOr.LeftOnly({ left: 1 }))
```

Added in v0.0.0

## mapBothEffect

Effectful `mapBoth`: transforms each present side through an `Effect`,
reassembling the results into an `InclusiveOr` inside an `Effect`.

For `LeftAndRight` both effects run via `Effect.all` and their results are
combined; `LeftOnly`/`RightOnly` run only the relevant effect. Errors and
requirements from both mappers are unioned into the result type. Use it when
mapping an `InclusiveOr`'s sides requires effects (validation, IO).

**Signature**

```ts
export declare const mapBothEffect: <L1, R1, L2, R2, EL, ER, RL, RR>({
  mapLeft,
  mapRight
}: {
  mapLeft: (left: L1) => Effect.Effect<L2, EL, RL>
  mapRight: (right: R1) => Effect.Effect<R2, ER, RR>
}) => (inclusiveOr: InclusiveOr<L1, R1>) => Effect.Effect<InclusiveOr<L2, R2>, EL | ER, RL | RR>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { Effect } from "effect"

const both = InclusiveOr.mapBothEffect({
  mapLeft: (left: number) => Effect.succeed(left + 1),
  mapRight: (right: string) => Effect.succeed(right.toUpperCase())
})

assert.deepStrictEqual(
  Effect.runSync(both(InclusiveOr.LeftAndRight({ left: 1, right: "a" }))),
  InclusiveOr.LeftAndRight({ left: 2, right: "A" })
)
```

Added in v0.0.0

## mapLeftEffect

Effectful `mapLeft`: transforms the `left` of an `InclusiveOr` through an `Effect`,
leaving any `right` untouched.

A specialisation of `mapBothEffect` with the right mapper set to
`Effect.succeed`: the `left` (when present) is mapped effectfully and the
`right` is carried through unchanged.

**Signature**

```ts
export declare const mapLeftEffect: <L1, L2, EL, RL>(
  mapLeft: (left: L1) => Effect.Effect<L2, EL, RL>
) => <R>(inclusiveOr: InclusiveOr<L1, R>) => Effect.Effect<InclusiveOr<L2, R>, EL, RL>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { Effect } from "effect"

const inc = InclusiveOr.mapLeftEffect((left: number) => Effect.succeed(left + 1))

assert.deepStrictEqual(
  Effect.runSync(inc(InclusiveOr.LeftAndRight({ left: 1, right: "a" }))),
  InclusiveOr.LeftAndRight({ left: 2, right: "a" })
)
```

Added in v0.0.0

## mapRightEffect

Effectful `mapRight`: transforms the `right` of an `InclusiveOr` through an `Effect`,
leaving any `left` untouched.

The mirror of `mapLeftEffect`: the `right` (when present) is mapped effectfully
and the `left` is carried through unchanged via `Effect.succeed`.

**Signature**

```ts
export declare const mapRightEffect: <R1, R2, ER, RR>(
  mapRight: (right: R1) => Effect.Effect<R2, ER, RR>
) => <L>(inclusiveOr: InclusiveOr<L, R1>) => Effect.Effect<InclusiveOr<L, R2>, ER, RR>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { Effect } from "effect"

const upper = InclusiveOr.mapRightEffect((right: string) => Effect.succeed(right.toUpperCase()))

assert.deepStrictEqual(
  Effect.runSync(upper(InclusiveOr.LeftAndRight({ left: 1, right: "a" }))),
  InclusiveOr.LeftAndRight({ left: 1, right: "A" })
)
```

Added in v0.0.0
