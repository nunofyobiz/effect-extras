---
title: OrderX/OrderX.ts
nav_order: 11
parent: Modules
---

## OrderX overview

Generic, framework-agnostic extensions to Effect's `Order` module.

Added in v0.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [ordering](#ordering)
  - [rankedEnum](#rankedenum)

---

# ordering

## rankedEnum

Builds an `Order.Order` for an enum-like set of values from an explicit rank
table, sorting each value by its assigned numeric rank.

Use it when a union of string (or other `PropertyKey`) literals has a natural
priority that isn't its alphabetical order — pass a record mapping every
member to a rank and the resulting order sorts ascending by that rank.

**Signature**

```ts
export declare const rankedEnum: <const A extends PropertyKey>(ranks: Record<A, number>) => Order.Order<A>
```

**Example**

```ts
import { OrderX } from "@nunofyobiz/effect-extras"
import { Array } from "effect"

const byAge = OrderX.rankedEnum({ child: 0, parent: 1, grandparent: 2 })

assert.deepStrictEqual(Array.sort(["parent", "grandparent", "child"], byAge), ["child", "parent", "grandparent"])
```

Added in v0.0.0
