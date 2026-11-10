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
import nodeAssert from "node:assert"

type CatalogueItem = { id: string; name: string }
const cache = new Map<string, CatalogueItem>()

// A miss populates the cache with the catalogue item and returns that same object.
const mug = MapX.getOrElseSetGet(cache, "mug", () => ({ id: "mug", name: "Coffee mug" }))
nodeAssert.deepStrictEqual(mug, { id: "mug", name: "Coffee mug" })
nodeAssert.strictEqual(cache.get("mug"), mug)

// A piped hit reuses the cached mug; the replacement fallback is ignored.
nodeAssert.strictEqual(
  pipe(
    cache,
    MapX.getOrElseSetGet("mug", () => ({ id: "mug", name: "Replacement mug" }))
  ),
  mug
)

// Piped calls also populate missing items, leaving the cached mug in place.
const notebook = pipe(
  cache,
  MapX.getOrElseSetGet("notebook", () => ({ id: "notebook", name: "Notebook" }))
)
nodeAssert.strictEqual(cache.get("notebook"), notebook)
nodeAssert.strictEqual(
  MapX.getOrElseSetGet(cache, "notebook", () => mug),
  notebook
)
nodeAssert.deepStrictEqual(
  [...cache],
  [
    ["mug", { id: "mug", name: "Coffee mug" }],
    ["notebook", { id: "notebook", name: "Notebook" }]
  ]
)
```

Added in v0.0.0
