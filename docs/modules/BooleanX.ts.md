---
title: BooleanX.ts
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

Converts `true` to `1` and `false` to `0`.

Use it to store a feature flag in a numeric field or send it to an API that
expects a binary digit.

**Signature**

```ts
export declare const toBinary: (value: boolean) => 0 | 1
```

**Example**

```ts
import { BooleanX } from "@nunofyobiz/effect-extras"

const emailNotificationsEnabled = true
const betaDashboardEnabled = false

// Store the enabled notification setting as 1 and the disabled beta setting as 0.
assert.deepStrictEqual(BooleanX.toBinary(emailNotificationsEnabled), 1)
assert.deepStrictEqual(BooleanX.toBinary(betaDashboardEnabled), 0)
```

Added in v0.0.0
