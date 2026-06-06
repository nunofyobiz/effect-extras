---
title: BigIntX.ts
nav_order: 2
parent: Modules
---

## BigIntX overview

Generic, framework-agnostic extensions to Effect's `BigInt` module.

Added in v0.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [unsafe](#unsafe)
  - [toNumberOrThrow](#tonumberorthrow)

---

# unsafe

## toNumberOrThrow

Converts a `bigint` to a `number`, throwing when the value cannot be
represented exactly.

Delegates to Effect's `BigInt.toNumber`, which returns `None` once the
`bigint` falls outside the safe integer range (`Number.MAX_SAFE_INTEGER`).
This unwraps that `Option`, throwing instead of silently losing precision —
use it only when the value is known to fit.

**Signature**

```ts
export declare const toNumberOrThrow: (value: bigint) => number
```

**Example**

```ts
import { BigIntX } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(BigIntX.toNumberOrThrow(42n), 42)

// throws when outside the safe integer range
assert.throws(() => BigIntX.toNumberOrThrow(9007199254740993n))
```

Added in v0.0.0
