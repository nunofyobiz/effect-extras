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
