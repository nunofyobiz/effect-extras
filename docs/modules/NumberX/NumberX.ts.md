---
title: NumberX/NumberX.ts
nav_order: 9
parent: Modules
---

## NumberX overview

Generic, framework-agnostic extensions to Effect's `Number` module.

Added in v0.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [conversions](#conversions)
  - [indexToExcel](#indextoexcel)
  - [padLeftZeroes](#padleftzeroes)
  - [toFixed](#tofixed)
- [mapping](#mapping)
  - [indexToRank](#indextorank)
  - [roundToDigits](#roundtodigits)
- [unsafe](#unsafe)
  - [unsafeLogBase](#unsafelogbase)
  - [unsafeToPercentOf](#unsafetopercentof)

---

# conversions

## indexToExcel

Converts a `0`-indexed column number into its bijective base-26 spreadsheet
label (`A`, `B`, …, `Z`, `AA`, `AB`, …).

Returns `None` for a negative `index`; every non-negative index maps to a
`Some` label. Indexing is `0`-based here, so `0` is `"A"` and `25` is `"Z"`,
unlike the `1`-based numbering shown in most spreadsheet references.

**Signature**

```ts
export declare const indexToExcel: (index: number) => Option.Option<string>
```

**Example**

```ts
import { Option } from "effect"
import { NumberX } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(NumberX.indexToExcel(0), Option.some("A"))
assert.deepStrictEqual(NumberX.indexToExcel(26), Option.some("AA"))
assert.deepStrictEqual(NumberX.indexToExcel(-1), Option.none())
```

Added in v0.0.0

## padLeftZeroes

Renders `number` as a `string`, left-padded with zeroes to at least
`numberDigits` characters.

If the number's string representation is already as long as (or longer than)
`numberDigits`, it is returned unchanged.

**Signature**

```ts
export declare const padLeftZeroes: ((numberDigits: number) => (number: number) => string) &
  ((number: number, numberDigits: number) => string)
```

**Example**

```ts
import { pipe } from "effect"
import { NumberX } from "@nunofyobiz/effect-extras"

// data-first
assert.deepStrictEqual(NumberX.padLeftZeroes(1, 3), "001")

// longer than the target width is returned unchanged
assert.deepStrictEqual(NumberX.padLeftZeroes(1000, 3), "1000")

// data-last (piped)
assert.deepStrictEqual(pipe(10, NumberX.padLeftZeroes(3)), "010")
```

Added in v0.0.0

## toFixed

Formats `number` with a fixed number of decimal places, returning a `string`.

A pipeable wrapper around `Number.prototype.toFixed` — the result is rounded
(not truncated) to `numberDigits` decimals and always carries exactly that
many digits after the point.

**Signature**

```ts
export declare const toFixed: ((numberDigits: number) => (number: number) => string) &
  ((number: number, numberDigits: number) => string)
```

**Example**

```ts
import { pipe } from "effect"
import { NumberX } from "@nunofyobiz/effect-extras"

// data-first
assert.deepStrictEqual(NumberX.toFixed(3.236242, 2), "3.24")

// data-last (piped)
assert.deepStrictEqual(pipe(3.236242, NumberX.toFixed(0)), "3")
```

Added in v0.0.0

# mapping

## indexToRank

Converts a `0`-indexed value to its `1`-indexed rank by adding `1`.

Handy for presentation where humans count from one (e.g. the element at
index `0` is shown as "item 1").

**Signature**

```ts
export declare const indexToRank: (index: number) => number
```

**Example**

```ts
import { NumberX } from "@nunofyobiz/effect-extras"

assert.deepStrictEqual(NumberX.indexToRank(0), 1)
assert.deepStrictEqual(NumberX.indexToRank(4), 5)
```

Added in v0.0.0

## roundToDigits

Rounds `number` to a fixed number of decimal places, returning a `number`.

Unlike {@link toFixed}, the result stays a `number` (no trailing zeroes) — it
formats via `toFixed` then parses back, which sidesteps the usual
floating-point rounding artifacts. See
https://stackoverflow.com/a/29494612/22875620.

**Signature**

```ts
export declare const roundToDigits: ((numberDigits: number) => (number: number) => number) &
  ((number: number, numberDigits: number) => number)
```

**Example**

```ts
import { pipe } from "effect"
import { NumberX } from "@nunofyobiz/effect-extras"

// data-first
assert.deepStrictEqual(NumberX.roundToDigits(3.236242, 2), 3.24)

// data-last (piped)
assert.deepStrictEqual(pipe(3.736242, NumberX.roundToDigits(0)), 4)
```

Added in v0.0.0

# unsafe

## unsafeLogBase

Computes the logarithm of `number` in the given `base`, throwing when the
inputs fall outside the domain of `log`.

Throws when `number <= 0`, when `base` is `<= 0` or `1`, or when `number` and
`base` sit on opposite sides of `1` (a fractional base with `number >= 1`, or
a base `>= 1` with `number < 1`) — cases where the real logarithm is
undefined or non-finite. Reach for it only when the inputs are already known
to be valid.

**Signature**

```ts
export declare const unsafeLogBase: ((base: number) => (number: number) => number) &
  ((number: number, base: number) => number)
```

**Example**

```ts
import { pipe } from "effect"
import { NumberX } from "@nunofyobiz/effect-extras"

// data-first
assert.deepStrictEqual(NumberX.unsafeLogBase(8, 2), 3)
assert.deepStrictEqual(NumberX.unsafeLogBase(100, 10), 2)

// data-last (piped)
assert.deepStrictEqual(pipe(8, NumberX.unsafeLogBase(2)), 3)

// throws outside the domain of log
assert.throws(() => NumberX.unsafeLogBase(0, 2))
```

Added in v0.0.0

## unsafeToPercentOf

Expresses `numerator` as a percentage of `total`, throwing on division by
zero.

Returns `(numerator / total) * 100`. When `total` is `0` the percentage is
undefined, so this throws rather than returning `Infinity` or `NaN` — use it
only when `total` is known to be non-zero.

**Signature**

```ts
export declare const unsafeToPercentOf: ((total: number) => (numerator: number) => number) &
  ((numerator: number, total: number) => number)
```

**Example**

```ts
import { pipe } from "effect"
import { NumberX } from "@nunofyobiz/effect-extras"

// data-first
assert.deepStrictEqual(NumberX.unsafeToPercentOf(1, 2), 50)
assert.deepStrictEqual(NumberX.unsafeToPercentOf(2, 1), 200)

// data-last (piped)
assert.deepStrictEqual(pipe(1, NumberX.unsafeToPercentOf(2)), 50)

// throws on division by zero
assert.throws(() => NumberX.unsafeToPercentOf(1, 0))
```

Added in v0.0.0
