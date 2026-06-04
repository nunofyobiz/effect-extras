---
title: SetX/SetX.ts
nav_order: 17
parent: Modules
---

## SetX overview

Generic, framework-agnostic extensions for working with `Set`.

Added in v0.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [combinators](#combinators)
  - [add](#add)
  - [remove](#remove)
  - [safelyMutate](#safelymutate)
  - [toggle](#toggle)

---

# combinators

## add

Returns a new `Set` with `value` added, leaving the input set unchanged.

When `value` is already present the input set is returned as-is (no copy),
making repeated adds of existing members allocation-free. Supports both
data-first and data-last (pipeable) call styles.

**Signature**

```ts
export declare const add: (<A>(value: A) => (set: Set<A>) => Set<A>) & (<A>(set: Set<A>, value: A) => Set<A>)
```

**Example**

```ts
import { SetX } from "@nunofyobiz/effect-extras"
import { pipe } from "effect"

// Data-first — adds a new element into a fresh set
assert.deepStrictEqual(SetX.add(new Set(["a", "b"]), "c"), new Set(["a", "b", "c"]))

// Data-last — existing element leaves the set unchanged
assert.deepStrictEqual(pipe(new Set(["a", "b"]), SetX.add("b")), new Set(["a", "b"]))
```

Added in v0.0.0

## remove

Returns a new `Set` with `value` removed, leaving the input set unchanged.

When `value` is absent the input set is returned as-is (no copy). Supports both
data-first and data-last (pipeable) call styles.

**Signature**

```ts
export declare const remove: (<A>(value: A) => (set: Set<A>) => Set<A>) & (<A>(set: Set<A>, value: A) => Set<A>)
```

**Example**

```ts
import { SetX } from "@nunofyobiz/effect-extras"
import { pipe } from "effect"

// Data-first — removes an existing element into a fresh set
assert.deepStrictEqual(SetX.remove(new Set(["a", "b", "c"]), "c"), new Set(["a", "b"]))

// Data-last — absent element leaves the set unchanged
assert.deepStrictEqual(pipe(new Set(["a", "b"]), SetX.remove("z")), new Set(["a", "b"]))
```

Added in v0.0.0

## safelyMutate

Runs a mutating function against a copy of `set`, leaving the original
untouched, and returns the mutated copy.

Use it to reuse imperative `Set` mutation code (`.add`, `.delete`) without
sacrificing immutability: the callback may freely mutate the set it receives
because it operates on a fresh clone. Supports both data-first and data-last
(pipeable) call styles.

**Signature**

```ts
export declare const safelyMutate: (<A>(mutate: (set: Set<A>) => Set<A>) => (set: Set<A>) => Set<A>) &
  (<A>(set: Set<A>, mutate: (set: Set<A>) => Set<A>) => Set<A>)
```

**Example**

```ts
import { SetX } from "@nunofyobiz/effect-extras"
import { pipe } from "effect"

const original = new Set(["a", "b"])

const result = pipe(
  original,
  SetX.safelyMutate((set) => {
    set.delete("a")
    return set.add("c")
  })
)

assert.deepStrictEqual(result, new Set(["b", "c"]))
// The original is left intact
assert.deepStrictEqual(original, new Set(["a", "b"]))
```

Added in v0.0.0

## toggle

Returns a new `Set` with `value` added if it was absent or removed if it was
present, leaving the input set unchanged.

Use it for membership toggles (selection state, feature flags by key) where a
value's presence should flip on each call. Supports both data-first and
data-last (pipeable) call styles.

**Signature**

```ts
export declare const toggle: (<A>(value: A) => (set: Set<A>) => Set<A>) & (<A>(set: Set<A>, value: A) => Set<A>)
```

**Example**

```ts
import { SetX } from "@nunofyobiz/effect-extras"
import { pipe } from "effect"

// Data-first — absent value gets added
assert.deepStrictEqual(SetX.toggle(new Set(["a", "b"]), "c"), new Set(["a", "b", "c"]))

// Data-last — present value gets removed
assert.deepStrictEqual(pipe(new Set(["a", "b", "c"]), SetX.toggle("b")), new Set(["a", "c"]))
```

Added in v0.0.0
