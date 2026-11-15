/**
 * Generic, framework-agnostic extensions to Effect's `Duration` module.
 *
 * @since 0.0.0
 */
import { DateTime, Duration, Match, Option } from "effect";
import { dual, pipe } from "effect/Function";
import * as BigIntX from "./BigIntX.js";

// Some private constants for conversion
const MICROS_PER_MILLI = 1000;

/**
 * Returns how much time has passed from `that` to `self`, clamped at zero.
 *
 * Use it to show how long ago an event happened. When
 * `that` lies in the future relative to `self`, the elapsed time is `zero`
 * rather than a negative duration.
 *
 * @example
 * ```ts
 * import { DateTime, Duration, pipe } from "effect"
 * import { DurationX } from "@nunofyobiz/effect-extras"
 *
 * const placedAt = DateTime.makeUnsafe("2026-10-14T09:15:00Z")
 * const checkedAt = DateTime.makeUnsafe("2026-10-14T09:45:00Z")
 *
 * // The order was placed 30 minutes before it was checked.
 * assert.deepStrictEqual(DurationX.diff(checkedAt, placedAt), Duration.minutes(30))
 *
 * // A reference later than the check time gives zero elapsed time.
 * assert.deepStrictEqual(DurationX.diff(placedAt, checkedAt), Duration.zero)
 *
 * // data-last (piped)
 * assert.deepStrictEqual(
 *   pipe(checkedAt, DurationX.diff(placedAt)),
 *   Duration.minutes(30),
 * )
 * ```
 *
 * @category combinators
 * @since 0.0.0
 */
export const diff = dual<
  // Data-last typing
  (that: DateTime.DateTime) => (self: DateTime.DateTime) => Duration.Duration,
  // Data-first typing
  (self: DateTime.DateTime, that: DateTime.DateTime) => Duration.Duration
>(
  2,
  (self: DateTime.DateTime, that: DateTime.DateTime): Duration.Duration =>
    Duration.max(DateTime.distance(that, self), Duration.zero),
);

// Internal — used by mapAsUnit.
const toUnit = dual<
  // Data-last typing
  (unit: Duration.Unit) => (duration: Duration.Duration) => number,
  // Data-first typing
  (duration: Duration.Duration, unit: Duration.Unit) => number
>(2, (duration: Duration.Duration, unit: Duration.Unit): number =>
  Match.value(unit).pipe(
    Match.whenOr("week", "weeks", () => Duration.toWeeks(duration)),
    Match.whenOr("day", "days", () => Duration.toDays(duration)),
    Match.whenOr("hour", "hours", () => Duration.toHours(duration)),
    Match.whenOr("minute", "minutes", () => Duration.toMinutes(duration)),
    Match.whenOr("second", "seconds", () => Duration.toSeconds(duration)),
    Match.whenOr("milli", "millis", () => Duration.toMillis(duration)),
    Match.whenOr(
      "micro",
      "micros",
      () => Duration.toMillis(duration) * MICROS_PER_MILLI,
    ),
    Match.whenOr("nano", "nanos", () =>
      pipe(
        Duration.toNanos(duration),
        Option.getOrThrowWith(
          () => new Error("Duration.toNanos returned None"),
        ),
        BigIntX.toNumberOrThrow,
      ),
    ),
    Match.exhaustive,
  ),
);

// Internal — used by mapAsUnit.
const fromUnit = dual<
  // Data-last typing
  (unit: Duration.Unit) => (value: number) => Duration.Duration,
  // Data-first typing
  (value: number, unit: Duration.Unit) => Duration.Duration
>(
  2,
  (value: number, unit: Duration.Unit): Duration.Duration =>
    Match.value(unit).pipe(
      Match.whenOr("week", "weeks", () => Duration.weeks(value)),
      Match.whenOr("day", "days", () => Duration.days(value)),
      Match.whenOr("hour", "hours", () => Duration.hours(value)),
      Match.whenOr("minute", "minutes", () => Duration.minutes(value)),
      Match.whenOr("second", "seconds", () => Duration.seconds(value)),
      Match.whenOr("milli", "millis", () => Duration.millis(value)),
      Match.whenOr("micro", "micros", () => Duration.micros(BigInt(value))),
      Match.whenOr("nano", "nanos", () => Duration.nanos(BigInt(value))),
      Match.exhaustive,
    ),
);

/**
 * Changes a duration's count in the chosen unit, then converts it back to a duration.
 *
 * Use it to round a timeout or adjust an interval without converting units by hand.
 * The `map` callback receives the duration as a `number` of `unit`s and returns
 * the new count. Microsecond and nanosecond results must be finite integers or
 * conversion throws a `RangeError`; other units accept fractional counts.
 * Infinite durations reach the microsecond callback as `Infinity`, but nanosecond
 * conversion throws `Duration.toNanos returned None` before calling `map`.
 * Finite nanosecond counts outside the safe integer range also throw before `map`.
 *
 * @example
 * ```ts
 * import { Duration, pipe } from "effect"
 * import { DurationX } from "@nunofyobiz/effect-extras"
 *
 * const requestTimeout = Duration.millis(1250)
 *
 * // Round the 1.25-second timeout up to two whole seconds.
 * assert.deepStrictEqual(
 *   DurationX.mapAsUnit(requestTimeout, "second", Math.ceil),
 *   Duration.seconds(2),
 * )
 *
 * // data-last (piped)
 * assert.deepStrictEqual(
 *   pipe(
 *     requestTimeout,
 *     DurationX.mapAsUnit("second", Math.ceil),
 *   ),
 *   Duration.seconds(2),
 * )
 * ```
 *
 * @category combinators
 * @since 0.0.0
 */
export const mapAsUnit = dual<
  // Data-last typing
  (
    unit: Duration.Unit,
    map: (numberOfUnits: number) => number,
  ) => (duration: Duration.Duration) => Duration.Duration,
  // Data-first typing
  (
    duration: Duration.Duration,
    unit: Duration.Unit,
    map: (numberOfUnits: number) => number,
  ) => Duration.Duration
>(
  3,
  (
    duration: Duration.Duration,
    unit: Duration.Unit,
    map: (numberOfUnits: number) => number,
  ): Duration.Duration =>
    pipe(
      duration,

      // Convert to that unit
      toUnit(unit),

      // Truncate to the requested number of digits
      map,

      // Convert back to a duration
      fromUnit(unit),
    ),
);
