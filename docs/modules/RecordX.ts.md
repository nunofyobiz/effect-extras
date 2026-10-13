---
title: RecordX.ts
nav_order: 15
parent: Modules
---

## RecordX overview

Generic, framework-agnostic extensions to Effect's `Record` module.

Added in v0.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [combining](#combining)
  - [deepMerge](#deepmerge)
  - [deleteByPath](#deletebypath)
- [constructors](#constructors)
  - [collectBy](#collectby)
- [conversions](#conversions)
  - [keysAs](#keysas)
- [getters](#getters)
  - [takeFirstWhere](#takefirstwhere)
  - [takeLast](#takelast)
  - [takeLastWhere](#takelastwhere)
- [guards](#guards)
  - [isNonEmptyRecord](#isnonemptyrecord)
- [instances](#instances)
  - [deepMergeReducer](#deepmergereducer)
- [mapping](#mapping)
  - [modifyIfExists](#modifyifexists)
  - [upsert](#upsert)
- [transformations](#transformations)
  - [canonicalize](#canonicalize)
- [unsafe](#unsafe)
  - [getOrThrow](#getorthrow)
  - [getOrThrowWith](#getorthrowwith)

---

# combining

## deepMerge

Deep-merges two JSON values, with `b` winning on conflicts.

Plain objects (per `PredicateX.unsafeIsRecord`) are merged recursively,
key-by-key; every other shape — primitives, arrays, and impostors like
`Map`/`Date`/class instances — is replaced wholesale by `b`. If either side
isn't a plain object, `b` is returned as-is. Neither input is mutated. Reach
for it to layer partial JSON overrides on top of a base.

**Signature**

```ts
export declare const deepMerge: ((b: unknown) => (a: unknown) => unknown) & ((a: unknown, b: unknown) => unknown)
```

**Example**

```ts
import { RecordX } from "@nunofyobiz/effect-extras"
import { pipe } from "effect"

const defaults = { editor: { fontSize: 14, theme: "light" }, plugins: ["spellcheck"] }
const saved = { editor: { theme: "dark" }, plugins: ["formatter"] }

// Keep the default font size, override the theme, and replace the plugin list.
assert.deepStrictEqual(RecordX.deepMerge(defaults, saved), {
  editor: { fontSize: 14, theme: "dark" },
  plugins: ["formatter"]
})

// The pipeable form layers saved settings onto the same defaults.
assert.deepStrictEqual(pipe(defaults, RecordX.deepMerge(saved)), {
  editor: { fontSize: 14, theme: "dark" },
  plugins: ["formatter"]
})
```

Added in v0.0.0

## deleteByPath

Immutably deletes the value at a `path` from a JSON object, pruning any parent
objects left empty by the deletion.

Walks `path` from the root; when it resolves to an existing key, that key is
removed and every ancestor that becomes empty as a result is removed too.
Returns `Some(newObject)` when the path existed (so callers can tell something
changed), or `None` when it was absent or `object` isn't a plain object. The
input is never mutated. Use it to remove a nested setting and avoid leaving
empty settings sections behind. An empty path or traversal into a leaf or
array also returns `None`.

**Signature**

```ts
export declare const deleteByPath: ((path: readonly string[]) => (object: unknown) => Option.Option<unknown>) &
  ((object: unknown, path: readonly string[]) => Option.Option<unknown>)
```

**Example**

```ts
import { RecordX } from "@nunofyobiz/effect-extras"
import { Option, pipe } from "effect"

// Remove the only editor setting, so the empty editor section disappears too.
assert.deepStrictEqual(RecordX.deleteByPath({ editor: { theme: "dark" } }, ["editor", "theme"]), Option.some({}))

// A saved font size keeps the editor section present after removing the theme.
assert.deepStrictEqual(
  RecordX.deleteByPath({ editor: { theme: "dark", fontSize: 14 } }, ["editor", "theme"]),
  Option.some({ editor: { fontSize: 14 } })
)

// An unsaved setting has nothing to delete, including in the pipeable form.
assert.deepStrictEqual(pipe({ theme: "dark" }, RecordX.deleteByPath(["zoom"])), Option.none())
```

Added in v0.0.0

# constructors

## collectBy

Indexes an iterable of values into a `Record`, keying each value by the result
of `identify`.

Builds a lookup table from a collection: every value is stored under the key
`identify(value)`. When two values produce the same key the later one wins, so
the result holds the last value seen per key. Useful for turning a list of
records into a by-id map.

**Signature**

```ts
export declare const collectBy: (<K extends string | symbol, V>(
  identify: (v: V) => K
) => (values: Iterable<V>) => Record<K, V>) &
  (<K extends string | symbol, V>(values: Iterable<V>, identify: (v: V) => K) => Record<K, V>)
```

**Example**

```ts
import { pipe } from "effect"
import { RecordX } from "@nunofyobiz/effect-extras"

const products = [
  { id: "mug", price: 12 },
  { id: "notebook", price: 8 },
  { id: "mug", price: 10 } // The later price replaces the earlier mug entry.
]

// Build a product lookup using the latest entry for each id.
assert.deepStrictEqual(
  RecordX.collectBy(products, (product) => product.id),
  { mug: { id: "mug", price: 10 }, notebook: { id: "notebook", price: 8 } }
)

// The pipeable form builds the same lookup.
assert.deepStrictEqual(
  pipe(
    products,
    RecordX.collectBy((product) => product.id)
  ),
  { mug: { id: "mug", price: 10 }, notebook: { id: "notebook", price: 8 } }
)
```

Added in v0.0.0

# conversions

## keysAs

Re-types the keys of a `Record` to a different key type `K2` without touching
the runtime value.

A purely type-level reinterpretation: the record is returned as-is, but the
compiler now treats its keys as `K2` instead of the inferred `K1`. Use it at a
boundary where you know the keys conform to a narrower branded or literal key
type that TypeScript can't infer from the value alone. It performs no
validation — the caller is responsible for the keys actually matching `K2`.

**Signature**

```ts
export declare const keysAs: <K2 extends PropertyKey>() => <K1 extends PropertyKey, V>(
  record: Record<K1, V>
) => Record<K2, V>
```

**Example**

```ts
import { RecordX } from "@nunofyobiz/effect-extras"

type ProductId = "mug" | "notebook"

const prices: Record<string, number> = { mug: 12, notebook: 8 }
const byProduct = RecordX.keysAs<ProductId>()(prices)

// Treat the known product keys as ProductId; values and the reference stay the same.
assert.deepStrictEqual(byProduct, { mug: 12, notebook: 8 })
assert.strictEqual(byProduct, prices)
```

Added in v0.0.0

# getters

## takeFirstWhere

Returns the smallest value of `record` (per `order`) that matches
`predicate`, narrowed to the refined type `B`, or `Option.none()` if none
match.

Use it to find the lowest-ranked eligible value in a lookup table. Only own
enumerable string-keyed values participate; keys do not affect the ranking.

**Signature**

```ts
export declare const takeFirstWhere: (<K extends PropertyKey, A, B extends A>(
  predicate: Predicate.Refinement<A, B>,
  order: Order.Order<B>
) => (record: Record<K, A>) => Option.Option<B>) &
  (<K extends PropertyKey, A, B extends A>(
    record: Record<K, A>,
    predicate: Predicate.Refinement<A, B>,
    order: Order.Order<B>
  ) => Option.Option<B>)
```

**Example**

```ts
import { Option, Order, Predicate, pipe } from "effect"
import { RecordX } from "@nunofyobiz/effect-extras"

const prices: Record<string, number | null> = { mug: 12, notebook: 8, lamp: null }

// Find the cheapest listed product, ignoring the unavailable lamp.
assert.deepStrictEqual(RecordX.takeFirstWhere(prices, Predicate.isNumber, Order.Number), Option.some(8))

// The pipeable form finds the same listed price.
assert.deepStrictEqual(pipe(prices, RecordX.takeFirstWhere(Predicate.isNumber, Order.Number)), Option.some(8))
```

Added in v0.0.0

## takeLast

Returns the largest value of `record` according to `order`, wrapped in an
`Option` so empty records are handled safely.

Use it to find a maximum, such as the highest price in a product lookup.
Only own enumerable string-keyed values participate; an empty record yields
`Option.none()`. Reverse the order to select the minimum instead.

**Signature**

```ts
export declare const takeLast: (<K extends PropertyKey, A>(
  order: Order.Order<A>
) => (record: Record<K, A>) => Option.Option<A>) &
  (<K extends PropertyKey, A>(record: Record<K, A>, order: Order.Order<A>) => Option.Option<A>)
```

**Example**

```ts
import { Option, Order, pipe } from "effect"
import { RecordX } from "@nunofyobiz/effect-extras"

// Select the highest product price without needing to sort the lookup yourself.
assert.deepStrictEqual(RecordX.takeLast({ mug: 12, notebook: 8, lamp: 35 }, Order.Number), Option.some(35))

// An empty price lookup has no maximum.
assert.deepStrictEqual(pipe({}, RecordX.takeLast(Order.Number)), Option.none())
```

Added in v0.0.0

## takeLastWhere

Returns the largest value of `record` (per `order`) that matches `predicate`,
narrowed to the refined type `B`, or `Option.none()` if none match.

Use it to find the highest-ranked eligible value in a lookup table. Only own
enumerable string-keyed values participate; keys do not affect the ranking.

**Signature**

```ts
export declare const takeLastWhere: (<K extends PropertyKey, A, B extends A>(
  predicate: Predicate.Refinement<A, B>,
  order: Order.Order<B>
) => (record: Record<K, A>) => Option.Option<B>) &
  (<K extends PropertyKey, A, B extends A>(
    record: Record<K, A>,
    predicate: Predicate.Refinement<A, B>,
    order: Order.Order<B>
  ) => Option.Option<B>)
```

**Example**

```ts
import { Option, Order, Predicate, pipe } from "effect"
import { RecordX } from "@nunofyobiz/effect-extras"

const prices: Record<string, number | null> = { mug: 12, notebook: 8, lamp: null }

// Find the highest listed price, ignoring the unavailable lamp.
assert.deepStrictEqual(RecordX.takeLastWhere(prices, Predicate.isNumber, Order.Number), Option.some(12))

// No available products means there is no price to return.
assert.deepStrictEqual(pipe({ lamp: null }, RecordX.takeLastWhere(Predicate.isNumber, Order.Number)), Option.none())
```

Added in v0.0.0

# guards

## isNonEmptyRecord

Returns `true` when `record` has at least one own enumerable string key.
Use it to check whether a settings or lookup record contains entries before
processing it. Symbol keys and inherited entries do not count; the guard
preserves the existing record type rather than proving any particular key exists.

**Signature**

```ts
export declare const isNonEmptyRecord: <K extends PropertyKey, V>(record: Record<K, V>) => record is Record<K, V>
```

**Example**

```ts
import { RecordX } from "@nunofyobiz/effect-extras"

// A saved theme counts as a setting; an empty settings record has no entries.
assert.deepStrictEqual(RecordX.isNonEmptyRecord({ theme: "dark" }), true)
assert.deepStrictEqual(RecordX.isNonEmptyRecord({}), false)
```

Added in v0.0.0

# instances

## deepMergeReducer

Combines settings or other object-valued layers from left to right using
{@link deepMerge}, with later layers winning on conflicts.

`deepMergeReducer.combineAll(layers)` folds an iterable of object layers
left-to-right via {@link deepMerge}. Use it when defaults and multiple sets of
overrides need to become one object. Its `initialValue` is `{}`, an identity
for object-valued layers, but not for every `unknown` value. An empty list
yields `{}`, and a single object layer retains its contents.

**Signature**

```ts
export declare const deepMergeReducer: Reducer.Reducer<unknown>
```

**Example**

```ts
import { RecordX } from "@nunofyobiz/effect-extras"

// Saved preferences override defaults; workspace settings override both.
assert.deepStrictEqual(
  RecordX.deepMergeReducer.combineAll([
    { editor: { fontSize: 14, theme: "light" } },
    { editor: { theme: "dark" }, autosave: true },
    { autosave: false }
  ]),
  { editor: { fontSize: 14, theme: "dark" }, autosave: false }
)

// No settings layers produce an empty settings object.
assert.deepStrictEqual(RecordX.deepMergeReducer.combineAll([]), {})
```

Added in v0.0.0

# mapping

## modifyIfExists

Modifies the value at `key` in `self` with `f`, leaving the record unchanged
if the key doesn't exist.

`Record.modify` returns `Option<Record>` — `None` when the key is absent.
This helper provides the common "do nothing if absent" semantics. The
modifier is never invoked when the key is missing.

**Signature**

```ts
export declare const modifyIfExists: {
  <K extends string, A>(key: NoInfer<K>, f: (a: A) => A): (self: Record<K, A>) => Record<K, A>
  <K extends string, A>(self: Record<K, A>, key: NoInfer<K>, f: (a: A) => A): Record<K, A>
}
```

**Example**

```ts
import { pipe } from "effect"
import { RecordX } from "@nunofyobiz/effect-extras"

const settings: Record<string, number> = { fontSize: 14, lineHeight: 20 }

// Increase the saved font size without changing the other settings.
assert.deepStrictEqual(
  RecordX.modifyIfExists(settings, "fontSize", (size) => size + 2),
  { fontSize: 16, lineHeight: 20 }
)

// An unsaved setting stays absent, and its modifier is never called.
assert.deepStrictEqual(
  RecordX.modifyIfExists(settings, "zoom", (zoom) => zoom + 1),
  settings
)

// The pipeable form makes the same font-size adjustment.
assert.deepStrictEqual(
  pipe(
    settings,
    RecordX.modifyIfExists("fontSize", (size) => size + 2)
  ),
  { fontSize: 16, lineHeight: 20 }
)
```

Added in v0.0.0

## upsert

Inserts or updates the value at `key`, deriving the new value from the current
one via `upsert`.

The `upsert` function receives an `Option` of the existing value —
`Option.some(value)` when the key is present, `Option.none()` when it's
absent — and returns the value to store. This unifies "insert if missing" and
"update if present" into a single pass, with `Option.match` as the natural way
to handle both cases.

**Signature**

```ts
export declare const upsert: (<K extends string | symbol, V>(
  key: K,
  upsert: (existingValue: Option.Option<V>) => V
) => (record: Record<K, V>) => Record<K, V>) &
  (<K extends string | symbol, V>(
    record: Record<K, V>,
    key: K,
    upsert: (existingValue: Option.Option<V>) => V
  ) => Record<K, V>)
```

**Example**

```ts
import { Option, pipe } from "effect"
import { RecordX } from "@nunofyobiz/effect-extras"

const bump = Option.match({
  onNone: () => 1,
  onSome: (n: number) => n + 1
})

// Count another view of a product already in the lookup.
assert.deepStrictEqual(RecordX.upsert({ mug: 1 }, "mug", bump), { mug: 2 })

// The first view of an unlisted product starts its count at one.
const views: Record<string, number> = { mug: 1 }
assert.deepStrictEqual(pipe(views, RecordX.upsert("notebook", bump)), {
  mug: 1,
  notebook: 1
})
```

Added in v0.0.0

# transformations

## canonicalize

Canonicalizes a JSON value by recursively sorting object keys; arrays keep
their order.

Use it for stable serialization or comparison of JSON values that differ only
in object key order. Plain objects (per `PredicateX.unsafeIsRecord`) and arrays
become fresh containers with recursively canonicalized values; other leaves
pass through unchanged. Only own enumerable string keys are retained. Keys
sort ascending, subject to JavaScript's numeric ordering of integer keys.
Array order is preserved and the input is never mutated.

**Signature**

```ts
export declare const canonicalize: (value: unknown) => unknown
```

**Example**

```ts
import { RecordX } from "@nunofyobiz/effect-extras"

const settings = { theme: "dark", editor: { tabSize: 2, fontSize: 14 } }

// Different insertion orders now serialize to the same settings string.
assert.deepStrictEqual(
  JSON.stringify(RecordX.canonicalize(settings)),
  JSON.stringify({ editor: { fontSize: 14, tabSize: 2 }, theme: "dark" })
)

// Plugin priority stays in array order, and a theme string passes through.
assert.deepStrictEqual(RecordX.canonicalize(["formatter", "spellcheck"]), ["formatter", "spellcheck"])
assert.deepStrictEqual(RecordX.canonicalize("dark"), "dark")
```

Added in v0.0.0

# unsafe

## getOrThrow

Returns the value at `key` in `record`, throwing an `Error` if the key is
absent.

Only own keys count, including symbols and keys with `undefined` values.
The throwing counterpart to `Record.get` (which returns an
`Option`). The thrown error names the missing key and lists the record's
existing keys to aid debugging. Reach for {@link getOrThrowWith} when you need
a custom error; prefer `Record.get` whenever absence is a real possibility.

**Signature**

```ts
export declare const getOrThrow: (<K extends string | symbol>(key: K) => <V>(record: Record<K, V>) => V) &
  (<K extends string | symbol, V>(record: Record<K, V>, key: K) => V)
```

**Example**

```ts
import { pipe } from "effect"
import { RecordX } from "@nunofyobiz/effect-extras"

const prices: Record<string, number> = { mug: 12, notebook: 8 }

// Read a price when the product is required to exist.
assert.deepStrictEqual(RecordX.getOrThrow(prices, "mug"), 12)

// The pipeable form retrieves the same price.
assert.deepStrictEqual(pipe(prices, RecordX.getOrThrow("mug")), 12)

// An unlisted product throws instead of silently returning undefined.
assert.throws(() => RecordX.getOrThrow(prices, "lamp"))
```

Added in v0.0.0

## getOrThrowWith

Returns the value at `key` in `record`, throwing the result of `onNone(key)`
if the key is absent.

Like {@link getOrThrow}, but lets the caller supply the thrown value (an
`Error`, a string, or any custom failure) computed from the missing key. Use
it when the default "key not found" message isn't descriptive enough for the
call site.

**Signature**

```ts
export declare const getOrThrowWith: (<K extends string | symbol>(
  key: K,
  onNone: (key: K) => unknown
) => <V>(record: Record<K, V>) => V) &
  (<K extends string | symbol, V>(record: Record<K, V>, key: K, onNone: (key: K) => unknown) => V)
```

**Example**

```ts
import { pipe } from "effect"
import { RecordX } from "@nunofyobiz/effect-extras"

const prices: Record<string, number> = { mug: 12 }
const onNone = (key: string) => new Error(`No price listed for ${key}`)

// A listed price is returned without creating a failure.
assert.deepStrictEqual(RecordX.getOrThrowWith(prices, "mug", onNone), 12)

// The pipeable form reads the same price.
assert.deepStrictEqual(pipe(prices, RecordX.getOrThrowWith("mug", onNone)), 12)

// A missing product throws the caller's descriptive error.
assert.throws(() => RecordX.getOrThrowWith(prices, "lamp", onNone), /No price listed for lamp/)
```

Added in v0.0.0
