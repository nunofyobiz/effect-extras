---
title: DurationX.ts
nav_order: 4
parent: Modules
---

## DurationX overview

Generic, framework-agnostic extensions to Effect's `Duration` module.

Added in v0.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [combinators](#combinators)
  - [diff](#diff)
  - [mapAsUnit](#mapasunit)

---

# combinators

## diff

Computes the elapsed `Duration` from `that` to `self`, clamped at zero.

Represents the time that has passed since the reference instant `that`. When
`that` lies in the future relative to `self`, the elapsed time is `zero`
rather than a negative duration.

**Signature**

```ts
export declare const diff: ((that: DateTime.DateTime) => (self: DateTime.DateTime) => Duration.Duration) &
  ((self: DateTime.DateTime, that: DateTime.DateTime) => Duration.Duration)
```

**Example**

```ts
import { DateTime, Duration, pipe } from "effect"
import { DurationX } from "@nunofyobiz/effect-extras"

const earlier = DateTime.makeUnsafe(1000)
const later = DateTime.makeUnsafe(4000)

// data-first
assert.deepStrictEqual(DurationX.diff(later, earlier), Duration.seconds(3))

// future reference clamps to zero
assert.deepStrictEqual(DurationX.diff(earlier, later), Duration.zero)

// data-last (piped)
assert.deepStrictEqual(pipe(later, DurationX.diff(earlier)), Duration.seconds(3))
```

Added in v0.0.0

## mapAsUnit

Transforms a `Duration` by converting it to a numeric `unit`, applying `map`,
then converting back.

Lets you operate on a duration in whatever unit is convenient — round it to
whole minutes, halve its seconds, floor its days — without juggling
conversions by hand. The `map` callback receives the duration expressed as a
`number` of `unit`s and returns the new count.

**Signature**

```ts
export declare const mapAsUnit: ((
  unit: Duration.Unit,
  map: (numberOfUnits: number) => number
) => (duration: Duration.Duration) => Duration.Duration) &
  ((duration: Duration.Duration, unit: Duration.Unit, map: (numberOfUnits: number) => number) => Duration.Duration)
```

**Example**

```ts
import { Duration, Number, pipe } from "effect"
import { DurationX } from "@nunofyobiz/effect-extras"

// data-first: halve a 4-second duration
assert.deepStrictEqual(DurationX.mapAsUnit(Duration.seconds(4), "second", Number.divideUnsafe(2)), Duration.seconds(2))

// data-last (piped)
assert.deepStrictEqual(
  pipe(
    Duration.minutes(10),
    DurationX.mapAsUnit("minute", (minutes) => minutes + 5)
  ),
  Duration.minutes(15)
)
```

Added in v0.0.0
