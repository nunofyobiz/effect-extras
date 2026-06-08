---
title: PromiseX.ts
nav_order: 15
parent: Modules
---

## PromiseX overview

Helpers for working with native `Promise`s.

Added in v0.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [conversions](#conversions)
  - [asVoid](#asvoid)

---

# conversions

## asVoid

Discards the resolved value of a `Promise`, returning a `Promise<void>` that
resolves once the original settles.

Useful when you await a promise only for its side effect and want the result
type to reflect that nothing meaningful is produced — for example when an API
expects a `Promise<void>` or when narrowing a value-bearing promise to keep
call sites from accidentally depending on the resolved value. A rejection of
the original promise still propagates.

**Signature**

```ts
export declare const asVoid: <T>(promise: Promise<T>) => Promise<void>
```

**Example**

```ts
import { PromiseX } from "@nunofyobiz/effect-extras"

const run = async (): Promise<void> => {
  const result = await PromiseX.asVoid(Promise.resolve(42))
  assert.deepStrictEqual(result, undefined)
}

void run()
```

Added in v0.0.0
