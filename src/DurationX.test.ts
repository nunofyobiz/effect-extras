import { describe, expect, test, vi } from "vitest";
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

    test("with fixed instants", () => {
      const earlier = DateTime.makeUnsafe(1000);
      const later = DateTime.makeUnsafe(4000);

      const dataFirst = pipe(later, (value) => diff(value, earlier));
      const dataLast = pipe(later, diff(earlier));

      expect(dataFirst).toStrictEqual(Duration.seconds(3));
      expect(dataLast).toStrictEqual(dataFirst);
      expect(diff(earlier, later)).toStrictEqual(Duration.zero);
      expect(diff(earlier, earlier)).toStrictEqual(Duration.zero);
    });

    test("with fractional instant inputs", () => {
      const earlier = DateTime.makeUnsafe(1000.9);
      const later = DateTime.makeUnsafe(1001.1);

      expect(diff(later, earlier)).toStrictEqual(Duration.millis(1));
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
      const input = Duration.seconds(4);
      const dataFirst = pipe(input, (value) =>
        mapAsUnit(value, "second", Number.divideUnsafe(2)),
      );
      const dataLast = pipe(input, mapAsUnit("second", Number.divideUnsafe(2)));

      expect(dataFirst).toStrictEqual(Duration.seconds(2));
      expect(dataLast).toStrictEqual(dataFirst);
    });

    test("maps a zero duration", () => {
      const map = vi.fn((n: number) => n);

      expect(mapAsUnit(Duration.zero, "second", map)).toStrictEqual(
        Duration.zero,
      );
      expect(map).toHaveBeenCalledWith(0);
    });

    test("passes a fractional count across a unit boundary", () => {
      const map = vi.fn((n: number) => n);

      expect(mapAsUnit(Duration.minutes(90), "hour", map)).toStrictEqual(
        Duration.minutes(90),
      );
      expect(map).toHaveBeenCalledWith(1.5);
    });

    test.each([
      ["micro", Duration.micros(1n)],
      ["micros", Duration.micros(1n)],
      ["nano", Duration.nanos(1n)],
      ["nanos", Duration.nanos(1n)],
    ] as const)("rejects a fractional callback result in %s", (unit, input) => {
      expect(() => mapAsUnit(input, unit, (n) => n / 2)).toThrow(RangeError);
    });

    test.each(["micro", "micros"] as const)(
      "rejects a fractional input count in %s",
      (unit) => {
        const map = vi.fn((n: number) => n);

        expect(() => mapAsUnit(Duration.nanos(1500n), unit, map)).toThrow(
          RangeError,
        );
        expect(map).toHaveBeenCalledWith(1.5);
      },
    );

    test.each(["micro", "micros"] as const)(
      "passes infinity to the %s callback but requires a finite integer result",
      (unit) => {
        const map = vi.fn((n: number) => n);

        expect(() => mapAsUnit(Duration.infinity, unit, map)).toThrow(
          RangeError,
        );
        expect(map).toHaveBeenCalledWith(Infinity);
        expect(mapAsUnit(Duration.infinity, unit, () => 0)).toStrictEqual(
          Duration.zero,
        );
      },
    );

    test.each(["nano", "nanos"] as const)(
      "rejects an unsafe finite count in %s before calling the callback",
      (unit) => {
        const map = vi.fn((n: number) => n);

        expect(() =>
          mapAsUnit(
            Duration.nanos(BigInt(globalThis.Number.MAX_SAFE_INTEGER) + 1n),
            unit,
            map,
          ),
        ).toThrow("Value 9007199254740992 is outside safe integer range");
        expect(map).not.toHaveBeenCalled();
      },
    );

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

    test.each(["nano", "nanos"] as const)(
      "throws converting an infinite duration to %s before calling the callback",
      (unit) => {
        const map = vi.fn((n: number) => n);

        expect(() => mapAsUnit(Duration.infinity, unit, map)).toThrow(
          "Duration.toNanos returned None",
        );
        expect(map).not.toHaveBeenCalled();
      },
    );
  });
});
