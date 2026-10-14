---
title: StructX.ts
nav_order: 20
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
assert.deepStrictEqual(StructX.defined("notificationLimit", 0), { notificationLimit: 0 })

// Typical use: spread to conditionally include an optional field
const nickname: string | undefined = undefined
const profile: { displayName: string; nickname?: string; notifications?: boolean } = {
  displayName: "Ada",
  ...StructX.defined("nickname", nickname),
  ...StructX.defined("notifications", false)
}
// The unset nickname is absent, while the explicit false setting survives.
assert.deepStrictEqual(profile, { displayName: "Ada", notifications: false })
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
name. As with {@link some}, nullish and falsy `Some` payloads are preserved.

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
  displayName: Option.some("Ada"),
  nickname: Option.none<string>()
}

// Some → singleton record under the same key
assert.deepStrictEqual(StructX.pickSome(lookup, "displayName"), { displayName: "Ada" })

// None → property omitted entirely
assert.deepStrictEqual(StructX.pickSome(lookup, "nickname"), {})

// Use the saved display name as the profile's public name.
assert.deepStrictEqual(StructX.pickSome(lookup, "displayName", "name"), { name: "Ada" })

// Some(undefined) keeps an own nickname property rather than omitting it.
const profile = StructX.pickSome({ nickname: Option.some(undefined) }, "nickname")
assert.deepStrictEqual(profile, { nickname: undefined })
assert.strictEqual(Object.hasOwn(profile, "nickname"), true)
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
A `Some` payload is preserved even when it is nullish or falsy:
`Some(undefined)` creates an own property containing `undefined`.

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

// An explicitly supplied nickname is present even when its payload is undefined.
const profile = StructX.some("nickname", Option.some(undefined))
assert.deepStrictEqual(profile, { nickname: undefined })
assert.strictEqual(Object.hasOwn(profile, "nickname"), true)
```

Added in v0.0.0

## truthy

Builds a singleton record `{ [name]: value }` when `value` is truthy, or an
empty object `{}` otherwise — meant to be spread into an object literal.

Stricter than {@link defined}: it drops not just `undefined` but every falsy
value (`null`, `false`, `0`, `-0`, `0n`, `""`, `NaN`), and narrows the value type
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

// Include a populated profile name, but omit a blank nickname.
assert.deepStrictEqual(StructX.truthy("name", "Ada"), { name: "Ada" })

// Falsy values → property omitted entirely
assert.deepStrictEqual(StructX.truthy("nickname", ""), {})
// Zero and false also disappear; use defined to preserve those settings.
assert.deepStrictEqual(StructX.truthy("notificationLimit", 0), {})
assert.deepStrictEqual(StructX.truthy("notifications", false), {})
assert.deepStrictEqual(StructX.defined("notifications", false), { notifications: false })
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
Only own enumerable string properties are considered; inherited,
non-enumerable, and symbol properties are excluded.

**Signature**

```ts
export declare const filterDefined: <R extends Record<string, unknown>>(
  record: R
) => Partial<{ [P in keyof R]: Exclude<R[P], undefined> }>
```

**Example**

```ts
import { StructX } from "@nunofyobiz/effect-extras"

// Leave the untouched theme out of the update; explicitly clear the avatar
// and keep the disabled notifications and zero notification limit.
assert.deepStrictEqual(
  StructX.filterDefined({ theme: undefined, avatar: null, notifications: false, notificationLimit: 0 }),
  { avatar: null, notifications: false, notificationLimit: 0 }
)
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
import { Struct } from "effect"
import { StructX } from "@nunofyobiz/effect-extras"

type Profile = { displayName: string; notifications: boolean }
type Transform = StructX.PartialTransform<Profile, { displayName: (name: string) => string }>
const transform: Transform = { displayName: (name) => name.trim() }
const profile: Profile = { displayName: " Ada ", notifications: false }

// Trim the display name while leaving the other profile fields unchanged.
assert.deepStrictEqual(Struct.evolve(profile, transform), {
  displayName: "Ada",
  notifications: false
})
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
import { Array, pipe } from "effect"
import { StructX } from "@nunofyobiz/effect-extras"

type Profile = { displayName: string | null | undefined }
const profiles: Profile[] = [{ displayName: "Ada" }, { displayName: null }, { displayName: undefined }]
// Keep profiles with a name; the narrowed string is safe to uppercase.
const names = pipe(
  profiles,
  Array.filter(StructX.hasNotNullableProperty<Profile, "displayName">("displayName")),
  Array.map((profile) => profile.displayName.toUpperCase())
)
assert.deepStrictEqual(names, ["ADA"])
assert.strictEqual(StructX.hasNotNullableProperty(profiles[0], "displayName"), true)
```

Added in v0.0.0
