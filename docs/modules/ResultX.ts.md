---
title: ResultX.ts
nav_order: 17
parent: Modules
---

## ResultX overview

Generic, framework-agnostic extensions to Effect's `Result` module.

Added in v0.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [conversions](#conversions)
  - [fromOption](#fromoption)

---

# conversions

## fromOption

Lifts an `Option` into a `Result` with a `void` failure: `Some(value)` becomes
`Result.succeed(value)` and `None` becomes `Result.failVoid`.

Useful in v4 where `Array.filterMap` and `Record.filterMap` expect
`Result`-returning predicates (a `Success` keeps the value, a `Failure` drops
it); in v3 those APIs accepted `Option`-returning predicates directly:

```ts
import { Array } from "effect"
import { ResultX } from "@nunofyobiz/effect-extras"

declare const items: ReadonlyArray<number>
declare const maybeTransform: (item: number) => import("effect").Option.Option<string>

// v3: Array.filterMap(items, (item) => maybeTransform(item))
// v4:
Array.filterMap(items, (item) => ResultX.fromOption(maybeTransform(item)))
```

Effect ships `Result.fromOption(option, onNone)` which requires a non-`void`
failure value; this helper specializes to the common "drop the item, no error
needed" case used by `filterMap`.

**Signature**

```ts
export declare const fromOption: <A>(option: Option.Option<A>) => Result.Result<A, void>
```

**Example**

```ts
import { Option, Result } from "effect"
import { ResultX } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(ResultX.fromOption(Option.some(1)), Result.succeed(1))
assert.deepStrictEqual(ResultX.fromOption(Option.none<number>()), Result.failVoid)
```

Added in v0.0.0
