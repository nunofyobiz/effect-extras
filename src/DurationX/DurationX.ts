/**
 * Generic, framework-agnostic extensions to Effect's `Duration` module.
 *
 * @since 0.0.0
 */
import { DateTime, Duration, Match, Option } from "effect";
import { dual, pipe } from "effect/Function";
import { BigIntX } from "../BigIntX";

// Some private constants for conversion
const MICROS_PER_MILLI = 1000;

/**
 * Computes the elapsed `Duration` from `that` to `self`, clamped at zero.
 *
 * Represents the time that has passed since the reference instant `that`. When
 * `that` lies in the future relative to `self`, the elapsed time is `zero`
 * rather than a negative duration.
 *
 * @example
 * ```ts
 * import { DateTime, Duration, pipe } from "effect"
 * import { DurationX } from "@nunofyobiz/effect-extras"
 *
 * const earlier = DateTime.makeUnsafe(1000)
 * const later = DateTime.makeUnsafe(4000)
 *
 * // data-first
 * assert.deepStrictEqual(DurationX.diff(later, earlier), Duration.seconds(3))
 *
 * // future reference clamps to zero
 * assert.deepStrictEqual(DurationX.diff(earlier, later), Duration.zero)
 *
 * // data-last (piped)
 * assert.deepStrictEqual(
 *   pipe(later, DurationX.diff(earlier)),
 *   Duration.seconds(3),
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
    Duration.millis(
      // Clamp at 0 — "diff" represents elapsed time since `that`; if `that`
      // is in the future relative to `self`, the elapsed time is zero
      // (not negative).
      Math.max(0, DateTime.toEpochMillis(self) - DateTime.toEpochMillis(that)),
    ),
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
 * Transforms a `Duration` by converting it to a numeric `unit`, applying `map`,
 * then converting back.
 *
 * Lets you operate on a duration in whatever unit is convenient — round it to
 * whole minutes, halve its seconds, floor its days — without juggling
 * conversions by hand. The `map` callback receives the duration expressed as a
 * `number` of `unit`s and returns the new count.
 *
 * @example
 * ```ts
 * import { Duration, Number, pipe } from "effect"
 * import { DurationX } from "@nunofyobiz/effect-extras"
 *
 * // data-first: halve a 4-second duration
 * assert.deepStrictEqual(
 *   DurationX.mapAsUnit(Duration.seconds(4), "second", Number.divideUnsafe(2)),
 *   Duration.seconds(2),
 * )
 *
 * // data-last (piped)
 * assert.deepStrictEqual(
 *   pipe(
 *     Duration.minutes(10),
 *     DurationX.mapAsUnit("minute", (minutes) => minutes + 5),
 *   ),
 *   Duration.minutes(15),
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
