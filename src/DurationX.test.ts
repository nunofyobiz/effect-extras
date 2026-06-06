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
  });
});
