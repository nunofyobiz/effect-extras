---
title: SchemaX.ts
nav_order: 17
parent: Modules
---

## SchemaX overview

Generic, framework-agnostic extensions to Effect's `Schema` module.

Added in v0.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [combinators](#combinators)
  - [nonNegativeBigInt](#nonnegativebigint)
  - [omit](#omit)
  - [partial](#partial)
  - [pick](#pick)
  - [pickPartial](#pickpartial)
- [constructors](#constructors)
  - [IntFromString](#intfromstring)
  - [TrimmedNonEmptyString](#trimmednonemptystring)
  - [URLSafeFilePath](#urlsafefilepath)
- [models](#models)
  - [MakeIn (type alias)](#makein-type-alias)

---

# combinators

## nonNegativeBigInt

Transforms a `bigint` `Schema` so its value is clamped to be non-negative,
mapping any value below `0n` up to `0n` on both decode and encode.

Unlike a refinement that _rejects_ negative input, this _coerces_ it: a
negative `bigint` decodes to `0n` rather than failing. Apply it to a `bigint`
schema whenever negative magnitudes are meaningless and should be floored at
zero rather than treated as errors.

**Signature**

```ts
export declare const nonNegativeBigInt: <S extends Schema.Schema<bigint>>(
  schema: S
) => Schema.decodeTo<Schema.toType<S>, S, never, never>
```

**Example**

```ts
import { Effect, Schema } from "effect"
import { SchemaX } from "@nunofyobiz/effect-extras"

const NonNegative = SchemaX.nonNegativeBigInt(Schema.BigInt)

// Negative values are clamped up to 0n
assert.deepStrictEqual(Effect.runSync(Schema.decodeEffect(NonNegative)(-5n)), 0n)

// Non-negative values pass through unchanged
assert.deepStrictEqual(Effect.runSync(Schema.decodeEffect(NonNegative)(7n)), 7n)
```

Added in v0.0.0

## omit

Returns a new `Schema.Struct` with the named `keys` of `schema` removed.

The complement of {@link pick}, restoring the v3 ergonomics of
`mySchema.omit("a")` that v4 dropped from `Schema.Struct` instances. Every
surviving field keeps its original schema, including any refinements.

**Signature**

```ts
export declare const omit: <
  const Fields extends Schema.Struct.Fields,
  const Keys extends readonly (keyof Fields & string)[]
>(
  schema: Schema.Struct<Fields>,
  ...keys: Keys
) => Schema.Struct<Omit<Fields, Keys[number]>>
```

**Example**

```ts
import { Effect, Schema } from "effect"
import { SchemaX } from "@nunofyobiz/effect-extras"

const Source = Schema.Struct({
  a: Schema.Number,
  b: Schema.String,
  c: Schema.Boolean
})

const Omitted = SchemaX.omit(Source, "c")

const decoded = Effect.runSync(Schema.decodeEffect(Omitted)({ a: 1, b: "hi" }))
assert.deepStrictEqual(decoded, { a: 1, b: "hi" })
```

Added in v0.0.0

## partial

Returns a new `Schema.Struct` in which every field of `schema` is made
optional.

Restores the v3 `Schema.partial(mySchema)` behaviour that v4 removed, by
wrapping each field in `Schema.optional`. A decoded value may therefore omit
any field; fields that _are_ present still have to satisfy their original
schema, refinements included.

**Signature**

```ts
export declare const partial: <Fields extends Schema.Struct.Fields>(
  schema: Schema.Struct<Fields>
) => Schema.Struct<{ [K in keyof Fields]: Schema.optional<Fields[K]> }>
```

**Example**

```ts
import { Effect, Schema } from "effect"
import { SchemaX } from "@nunofyobiz/effect-extras"

const Source = Schema.Struct({ a: Schema.Number, b: Schema.String })
const Partial = SchemaX.partial(Source)

// All fields may be absent
assert.deepStrictEqual(Effect.runSync(Schema.decodeEffect(Partial)({})), {})

// A present subset still decodes
assert.deepStrictEqual(Effect.runSync(Schema.decodeEffect(Partial)({ a: 1 })), { a: 1 })
```

Added in v0.0.0

## pick

Returns a new `Schema.Struct` containing only the named `keys` of `schema`.

Restores the v3 ergonomics of `mySchema.pick("a", "b")` — v4 removed the
`.pick(...)` method from `Schema.Struct` instances, so this rebuilds it on top
of v4's `mapFields` primitive. Each picked field keeps its original schema,
including any refinements.

**Signature**

```ts
export declare const pick: <
  const Fields extends Schema.Struct.Fields,
  const Keys extends readonly (keyof Fields & string)[]
>(
  schema: Schema.Struct<Fields>,
  ...keys: Keys
) => Schema.Struct<Pick<Fields, Keys[number]>>
```

**Example**

```ts
import { Effect, Schema } from "effect"
import { SchemaX } from "@nunofyobiz/effect-extras"

const Source = Schema.Struct({
  a: Schema.Number,
  b: Schema.String,
  c: Schema.Boolean
})

const Picked = SchemaX.pick(Source, "a", "b")

const decoded = Effect.runSync(Schema.decodeEffect(Picked)({ a: 1, b: "hi" }))
assert.deepStrictEqual(decoded, { a: 1, b: "hi" })
```

Added in v0.0.0

## pickPartial

Returns a new `Schema.Struct` containing only the named `keys` of `schema`,
with every picked field made optional.

Equivalent to `partial(pick(schema, ...keys))`, but reads more directly for
the common "partial update over a subset of fields" pattern: select the
mutable fields of an entity, then allow any of them to be omitted in the
update payload. Composes {@link pick} and {@link partial} in one call.

**Signature**

```ts
export declare const pickPartial: <
  const Fields extends Schema.Struct.Fields,
  const Keys extends readonly (keyof Fields & string)[]
>(
  schema: Schema.Struct<Fields>,
  ...keys: Keys
) => Schema.Struct<{ [K in Keys[number]]: Schema.optional<Fields[K]> }>
```

**Example**

```ts
import { Effect, Schema } from "effect"
import { SchemaX } from "@nunofyobiz/effect-extras"

const Source = Schema.Struct({
  a: Schema.Number,
  b: Schema.String,
  c: Schema.Boolean
})

const Update = SchemaX.pickPartial(Source, "a", "b")

// Only picked fields are known, and each may be omitted
assert.deepStrictEqual(Effect.runSync(Schema.decodeEffect(Update)({})), {})
assert.deepStrictEqual(Effect.runSync(Schema.decodeEffect(Update)({ a: 1 })), { a: 1 })
```

Added in v0.0.0

# constructors

## IntFromString

A `Schema` that decodes a numeric string into a JS `number`, **failing loudly**
when the value isn't a safe integer instead of silently rounding it.

`Schema.NumberFromString` has no range guard, so a string past
`Number.MAX_SAFE_INTEGER` — e.g. a Postgres `int8` column, which node-postgres
returns as a string — decodes to a silently-rounded number
(`Number("9223372036854775807")` is `9223372036854776000`). This codec adds
`Schema.isInt` (which is `Number.isSafeInteger`), so any value that can't be
represented exactly fails decoding rather than corrupting data. On encode a
`number` is written back as a decimal string.

Being an integer guard, it also rejects fractional strings (`"3.14"`). Note
the failure names the _already-parsed_ number (the rounded value), since the
check runs after `NumberFromString` has produced the JS `number` — by which
point the original digits are gone. The loud failure still flags the offending
input.

The parsing step is `NumberFromString`'s, so its lenient `Number(...)` coercion
carries through: blank input decodes to zero (`""` and `"   "` → `0`), and
exponential / hex notation is accepted (`"1e3"` → `1000`, `"0x10"` → `16`).
The guard protects against unsafe-integer _overflow_, not against
non-canonical numeric strings — a caller that needs strict input (reject blanks
or only accept plain decimal digits) should compose an upstream check.

**Signature**

```ts
export declare const IntFromString: Schema.NumberFromString
```

**Example**

```ts
import { Effect, Result, Schema } from "effect"
import { SchemaX } from "@nunofyobiz/effect-extras"

// A safe integer round-trips
const decoded = Effect.runSync(Schema.decodeEffect(SchemaX.IntFromString)("42"))
assert.deepStrictEqual(decoded, 42)

const encoded = Effect.runSync(Schema.encodeEffect(SchemaX.IntFromString)(42))
assert.deepStrictEqual(encoded, "42")

// A value past Number.MAX_SAFE_INTEGER fails instead of silently rounding
const result = Effect.runSync(Effect.result(Schema.decodeEffect(SchemaX.IntFromString)("9223372036854775807")))
assert.deepStrictEqual(Result.isFailure(result), true)
```

Added in v0.0.0

## TrimmedNonEmptyString

A `Schema` for a non-empty string that is trimmed on both decode and encode.

Leading and trailing whitespace is stripped, and the resulting value must be
non-empty — so a whitespace-only input (e.g. `"   "`) fails the
`NonEmptyString` refinement after trimming. Use it wherever user-supplied text
should be normalized and guaranteed to carry content.

**Signature**

```ts
export declare const TrimmedNonEmptyString: Schema.decodeTo<
  Schema.toType<Schema.NonEmptyString>,
  Schema.NonEmptyString,
  never,
  never
>
```

**Example**

```ts
import { Effect, Schema } from "effect"
import { SchemaX } from "@nunofyobiz/effect-extras"

const decoded = Effect.runSync(Schema.decodeEffect(SchemaX.TrimmedNonEmptyString)("  hello  "))
assert.deepStrictEqual(decoded, "hello")
```

Added in v0.0.0

## URLSafeFilePath

A `Schema` for a URL-safe file path built on top of {@link
TrimmedNonEmptyString}.

On decode the path is `decodeURIComponent`-ed (percent-escapes are expanded);
on encode it is `encodeURIComponent`-ed back into its URL-safe form. The
underlying value is also trimmed and required to be non-empty. Use it at the
boundary between stored/transmitted encoded paths and the decoded paths your
code works with.

**Signature**

```ts
export declare const URLSafeFilePath: Schema.decodeTo<
  Schema.toType<Schema.decodeTo<Schema.toType<Schema.NonEmptyString>, Schema.NonEmptyString, never, never>>,
  Schema.decodeTo<Schema.toType<Schema.NonEmptyString>, Schema.NonEmptyString, never, never>,
  never,
  never
>
```

**Example**

```ts
import { Effect, Schema } from "effect"
import { SchemaX } from "@nunofyobiz/effect-extras"

// Decoding expands percent-escapes
const decoded = Effect.runSync(Schema.decodeEffect(SchemaX.URLSafeFilePath)("a%2Fb.txt"))
assert.deepStrictEqual(decoded, "a/b.txt")

// Encoding produces the URL-safe form
const encoded = Effect.runSync(Schema.encodeEffect(SchemaX.URLSafeFilePath)("a/b.txt"))
assert.deepStrictEqual(encoded, "a%2Fb.txt")
```

Added in v0.0.0

# models

## MakeIn (type alias)

Extracts the "constructor input" type of a `Schema` — what `.make({...})`
accepts.

Differs from `S["Type"]` (the decoded type) in that fields carrying
constructor defaults (e.g. an `Overrideable` timestamp) are _optional_ in
`MakeIn` but _required_ in `Type`. Use it in signatures that accept a value to
construct, so callers can pass a plain object literal without supplying the
defaulted, override-branded fields.

**Signature**

```ts
export type MakeIn<S extends { readonly "~type.make.in": unknown }> = S["~type.make.in"]
```

**Example**

```ts
import { Schema } from "effect"
import { SchemaX } from "@nunofyobiz/effect-extras"

const Person = Schema.Struct({ name: Schema.String, age: Schema.Number })

const input: SchemaX.MakeIn<typeof Person> = { name: "Ada", age: 36 }

assert.deepStrictEqual(input, { name: "Ada", age: 36 })
```

Added in v0.0.0
