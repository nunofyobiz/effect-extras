---
title: OrderX.ts
nav_order: 12
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

Orders a set of values by their assigned numeric ranks, lowest rank first.

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

const OrderTicketPriorities = OrderX.rankedEnum({ urgent: 0, normal: 1, low: 2 })

// Show urgent support tickets before normal and low-priority tickets.
assert.deepStrictEqual(Array.sort(["low", "urgent", "normal"], OrderTicketPriorities), ["urgent", "normal", "low"])
```

Added in v0.0.0
