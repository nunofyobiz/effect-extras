---
title: ArrayX.ts
nav_order: 1
parent: Modules
---

## ArrayX overview

Generic, framework-agnostic extensions to Effect's `Array` module.

Added in v0.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [combinators](#combinators)
  - [insertUniq](#insertuniq)
- [filtering](#filtering)
  - [compactNullable](#compactnullable)
  - [filterHead](#filterhead)
  - [filterMapNullable](#filtermapnullable)
  - [filterTail](#filtertail)
- [folding](#folding)
  - [categorize](#categorize)
  - [chunkBy](#chunkby)
  - [mapRightAccum](#maprightaccum)
- [getters](#getters)
  - [findFirstWithIndex2d](#findfirstwithindex2d)
  - [maxOption](#maxoption)
  - [slice](#slice)
  - [takeFirstWhere](#takefirstwhere)
  - [takeLastWhere](#takelastwhere)

---

# combinators

## insertUniq

Inserts or moves a unique item in an array at a specified position.

**Assumption**: Items should be unique in the array based on standard equality.

**Happy case**: If the item doesn't exist in the array and the destination reference item is found:
The new item is inserted before the destination reference item

**Item not found in array**:

- If destination reference item is found: The new item is inserted before the destination reference item
- If destination reference item is not found: The new item is inserted at the end of the array

**Item found but duplicated**:

- If destination reference item is found: All existing copies are removed, then a single copy is inserted before the destination reference item
- If destination reference item is not found: All existing copies are removed, then a single copy is inserted at the end of the array

**Signature**

```ts
export declare const insertUniq: (<A extends string | number>(config: {
  item: A
  insertToBeLeftOf: A | null
}) => (array: readonly A[] | A[]) => A[]) &
  (<A extends string | number>(array: readonly A[] | A[], config: { item: A; insertToBeLeftOf: A | null }) => A[])
```

**Example**

```ts
import { ArrayX } from "@nunofyobiz/effect-extras"

// Move an existing item to sit just before "c"
assert.deepStrictEqual(ArrayX.insertUniq(["a", "b", "c", "d"], { item: "a", insertToBeLeftOf: "c" }), [
  "b",
  "a",
  "c",
  "d"
])

// Insert a brand-new item; unknown destination falls through to the end
assert.deepStrictEqual(ArrayX.insertUniq(["a", "b"], { item: "new", insertToBeLeftOf: null }), ["a", "b", "new"])
```

Added in v0.0.0

# filtering

## compactNullable

Removes all `null` and `undefined` elements from `array`, narrowing the
element type to `NonNullable<A>`.

Falsy-but-present values such as `0` and `""` are kept — only nullish values
are dropped. Use it to clean up an array of optionals into a dense array of
known-present values.

**Signature**

```ts
export declare const compactNullable: <A>(array: A[]) => NonNullable<A>[]
```

**Example**

```ts
import { ArrayX } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(ArrayX.compactNullable([1, null, 2, undefined, 0, ""]), [1, 2, 0, ""])
```

Added in v0.0.0

## filterHead

Drops the leading elements of `array` until `predicate` first holds, keeping
everything from the first match onward.

The first matching element and all subsequent elements are retained
regardless of whether they match — only the prefix _before_ the first match
is trimmed. If nothing matches, returns an empty array.

**Signature**

```ts
export declare const filterHead: (<A>(predicate: Predicate.Predicate<A>) => (array: A[]) => A[]) &
  (<A>(array: A[], predicate: Predicate.Predicate<A>) => A[])
```

**Example**

```ts
import { Predicate } from "effect"
import { ArrayX } from "@nunofyobiz/effect-extras"

// Trims the leading strings, then keeps everything (including the trailing "b")
assert.deepStrictEqual(ArrayX.filterHead(["a", 1, 2, "b"], Predicate.isNumber), [1, 2, "b"])
```

Added in v0.0.0

## filterMapNullable

Maps `f` over `array` and drops every result that is `null` or `undefined`,
narrowing the element type to `NonNullable<B>`.

A nullable-friendly `Array.filterMap`: where `filterMap` expects `f` to
return an `Option`, this accepts a function returning `B | null` (or
`undefined`) and treats nullish results as "skip this element". Falsy-but-
present values such as `0` and `""` are kept.

**Signature**

```ts
export declare const filterMapNullable: (<A, B>(f: (a: A) => B | null) => (array: A[]) => NonNullable<B>[]) &
  (<A, B>(array: A[], f: (a: A) => B | null) => NonNullable<B>[])
```

**Example**

```ts
import { ArrayX } from "@nunofyobiz/effect-extras"

// Keep only the even numbers, mapped to their halves
assert.deepStrictEqual(
  ArrayX.filterMapNullable([1, 2, 3, 4], (n) => (n % 2 === 0 ? n / 2 : null)),
  [1, 2]
)
```

Added in v0.0.0

## filterTail

Drops the trailing elements of `array` after `predicate` last holds, keeping
everything up to and including the last match.

The mirror of {@link filterHead}: the last matching element and all preceding
elements are retained regardless of whether they match — only the suffix
_after_ the last match is trimmed. If nothing matches, returns an empty
array.

**Signature**

```ts
export declare const filterTail: (<A>(predicate: Predicate.Predicate<A>) => (array: A[]) => A[]) &
  (<A>(array: A[], predicate: Predicate.Predicate<A>) => A[])
```

**Example**

```ts
import { Predicate } from "effect"
import { ArrayX } from "@nunofyobiz/effect-extras"

// Keeps the leading "a" and trims the trailing strings after the last number
assert.deepStrictEqual(ArrayX.filterTail(["a", 1, 2, "b"], Predicate.isNumber), ["a", 1, 2])
```

Added in v0.0.0

# folding

## categorize

Groups `items` into a partial record keyed by the category each item maps to
via `categorize`.

Each item is appended to the array under its category, preserving input
order. The result is `Partial<Record<C, A[]>>` because not every possible
category `C` is guaranteed to appear — only categories that received at least
one item are present.

**Signature**

```ts
export declare const categorize: <A, C extends string>(
  items: Iterable<A>,
  categorize: (a: A) => C
) => Partial<Record<C, A[]>>
```

**Example**

```ts
import { ArrayX } from "@nunofyobiz/effect-extras"

const parity = (n: number) => (n % 2 === 0 ? "even" : "odd")

assert.deepStrictEqual(ArrayX.categorize([1, 2, 3, 4], parity), {
  odd: [1, 3],
  even: [2, 4]
})
```

Added in v0.0.0

## chunkBy

Splits `array` into runs of consecutive elements that share the same group
value, where the group is derived by `chunk` and compared with the provided
`Equivalence`.

Only _adjacent_ elements are grouped: a new run starts every time the group
value changes from the previous element. Each entry in the result carries the
`group` value and the non-empty array of `values` that produced it, preserving
input order. An empty input yields an empty array. Use it for run-length-style
segmentation; reach for `Array.groupBy` instead when you want all elements
with the same key collapsed regardless of position.

**Signature**

```ts
export declare const chunkBy: (<A, B>(
  chunk: (a: A) => B,
  GroupEquivalence: Equivalence.Equivalence<B>
) => (array: A[]) => { group: B; values: Array.NonEmptyArray<A> }[]) &
  (<A, B>(
    array: A[],
    chunk: (a: A) => B,
    GroupEquivalence: Equivalence.Equivalence<B>
  ) => { group: B; values: Array.NonEmptyArray<A> }[])
```

**Example**

```ts
import { Equivalence } from "effect"
import { ArrayX } from "@nunofyobiz/effect-extras"

// Group adjacent numbers by parity
assert.deepStrictEqual(
  ArrayX.chunkBy([2, 4, 1, 3, 6], (n) => n % 2 === 0, Equivalence.Boolean),
  [
    { group: true, values: [2, 4] },
    { group: false, values: [1, 3] },
    { group: true, values: [6] }
  ]
)
```

Added in v0.0.0

## mapRightAccum

Maps over `array` while threading an accumulator, iterating from right to
left instead of left to right.

Identical to `Array.mapAccum`, except the traversal order is reversed: `f` is
called on the last element first, and the resulting array is returned in the
original (left-to-right) order. Use it when each element's mapped value
depends on state accumulated from the elements that follow it.

**Signature**

```ts
export declare const mapRightAccum: (<A, B, C>(
  initialAccumulator: C,
  f: (accumulator: C, a: A, index: number) => [C, B]
) => (array: A[]) => [C, B[]]) &
  (<A, B, C>(array: A[], initialAccumulator: C, f: (accumulator: C, a: A, index: number) => [C, B]) => [C, B[]])
```

**Example**

```ts
import { ArrayX } from "@nunofyobiz/effect-extras"

// Running suffix-sum: each slot holds the sum of itself and everything after it
assert.deepStrictEqual(
  ArrayX.mapRightAccum([1, 2, 3], 0, (total, n) => [total + n, total + n]),
  [6, [6, 5, 3]]
)
```

Added in v0.0.0

# getters

## findFirstWithIndex2d

Finds the first element of a 2-dimensional array (row-major order) matching
`predicate`, returning it alongside its row and column indices.

Scans rows top-to-bottom and, within each row, left-to-right. On a match
returns `Option.some([value, rowIndex, columnIndex])`; if no element matches
(or the grid is empty), returns `Option.none()`.

**Signature**

```ts
export declare const findFirstWithIndex2d: (<A>(
  predicate: Predicate.Predicate<A>
) => (array: A[][]) => Option.Option<[A, number, number]>) &
  (<A>(array: A[][], predicate: Predicate.Predicate<A>) => Option.Option<[A, number, number]>)
```

**Example**

```ts
import { Option } from "effect"
import { ArrayX } from "@nunofyobiz/effect-extras"

const grid = [
  ["A", "B", "C"],
  ["D", "E", "F"]
]

assert.deepStrictEqual(
  ArrayX.findFirstWithIndex2d(grid, (cell) => cell === "E"),
  Option.some(["E", 1, 1])
)
```

Added in v0.0.0

## maxOption

Returns the maximum element of `array` according to `order`, wrapped in an
`Option` so that empty arrays are handled safely.

Effect's `Array.max` throws on an empty array; this returns `Option.none()`
instead, and `Option.some(max)` otherwise. Reach for it whenever the input
array might be empty.

**Signature**

```ts
export declare const maxOption: (<A>(order: Order.Order<A>) => (array: A[]) => Option.Option<A>) &
  (<A>(array: A[], order: Order.Order<A>) => Option.Option<A>)
```

**Example**

```ts
import { Option, Order, pipe } from "effect"
import { ArrayX } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(pipe([3, 7, 2], ArrayX.maxOption(Order.Number)), Option.some(7))
assert.deepStrictEqual(pipe([], ArrayX.maxOption(Order.Number)), Option.none())
```

Added in v0.0.0

## slice

Returns a shallow copy of `array` between `start` (inclusive) and `end`
(exclusive), as a pipeable, dual-form alias for `Array.prototype.slice`.

`Array.prototype.slice` is already non-mutating (it returns a shallow copy),
but it isn't pipeable. This helper makes it composable inside `pipe(...)`
chains alongside the rest of the codebase's Effect-style utilities.

**Signature**

```ts
export declare const slice: (<A>(start: number, end: number) => (array: readonly A[]) => A[]) &
  (<A>(array: readonly A[], start: number, end: number) => A[])
```

**Example**

```ts
import { pipe } from "effect"
import { ArrayX } from "@nunofyobiz/effect-extras"

// data-first
assert.deepStrictEqual(ArrayX.slice([1, 2, 3, 4], 1, 3), [2, 3])

// data-last (pipeable)
assert.deepStrictEqual(pipe([1, 2, 3, 4], ArrayX.slice(1, 3)), [2, 3])
```

Added in v0.0.0

## takeFirstWhere

Returns the smallest element of `array` (per `order`) that matches
`predicate`, narrowed to the refined type `B`, or `Option.none()` if none
match.

Combines a refinement filter with `Array.min`: only elements satisfying
`predicate` are considered, and the minimum of those (by `order`) is
returned. The refinement narrows the element type, so the resulting `Option`
carries the more specific `B`.

**Signature**

```ts
export declare const takeFirstWhere: (<A, B extends A>(
  predicate: Predicate.Refinement<A, B>,
  order: Order.Order<B>
) => (array: A[]) => Option.Option<B>) &
  (<A, B extends A>(array: A[], predicate: Predicate.Refinement<A, B>, order: Order.Order<B>) => Option.Option<B>)
```

**Example**

```ts
import { Option, Order, pipe } from "effect"
import { ArrayX } from "@nunofyobiz/effect-extras"

const isEven = (n: number): n is number => n % 2 === 0

assert.deepStrictEqual(pipe([3, 4, 1, 2, 5], ArrayX.takeFirstWhere(isEven, Order.Number)), Option.some(2))
assert.deepStrictEqual(pipe([1, 3, 5], ArrayX.takeFirstWhere(isEven, Order.Number)), Option.none())
```

Added in v0.0.0

## takeLastWhere

Returns the largest element of `array` (per `order`) that matches
`predicate`, narrowed to the refined type `B`, or `Option.none()` if none
match.

The mirror of {@link takeFirstWhere}: only elements satisfying `predicate`
are considered, and the maximum of those (by `order`) is returned. The
refinement narrows the element type, so the resulting `Option` carries the
more specific `B`.

**Signature**

```ts
export declare const takeLastWhere: (<A, B extends A>(
  predicate: Predicate.Refinement<A, B>,
  order: Order.Order<B>
) => (array: A[]) => Option.Option<B>) &
  (<A, B extends A>(array: A[], predicate: Predicate.Refinement<A, B>, order: Order.Order<B>) => Option.Option<B>)
```

**Example**

```ts
import { Option, Order, pipe } from "effect"
import { ArrayX } from "@nunofyobiz/effect-extras"

const isEven = (n: number): n is number => n % 2 === 0

assert.deepStrictEqual(pipe([3, 4, 1, 2, 5], ArrayX.takeLastWhere(isEven, Order.Number)), Option.some(4))
assert.deepStrictEqual(pipe([1, 3, 5], ArrayX.takeLastWhere(isEven, Order.Number)), Option.none())
```

Added in v0.0.0
