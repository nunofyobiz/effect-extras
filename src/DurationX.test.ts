import { describe, expect, test } from "vitest";
import { DateTime, Duration, Number, pipe } from "effect";
import { diff, mapAsUnit } from "./DurationX.js";

describe("Duration utils", () => {
  describe("diff", () => {
    test("in the past", () => {
      const me = DateTime.nowUnsafe();
      const reference = DateTime.subtractDuration(me, Duration.seconds(1));

      expect(diff(me, reference)).toStrictEqual(Duration.seconds(1));
    });

    test("in the future", () => {
      const me = DateTime.nowUnsafe();
      const reference = DateTime.addDuration(me, Duration.seconds(1));

      expect(diff(me, reference)).toStrictEqual(Duration.zero);
    });

    test("data-last (piped)", () => {
      const earlier = DateTime.makeUnsafe(1000);
      const later = DateTime.makeUnsafe(4000);

      expect(pipe(later, diff(earlier))).toStrictEqual(Duration.seconds(3));
    });
  });

  describe("mapAsUnit", () => {
    test("divide by 2", () => {
      expect(
        pipe(
          Duration.seconds(4),
          mapAsUnit("second", Number.divideUnsafe(2)),
          Duration.toMillis,
        ),
      ).toEqual(pipe(Duration.seconds(2), Duration.toMillis));
    });

    test("data-first", () => {
      expect(
        mapAsUnit(Duration.seconds(4), "second", Number.divideUnsafe(2)),
      ).toStrictEqual(Duration.seconds(2));
    });

    // Exercises every branch of the internal `toUnit`/`fromUnit` Match — both
    // the singular and plural spelling of each `Duration.Unit`.
    test.each([
      ["weeks", Duration.weeks(2), Duration.weeks(4)],
      ["week", Duration.weeks(2), Duration.weeks(4)],
      ["days", Duration.days(3), Duration.days(6)],
      ["day", Duration.days(3), Duration.days(6)],
      ["hours", Duration.hours(5), Duration.hours(10)],
      ["hour", Duration.hours(5), Duration.hours(10)],
      ["minutes", Duration.minutes(7), Duration.minutes(14)],
      ["minute", Duration.minutes(7), Duration.minutes(14)],
      ["seconds", Duration.seconds(8), Duration.seconds(16)],
      ["second", Duration.seconds(8), Duration.seconds(16)],
      ["millis", Duration.millis(9), Duration.millis(18)],
      ["milli", Duration.millis(9), Duration.millis(18)],
      ["micros", Duration.micros(11n), Duration.micros(22n)],
      ["micro", Duration.micros(11n), Duration.micros(22n)],
      ["nanos", Duration.nanos(13n), Duration.nanos(26n)],
      ["nano", Duration.nanos(13n), Duration.nanos(26n)],
    ] as const)("doubles via unit %s", (unit, input, expected) => {
      expect(mapAsUnit(input, unit, (n) => n * 2)).toStrictEqual(expected);
    });

    test("throws converting an infinite duration to nanos", () => {
      expect(() => mapAsUnit(Duration.infinity, "nano", (n) => n)).toThrow(
        "Duration.toNanos returned None",
      );
    });
  });
});
