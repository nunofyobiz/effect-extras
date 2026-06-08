---
title: RecordX.ts
nav_order: 16
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

// data-first — nested objects merge, b wins on leaf conflicts
assert.deepStrictEqual(RecordX.deepMerge({ a: { x: 1 }, b: 2 }, { a: { y: 3 }, c: 4 }), {
  a: { x: 1, y: 3 },
  b: 2,
  c: 4
})

// arrays are replaced wholesale, not concatenated
assert.deepStrictEqual(RecordX.deepMerge({ a: [1, 2] }, { a: [3] }), { a: [3] })

// data-last (pipeable) — merges the override onto the piped base
assert.deepStrictEqual(pipe({ a: 1 }, RecordX.deepMerge({ b: 2 })), {
  a: 1,
  b: 2
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
input is never mutated.

**Signature**

```ts
export declare const deleteByPath: ((path: readonly string[]) => (object: unknown) => Option.Option<unknown>) &
  ((object: unknown, path: readonly string[]) => Option.Option<unknown>)
```

**Example**

```ts
import { RecordX } from "@nunofyobiz/effect-extras"
import { Option, pipe } from "effect"

// deletes the leaf and prunes the now-empty parent
assert.deepStrictEqual(RecordX.deleteByPath({ a: { b: 1 } }, ["a", "b"]), Option.some({}))

// a sibling key keeps the parent alive
assert.deepStrictEqual(RecordX.deleteByPath({ a: { b: 1, c: 2 } }, ["a", "b"]), Option.some({ a: { c: 2 } }))

// absent path → None; data-last (pipeable) form
assert.deepStrictEqual(pipe({ a: 1 }, RecordX.deleteByPath(["b"])), Option.none())
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

const items = [
  { id: "a", n: 1 },
  { id: "b", n: 2 },
  { id: "a", n: 3 } // wins over the earlier "a"
]

// data-first
assert.deepStrictEqual(
  RecordX.collectBy(items, (item) => item.id),
  { a: { id: "a", n: 3 }, b: { id: "b", n: 2 } }
)

// data-last (pipeable)
assert.deepStrictEqual(
  pipe(
    items,
    RecordX.collectBy((item) => item.id)
  ),
  { a: { id: "a", n: 3 }, b: { id: "b", n: 2 } }
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

type UserId = string & { readonly _brand: "UserId" }

const byId: Record<string, number> = { u1: 10, u2: 20 }
const branded = RecordX.keysAs<UserId>()(byId)

// Same runtime value, keys now seen as `UserId`
assert.deepStrictEqual(branded, { u1: 10, u2: 20 })
```

Added in v0.0.0

# getters

## takeFirstWhere

Returns the smallest value of `record` (per `order`) that matches
`predicate`, narrowed to the refined type `B`, or `Option.none()` if none
match.

The `Record` counterpart of `ArrayX.takeFirstWhere`: it considers only the
record's values, keeps those satisfying `predicate`, and returns the minimum
of them by `order`. Keys are ignored entirely.

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
import { Option, Order, pipe } from "effect"
import { RecordX } from "@nunofyobiz/effect-extras"

const isEven = (n: number): n is number => n % 2 === 0

// data-first
assert.deepStrictEqual(RecordX.takeFirstWhere({ a: 3, b: 4, c: 2 }, isEven, Order.Number), Option.some(2))

// data-last (pipeable); no even values yields None
assert.deepStrictEqual(pipe({ a: 1, b: 3 }, RecordX.takeFirstWhere(isEven, Order.Number)), Option.none())
```

Added in v0.0.0

## takeLast

Returns the largest value of `record` according to `order`, wrapped in an
`Option` so empty records are handled safely.

Sorts the record's values by `order` and takes the last one, yielding
`Option.none()` when the record is empty and `Option.some(max)` otherwise.
Keys are ignored — only values participate in the ordering.

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

// data-first
assert.deepStrictEqual(RecordX.takeLast({ a: 3, b: 5, c: 1 }, Order.Number), Option.some(5))

// data-last (pipeable); empty record yields None
assert.deepStrictEqual(pipe({}, RecordX.takeLast(Order.Number)), Option.none())
```

Added in v0.0.0

## takeLastWhere

Returns the largest value of `record` (per `order`) that matches `predicate`,
narrowed to the refined type `B`, or `Option.none()` if none match.

The mirror of {@link takeFirstWhere}: it considers only the record's values,
keeps those satisfying `predicate`, and returns the maximum of them by
`order`. Keys are ignored entirely.

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
import { Option, Order, pipe } from "effect"
import { RecordX } from "@nunofyobiz/effect-extras"

const isEven = (n: number): n is number => n % 2 === 0

// data-first
assert.deepStrictEqual(RecordX.takeLastWhere({ a: 3, b: 4, c: 2 }, isEven, Order.Number), Option.some(4))

// data-last (pipeable); no even values yields None
assert.deepStrictEqual(pipe({ a: 1, b: 3 }, RecordX.takeLastWhere(isEven, Order.Number)), Option.none())
```

Added in v0.0.0

# guards

## isNonEmptyRecord

Returns `true` when `record` has at least one entry, narrowing it to a
known-non-empty `Record`.

The negation of `Record.isEmptyRecord`, packaged as a type guard so it reads
naturally at call sites that want to branch on "this record has something in
it" without a manual `!Record.isEmptyRecord(...)`.

**Signature**

```ts
export declare const isNonEmptyRecord: <K extends PropertyKey, V>(record: Record<K, V>) => record is Record<K, V>
```

**Example**

```ts
import { RecordX } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(RecordX.isNonEmptyRecord({ a: 1 }), true)
assert.deepStrictEqual(RecordX.isNonEmptyRecord({}), false)
```

Added in v0.0.0

# instances

## deepMergeReducer

{@link deepMerge} as a `Reducer` (monoid) with identity `{}`.

`deepMergeReducer.combineAll(layers)` folds an iterable of object layers
left-to-right via {@link deepMerge} — the universal "merge N JSON objects into
one" fold, replacing a hand-rolled `Array.reduce(layers, {}, deepMerge)`. The
`{}` identity is exact for the object-valued layers these folds carry: an empty
list yields `{}`, and a single layer is returned unchanged.

**Signature**

```ts
export declare const deepMergeReducer: Reducer.Reducer<unknown>
```

**Example**

```ts
import { RecordX } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(RecordX.deepMergeReducer.combineAll([{ a: { x: 1 } }, { a: { y: 2 }, b: 3 }, { b: 4 }]), {
  a: { x: 1, y: 2 },
  b: 4
})

assert.deepStrictEqual(RecordX.deepMergeReducer.combineAll([]), {})
```

Added in v0.0.0

# mapping

## modifyIfExists

Modifies the value at `key` in `self` with `f`, leaving the record unchanged
if the key doesn't exist.

v4's `Record.modify` returns `Option<Record>` — `None` when the key is
absent. This helper picks the "do nothing if absent" semantics that v3's
`Record.modify` had implicitly, and that most call sites assume. The modifier
is never invoked when the key is missing.

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

// data-first
assert.deepStrictEqual(
  RecordX.modifyIfExists({ a: 1, b: 2 }, "b", (n) => n * 10),
  { a: 1, b: 20 }
)

// a missing key leaves the record untouched
const counts: Record<string, number> = { a: 1, b: 2 }
assert.deepStrictEqual(
  RecordX.modifyIfExists(counts, "missing", (n) => n + 1),
  { a: 1, b: 2 }
)

// data-last (pipeable)
assert.deepStrictEqual(
  pipe(
    { a: 1, b: 2 },
    RecordX.modifyIfExists("a", (n) => n * 10)
  ),
  { a: 10, b: 2 }
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

// data-first: updates an existing entry
assert.deepStrictEqual(RecordX.upsert({ a: 1 }, "a", bump), { a: 2 })

// data-last (pipeable): inserts a missing entry
const counts: Record<string, number> = { a: 1 }
assert.deepStrictEqual(pipe(counts, RecordX.upsert("b", bump)), {
  a: 1,
  b: 1
})
```

Added in v0.0.0

# transformations

## canonicalize

Canonicalizes a JSON value by recursively sorting object keys; arrays keep
their order.

Two structurally-equal values that differ only in key order canonicalize to
the same shape, so `JSON.stringify(canonicalize(x))` is a stable structural
key for comparison, deduping, or hashing. Plain objects (per
`PredicateX.unsafeIsRecord`) have their keys sorted ascending and their values
canonicalized recursively; arrays are canonicalized element-wise in place;
everything else passes through unchanged.

**Signature**

```ts
export declare const canonicalize: (value: unknown) => unknown
```

**Example**

```ts
import { RecordX } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(
  JSON.stringify(RecordX.canonicalize({ b: 1, a: { d: 1, c: 2 } })),
  JSON.stringify({ a: { c: 2, d: 1 }, b: 1 })
)

// arrays keep their order; primitives pass through
assert.deepStrictEqual(RecordX.canonicalize([3, 1, 2]), [3, 1, 2])
assert.deepStrictEqual(RecordX.canonicalize("x"), "x")
```

Added in v0.0.0

# unsafe

## getOrThrow

Returns the value at `key` in `record`, throwing an `Error` if the key is
absent.

The unsafe, get-or-explode counterpart to `Record.get` (which returns an
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

const record: Record<string, number> = { a: 1, b: 2 }

// data-first
assert.deepStrictEqual(RecordX.getOrThrow(record, "a"), 1)

// data-last (pipeable)
assert.deepStrictEqual(pipe(record, RecordX.getOrThrow("b")), 2)

// missing key throws
assert.throws(() => RecordX.getOrThrow(record, "missing"))
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

const record: Record<string, number> = { a: 1 }
const onNone = (key: string) => new Error(`no ${key}`)

// data-first
assert.deepStrictEqual(RecordX.getOrThrowWith(record, "a", onNone), 1)

// data-last (pipeable)
assert.deepStrictEqual(pipe(record, RecordX.getOrThrowWith("a", onNone)), 1)

// missing key throws the custom error
assert.throws(() => RecordX.getOrThrowWith(record, "missing", onNone))
```

Added in v0.0.0
