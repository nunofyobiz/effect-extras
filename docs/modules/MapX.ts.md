---
title: MapX.ts
nav_order: 8
parent: Modules
---

## MapX overview

Generic, framework-agnostic extensions for working with `Map`.

Added in v0.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [combinators](#combinators)
  - [getOrElseSetGet](#getorelsesetget)
- [constructors](#constructors)
  - [firstIndexes](#firstindexes)
  - [indexes](#indexes)
  - [indices](#indices)
  - [lastIndexes](#lastindexes)

---

# combinators

## getOrElseSetGet

Like `Map.prototype.get`, but when the key is absent it stores the computed
fallback at that key and returns it. Mutates the input map in place.

Use it for memoization-style caches where a miss should both populate the map
and yield the value in one step. The fallback runs only on a miss, at most once,
and the returned value is the one stored in the map. Throws when a value already
stored in the map is nullish; a nullish fallback result on a miss is stored and
returned. Supports both data-first and data-last (pipeable) call styles.

**Signature**

```ts
export declare const getOrElseSetGet: (<K, V>(key: K, fallbackIfNotFound: () => V) => (map: Map<K, V>) => V) &
  (<K, V>(map: Map<K, V>, key: K, fallbackIfNotFound: () => V) => V)
```

**Example**

```ts
import { MapX } from "@nunofyobiz/effect-extras"
import { pipe } from "effect"

const cache = new Map<string, Array<string>>()
const entries = MapX.getOrElseSetGet(cache, "a", () => [])
entries.push("first")
assert.deepStrictEqual(cache.get("a"), ["first"])

// Hit: returns the same stored value and ignores the fallback (data-last)
assert.strictEqual(
  pipe(
    cache,
    MapX.getOrElseSetGet("a", () => ["second"])
  ),
  entries
)
```

Added in v0.0.0

# constructors

## firstIndexes

Maps each computed key to its first zero-based position in `self`.
Later occurrences leave that first position unchanged.

Consumes any iterable once without mutating it and calls `keyOf` once per value.
Keys use native `Map` (SameValueZero) equality and iterate in first-encounter order.

**Signature**

```ts
export declare const firstIndexes: (<A, K>(keyOf: (value: A) => K) => (self: Iterable<A>) => Map<K, number>) &
  (<A, K>(self: Iterable<A>, keyOf: (value: A) => K) => Map<K, number>)
```

**Example**

```ts
import { MapX } from "@nunofyobiz/effect-extras"

const shoppingList = ["bread", "milk", "bread"]
// Find where each item first appears, ignoring its later repeats.
assert.deepStrictEqual(
  MapX.firstIndexes(shoppingList, (item) => item),
  new Map([
    ["bread", 0],
    ["milk", 1]
  ])
)
```

Added in v0.0.0

## indexes

Maps each computed key to every zero-based position where it occurs in `self`.
Duplicate keys accumulate positions in encounter order, with a fresh array per key.

Consumes any iterable once without mutating it and calls `keyOf` once per value.
Keys use native `Map` (SameValueZero) equality and iterate in first-encounter order.

**Signature**

```ts
export declare const indexes: (<A, K>(keyOf: (value: A) => K) => (self: Iterable<A>) => Map<K, number[]>) &
  (<A, K>(self: Iterable<A>, keyOf: (value: A) => K) => Map<K, number[]>)
```

**Example**

```ts
import { MapX } from "@nunofyobiz/effect-extras"

const shoppingList = ["bread", "milk", "bread"]
// Keep every position of each item, including repeated purchases.
assert.deepStrictEqual(
  MapX.indexes(shoppingList, (item) => item),
  new Map([
    ["bread", [0, 2]],
    ["milk", [1]]
  ])
)
```

Added in v0.0.0

## indices

Alias of `indexes`: maps each computed key to every zero-based position where
it occurs, using native `Map` equality and first-encounter key order.
This is the same function as `indexes`, including its single traversal and fresh arrays.

**Signature**

```ts
export declare const indices: (<A, K>(keyOf: (value: A) => K) => (self: Iterable<A>) => Map<K, number[]>) &
  (<A, K>(self: Iterable<A>, keyOf: (value: A) => K) => Map<K, number[]>)
```

**Example**

```ts
import { MapX } from "@nunofyobiz/effect-extras"
import { pipe } from "effect"

const shoppingList = ["bread", "milk", "bread"]
// The alternative spelling also keeps every position of each item.
assert.deepStrictEqual(
  pipe(
    shoppingList,
    MapX.indices((item: string) => item)
  ),
  new Map([
    ["bread", [0, 2]],
    ["milk", [1]]
  ])
)
assert.strictEqual(MapX.indices, MapX.indexes)
```

Added in v0.0.0

## lastIndexes

Maps each computed key to its last zero-based position in `self`.
Later occurrences overwrite earlier positions, matching `new Map(entries)`.

Consumes any iterable once without mutating it and calls `keyOf` once per value.
Keys use native `Map` (SameValueZero) equality and retain first-encounter order,
even when a later occurrence overwrites a position.

**Signature**

```ts
export declare const lastIndexes: (<A, K>(keyOf: (value: A) => K) => (self: Iterable<A>) => Map<K, number>) &
  (<A, K>(self: Iterable<A>, keyOf: (value: A) => K) => Map<K, number>)
```

**Example**

```ts
import { MapX } from "@nunofyobiz/effect-extras"

const shoppingList = ["bread", "milk", "bread"]
// Find the final mention of each item while keeping bread before milk.
assert.deepStrictEqual(
  MapX.lastIndexes(shoppingList, (item) => item),
  new Map([
    ["bread", 2],
    ["milk", 1]
  ])
)
```

Added in v0.0.0
