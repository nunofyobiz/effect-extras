import { DateTime, Duration, Match, Option } from "effect";
import { dual, pipe } from "effect/Function";
import { BigIntX } from "../BigIntX";

// Some private constants for conversion
const MICROS_PER_MILLI = 1000;

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
