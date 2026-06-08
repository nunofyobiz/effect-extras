---
title: StructX.ts
nav_order: 21
parent: Modules
---

## StructX overview

Generic, framework-agnostic extensions to Effect's `Struct` module.

Added in v0.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [defined](#defined)
  - [pickSome](#picksome)
  - [some](#some)
  - [truthy](#truthy)
- [filtering](#filtering)
  - [filterDefined](#filterdefined)
- [models](#models)
  - [PartialTransform (type alias)](#partialtransform-type-alias)
- [refinements](#refinements)
  - [hasNotNullableProperty](#hasnotnullableproperty)

---

# constructors

## defined

Builds a singleton record `{ [name]: value }` when `value` is defined, or an
empty object `{}` when it is `undefined` — meant to be spread into an object
literal.

This is the canonical fix for `exactOptionalPropertyTypes: true` (which this
repo enables for Effect Schema). Under that flag, spreading
`{ key: maybeUndefined }` into an object whose key is `key?: T` is a type
error: the property must be _absent_, not present-but-`undefined`. Spreading
`...defined("key", maybeUndefined)` instead conditionally omits the property
altogether. Note that `null` and other falsy-but-defined values (`0`, `""`,
`false`) are kept — only `undefined` is dropped.

**Signature**

```ts
export declare const defined: <const K extends string, V>(
  name: K,
  value: V | undefined
) => Partial<Record<K, Exclude<V, undefined>>>
```

**Example**

```ts
import { StructX } from "@nunofyobiz/effect-extras"

// Defined value → singleton record
assert.deepStrictEqual(StructX.defined("name", "Ada"), { name: "Ada" })

// undefined → property omitted entirely
assert.deepStrictEqual(StructX.defined("name", undefined), {})

// Falsy-but-defined values are kept
assert.deepStrictEqual(StructX.defined("name", 0), { name: 0 })

// Typical use: spread to conditionally include an optional field
const maybeAge: number | undefined = undefined
assert.deepStrictEqual(
  { id: 1, ...StructX.defined("age", maybeAge) },
  {
    id: 1
  }
)
```

Added in v0.0.0

## pickSome

Looks up `key` in a record of `Option` values and returns a singleton record
when the value is `Some`, or `{}` when the key is absent or its value is
`None`.

Combines `Record.get` + `Option.flatten` + a singleton builder in one call —
ideal for spreading an optional field out of a lookup table into an object
literal under `exactOptionalPropertyTypes: true`. By default the output key
matches the lookup key; pass `renameKeyTo` to emit the value under a different
name.

**Signature**

```ts
export declare function pickSome<const K extends string, V>(
  record: Record<K, Option.Option<V>>,
  key: K
): Partial<Record<K, V>>
export declare function pickSome<const K1 extends string, V, const K2 extends string>(
  record: Record<K1, Option.Option<V>>,
  key: K1,
  renameKeyTo: K2
): Partial<Record<K2, V>>
```

**Example**

```ts
import { Option } from "effect"
import { StructX } from "@nunofyobiz/effect-extras"

const lookup = {
  a: Option.some(100),
  b: Option.none<number>()
}

// Some → singleton record under the same key
assert.deepStrictEqual(StructX.pickSome(lookup, "a"), { a: 100 })

// None → property omitted entirely
assert.deepStrictEqual(StructX.pickSome(lookup, "b"), {})

// Rename the output key
assert.deepStrictEqual(StructX.pickSome(lookup, "a", "count"), { count: 100 })
```

Added in v0.0.0

## some

Builds a singleton record `{ [name]: value }` when `value` is `Some`, or an
empty object `{}` when it is `None` — meant to be spread into an object
literal.

The `Option`-valued sibling of {@link defined}: where `defined` keys off
`undefined`, this keys off `Option` presence. Spread `...some("key", opt)` to
conditionally include a field only when the `Option` carries a value, which
stays correct under `exactOptionalPropertyTypes: true`.

**Signature**

```ts
export declare const some: <const K extends string, V>(name: K, value: Option.Option<V>) => Partial<Record<K, V>>
```

**Example**

```ts
import { Option } from "effect"
import { StructX } from "@nunofyobiz/effect-extras"

// Some → singleton record
assert.deepStrictEqual(StructX.some("name", Option.some("Ada")), {
  name: "Ada"
})

// None → property omitted entirely
assert.deepStrictEqual(StructX.some("name", Option.none()), {})
```

Added in v0.0.0

## truthy

Builds a singleton record `{ [name]: value }` when `value` is truthy, or an
empty object `{}` otherwise — meant to be spread into an object literal.

Stricter than {@link defined}: it drops not just `undefined` but every falsy
value (`null`, `false`, `0`, `""`, `NaN`), and narrows the value type
accordingly. Use it to spread a field only when it carries a meaningful,
non-falsy value.

**Signature**

```ts
export declare const truthy: <const K extends string, V>(
  name: K,
  value: V
) => Partial<Record<K, Exclude<NonNullable<V>, false | 0 | "">>>
```

**Example**

```ts
import { StructX } from "@nunofyobiz/effect-extras"

// Truthy value → singleton record
assert.deepStrictEqual(StructX.truthy("name", "Ada"), { name: "Ada" })

// Falsy values → property omitted entirely
assert.deepStrictEqual(StructX.truthy("name", ""), {})
assert.deepStrictEqual(StructX.truthy("name", 0), {})
assert.deepStrictEqual(StructX.truthy("name", false), {})
```

Added in v0.0.0

# filtering

## filterDefined

Removes every property whose value is `undefined` from `record`, narrowing
each remaining property type to exclude `undefined`.

The bulk counterpart of {@link defined}: instead of building one optional
field, it filters a whole object. Very useful for update/patch actions where
`undefined` means "leave this field unchanged" while every other value —
including `null`, `0`, `""`, `false`, and `Option.none()` — means "set the
field to exactly this".

**Signature**

```ts
export declare const filterDefined: <R extends Record<string, unknown>>(
  record: R
) => Partial<{ [P in keyof R]: Exclude<R[P], undefined> }>
```

**Example**

```ts
import { StructX } from "@nunofyobiz/effect-extras"

// Drops `b` (undefined) but keeps every other value, including null/0/false
assert.deepStrictEqual(StructX.filterDefined({ a: "x", b: undefined, c: 0, d: null, e: false }), {
  a: "x",
  c: 0,
  d: null,
  e: false
})
```

Added in v0.0.0

# models

## PartialTransform (type alias)

Describes the shape of a per-field transformation over an object `O`: a record
`T` whose values are functions taking the corresponding field of `O`.

Used to type the "evolve" pattern, where each provided key maps to a function
that receives that field's current value. Copied from Effect's internal
`Struct.evolve()` type, which is not exported — it would be better to use
theirs directly if it ever becomes public.

**Signature**

```ts
export type PartialTransform<O, T> = {
  [K in keyof T]: T[K] extends (a: O[K & keyof O]) => unknown ? T[K] : (a: O[K & keyof O]) => unknown
}
```

**Example**

```ts
import { StructX } from "@nunofyobiz/effect-extras"

type Transform = StructX.PartialTransform<{ a: number; b: string }, { a: (n: number) => boolean }>

const evolve: Transform = { a: (n) => n > 0 }

assert.deepStrictEqual(evolve.a(1), true)
```

Added in v0.0.0

# refinements

## hasNotNullableProperty

Returns `true` when `object` has `key` set to a non-nullish value, narrowing
that property to `NonNullable` on the type level.

A type guard combining `hasProperty` with a nullish check: after a successful
test, TypeScript treats `object[key]` as present and free of `null` /
`undefined`. Handy as a predicate passed to `Array.filter` to keep only the
elements whose `key` is populated.

**Signature**

```ts
export declare const hasNotNullableProperty: (<T, K extends keyof T>(
  key: K
) => (object: T) => object is T & Record<K, NonNullable<T[K]>>) &
  (<T, K extends keyof T>(object: T, key: K) => object is T & Record<K, NonNullable<T[K]>>)
```

**Example**

```ts
import { pipe } from "effect"
import { StructX } from "@nunofyobiz/effect-extras"

// data-first
assert.deepStrictEqual(StructX.hasNotNullableProperty({ id: "1" }, "id"), true)

// data-last (pipeable); a null value fails the guard
assert.deepStrictEqual(pipe({ id: null }, StructX.hasNotNullableProperty("id")), false)
```

Added in v0.0.0
