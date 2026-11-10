---
title: SetX.ts
nav_order: 18
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
making repeated adds of existing members allocation-free. Use it to select a
member without mutating an earlier selection. Supports both
data-first and data-last (pipeable) call styles.

**Signature**

```ts
export declare const add: (<A>(value: A) => (set: Set<A>) => Set<A>) & (<A>(set: Set<A>, value: A) => Set<A>)
```

**Example**

```ts
import { SetX } from "@nunofyobiz/effect-extras"

const selectedTags = new Set(["typescript", "testing"])
// Select documentation alongside the existing tags.
const result = SetX.add(selectedTags, "documentation")
assert.deepStrictEqual(result, new Set(["typescript", "testing", "documentation"]))
// Selecting an already selected tag reuses the original selection.
assert.strictEqual(SetX.add(selectedTags, "testing"), selectedTags)

// The original selection has no documentation tag.
assert.deepStrictEqual(selectedTags, new Set(["typescript", "testing"]))
```

Added in v0.0.0

## remove

Returns a new `Set` with `value` removed, leaving the input set unchanged.

When `value` is absent the input set is returned as-is (no copy). Use it to
deselect a member while preserving an earlier selection. Supports both
data-first and data-last (pipeable) call styles.

**Signature**

```ts
export declare const remove: (<A>(value: A) => (set: Set<A>) => Set<A>) & (<A>(set: Set<A>, value: A) => Set<A>)
```

**Example**

```ts
import { SetX } from "@nunofyobiz/effect-extras"

const selectedTags = new Set(["typescript", "testing"])
// Deselect testing while keeping typescript selected.
const result = SetX.remove(selectedTags, "testing")
assert.deepStrictEqual(result, new Set(["typescript"]))
// Deselecting an absent tag reuses the original selection.
assert.strictEqual(SetX.remove(selectedTags, "documentation"), selectedTags)

// The original selection still includes testing.
assert.deepStrictEqual(selectedTags, new Set(["typescript", "testing"]))
```

Added in v0.0.0

## safelyMutate

Passes a fresh shallow copy of `set` to a mutating function and returns the
callback's exact `Set` result, which need not be that copy.

Use it to reuse imperative `Set` mutation code (`.add`, `.delete`) without
sacrificing immutability: the callback may freely mutate the set it receives
because it operates on a fresh container. Members keep their original
references, so mutating a member object also affects the original set's member.
Supports both data-first and data-last (pipeable) call styles.

**Signature**

```ts
export declare const safelyMutate: (<A>(mutate: (set: Set<A>) => Set<A>) => (set: Set<A>) => Set<A>) &
  (<A>(set: Set<A>, mutate: (set: Set<A>) => Set<A>) => Set<A>)
```

**Example**

```ts
import { SetX } from "@nunofyobiz/effect-extras"

const selectedTags = new Set(["typescript", "testing"])

// Replace the testing tag with documentation in a fresh selection.
const result = SetX.safelyMutate(selectedTags, (tags) => {
  tags.delete("testing")
  return tags.add("documentation")
})

assert.deepStrictEqual(result, new Set(["typescript", "documentation"]))
// The original selection still includes testing.
assert.deepStrictEqual(selectedTags, new Set(["typescript", "testing"]))
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

const selectedTags = new Set(["typescript", "testing"])
// Select documentation because it is absent, or deselect testing because it is present.
assert.deepStrictEqual(SetX.toggle(selectedTags, "documentation"), new Set(["typescript", "testing", "documentation"]))

assert.deepStrictEqual(SetX.toggle(selectedTags, "testing"), new Set(["typescript"]))
// Both updates leave the original selection intact.
assert.deepStrictEqual(selectedTags, new Set(["typescript", "testing"]))
```

Added in v0.0.0
