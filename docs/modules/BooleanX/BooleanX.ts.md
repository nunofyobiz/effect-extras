---
title: BooleanX/BooleanX.ts
nav_order: 3
parent: Modules
---

## BooleanX overview

Generic, framework-agnostic extensions to Effect's `Boolean` module.

Added in v0.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [conversions](#conversions)
  - [toBinary](#tobinary)

---

# conversions

## toBinary

Converts a `boolean` to its binary digit: `1` for `true`, `0` for `false`.

Useful when a numeric flag is required — summing booleans to count how many
predicates hold, or feeding a bit into bitwise math or an external API that
expects `0`/`1` rather than `false`/`true`.

**Signature**

```ts
export declare const toBinary: (value: boolean) => 0 | 1
```

**Example**

```ts
import { BooleanX } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(BooleanX.toBinary(true), 1)
assert.deepStrictEqual(BooleanX.toBinary(false), 0)
```

Added in v0.0.0
