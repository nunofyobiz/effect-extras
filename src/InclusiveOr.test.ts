import { Array, pipe } from "effect";
import { describe, expect, test } from "vitest";
import * as InclusiveOr from "./InclusiveOr.js";

describe("InclusiveOr", () => {
  describe("LeftOnly", () => {
    test.todo("this function");
  });

  describe("RightOnly", () => {
    test.todo("this function");
  });

  describe("LeftAndRight", () => {
    test.todo("this function");
  });

  describe("is", () => {
    test.todo("this function");
  });

  describe("match", () => {
    test.todo("this function");
  });

  describe("WithLeft", () => {
    test.todo("this function");
  });

  describe("WithRight", () => {
    test.todo("this function");
  });

  describe("optionFromNullables", () => {
    test.todo("this function");
  });

  describe("fromNullables", () => {
    test.todo("this function");
  });

  describe("matchLeft", () => {
    test.todo("this function");
  });

  describe("matchRight", () => {
    test.todo("this function");
  });

  describe("orElse", () => {
    test.todo("this function");
  });

  describe("orUndefined", () => {
    test.todo("this function");
  });

  describe("leftOrElse", () => {
    test.todo("this function");
  });

  describe("leftOrUndefined", () => {
    test.todo("this function");
  });

  describe("rightOrElse", () => {
    test.todo("this function");
  });

  describe("rightOrUndefined", () => {
    test.todo("this function");
  });

  describe("rightOption", () => {
    test.todo("this function");
  });

  describe("leftOption", () => {
    test.todo("this function");
  });

  describe("mapBoth", () => {
    test.todo("this function");
  });

  describe("mapBothEffect", () => {
    test.todo("this function");
  });

  describe("mapLeft", () => {
    test.todo("this function");
  });

  describe("flatMapLeft", () => {
    test.todo("this function");
  });

  describe("mapLeftEffect", () => {
    test.todo("this function");
  });

  describe("flatMapLeftEffect", () => {
    test.todo("this function");
  });

  describe("mapRight", () => {
    test.todo("this function");
  });

  describe("flatMapRight", () => {
    test.todo("this function");
  });

  describe("mapRightEffect", () => {
    test.todo("this function");
  });

  describe("flatMapRightEffect", () => {
    test.todo("this function");
  });

  describe("zip", () => {
    const describeInclusiveOr = (
      inclusiveOr: InclusiveOr.InclusiveOr<number, number>,
    ): string =>
      InclusiveOr.match(inclusiveOr, {
        LeftOnly: ({ left }) => `Left ${left}`,
        RightOnly: ({ right }) => `Right ${right}`,
        LeftAndRight: ({ left, right }) => `Left ${left} and Right ${right}`,
      });

    test("same length", () => {
      expect(
        InclusiveOr.zip([1, 2, 3], [4, 5, 6], describeInclusiveOr),
      ).toStrictEqual([
        "Left 1 and Right 4",
        "Left 2 and Right 5",
        "Left 3 and Right 6",
      ]);
    });

    test("longer first array", () => {
      expect(
        InclusiveOr.zip([1, 2, 3, 4], [4, 5, 6], describeInclusiveOr),
      ).toStrictEqual([
        "Left 1 and Right 4",
        "Left 2 and Right 5",
        "Left 3 and Right 6",
        "Left 4",
      ]);
    });

    test("longer second array", () => {
      expect(
        InclusiveOr.zip([1, 2, 3], [4, 5, 6, 7], describeInclusiveOr),
      ).toStrictEqual([
        "Left 1 and Right 4",
        "Left 2 and Right 5",
        "Left 3 and Right 6",
        "Right 7",
      ]);
    });

    test("empty first array", () => {
      expect(
        InclusiveOr.zip(Array.empty<number>(), [4, 5, 6], describeInclusiveOr),
      ).toStrictEqual(["Right 4", "Right 5", "Right 6"]);
    });

    test("empty second array", () => {
      expect(
        InclusiveOr.zip([1, 2, 3], Array.empty<number>(), describeInclusiveOr),
      ).toStrictEqual(["Left 1", "Left 2", "Left 3"]);
    });

    test("empty both arrays", () => {
      expect(
        InclusiveOr.zip(
          Array.empty<number>(),
          Array.empty<number>(),
          describeInclusiveOr,
        ),
      ).toStrictEqual([]);
    });

    test("data-last (pipeable)", () => {
      expect(
        pipe([1, 2, 3, 4], InclusiveOr.zip([4, 5, 6], describeInclusiveOr)),
      ).toStrictEqual([
        "Left 1 and Right 4",
        "Left 2 and Right 5",
        "Left 3 and Right 6",
        "Left 4",
      ]);
    });
  });
});
