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

Returns how much time has passed from `that` to `self`, clamped at zero.

Use it to show how long ago an event happened. When
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

const placedAt = DateTime.makeUnsafe("2026-10-14T09:15:00Z")
const checkedAt = DateTime.makeUnsafe("2026-10-14T09:45:00Z")

// The order was placed 30 minutes before it was checked.
assert.deepStrictEqual(DurationX.diff(checkedAt, placedAt), Duration.minutes(30))

// A reference later than the check time gives zero elapsed time.
assert.deepStrictEqual(DurationX.diff(placedAt, checkedAt), Duration.zero)

// data-last (piped)
assert.deepStrictEqual(pipe(checkedAt, DurationX.diff(placedAt)), Duration.minutes(30))
```

Added in v0.0.0

## mapAsUnit

Changes a duration's count in the chosen unit, then converts it back to a duration.

Use it to round a timeout or adjust an interval without converting units by hand.
The `map` callback receives the duration as a `number` of `unit`s and returns
the new count. Microsecond and nanosecond results must be finite integers or
conversion throws a `RangeError`; other units accept fractional counts.
Infinite durations reach the microsecond callback as `Infinity`, but nanosecond
conversion throws `Duration.toNanos returned None` before calling `map`.
Finite nanosecond counts outside the safe integer range also throw before `map`.

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
import { Duration, pipe } from "effect"
import { DurationX } from "@nunofyobiz/effect-extras"

const requestTimeout = Duration.millis(1250)

// Round the 1.25-second timeout up to two whole seconds.
assert.deepStrictEqual(DurationX.mapAsUnit(requestTimeout, "second", Math.ceil), Duration.seconds(2))

// data-last (piped)
assert.deepStrictEqual(pipe(requestTimeout, DurationX.mapAsUnit("second", Math.ceil)), Duration.seconds(2))
```

Added in v0.0.0
