import { Array, Effect, Equal, Hash, Option, Result, pipe } from "effect";
import { it } from "@effect/vitest";
import { describe, expect, test } from "vitest";
import * as InclusiveOr from "./InclusiveOr.js";

describe("InclusiveOr", () => {
  describe("LeftOnly", () => {
    test.todo("this function");

    test("builds the left-only tagged value", () => {
      expect(InclusiveOr.LeftOnly({ left: 1 })).toStrictEqual({
        _tag: "LeftOnly",
        left: 1,
      });
    });
  });

  describe("RightOnly", () => {
    test.todo("this function");

    test("builds the right-only tagged value", () => {
      expect(InclusiveOr.RightOnly({ right: "r" })).toStrictEqual({
        _tag: "RightOnly",
        right: "r",
      });
    });
  });

  describe("LeftAndRight", () => {
    test.todo("this function");

    test("builds the both-sides tagged value with structural equality", () => {
      const value = InclusiveOr.LeftAndRight({ left: 1, right: "r" });
      expect(value).toStrictEqual({
        _tag: "LeftAndRight",
        left: 1,
        right: "r",
      });
      expect(
        Equal.equals(value, InclusiveOr.LeftAndRight({ left: 1, right: "r" })),
      ).toBe(true);
      expect(Hash.hash(value)).toBe(
        Hash.hash(InclusiveOr.LeftAndRight({ left: 1, right: "r" })),
      );
    });
  });

  describe("is", () => {
    test.todo("this function");

    test("refines all three tags", () => {
      expect(
        InclusiveOr.is("LeftOnly")(InclusiveOr.LeftOnly({ left: 1 })),
      ).toBe(true);
      expect(
        InclusiveOr.is("RightOnly")(InclusiveOr.RightOnly({ right: 1 })),
      ).toBe(true);
      expect(
        InclusiveOr.is("LeftAndRight")(
          InclusiveOr.LeftAndRight({ left: 1, right: 1 }),
        ),
      ).toBe(true);
    });
  });

  describe("match", () => {
    test.todo("this function");

    test("routes every tag", () => {
      const fold = InclusiveOr.match({
        LeftOnly: () => "left",
        RightOnly: () => "right",
        LeftAndRight: () => "both",
      });
      expect([
        fold(InclusiveOr.LeftOnly({ left: 1 })),
        fold(InclusiveOr.RightOnly({ right: 1 })),
        fold(InclusiveOr.LeftAndRight({ left: 1, right: 1 })),
      ]).toStrictEqual(["left", "right", "both"]);
    });
  });

  describe("WithLeft", () => {
    test.todo("this function");

    test("narrows to a left-carrying variant", () => {
      const value: InclusiveOr.WithLeft<number, string> = InclusiveOr.WithLeft({
        left: 1,
      });
      expect(value.left).toBe(1);
    });

    test("treats a null right as absent", () => {
      expect(InclusiveOr.WithLeft({ left: 1, right: null })).toStrictEqual(
        InclusiveOr.LeftOnly({ left: 1 }),
      );
    });
  });

  describe("WithRight", () => {
    test.todo("this function");

    test("narrows to a right-carrying variant", () => {
      const value: InclusiveOr.WithRight<number, string> =
        InclusiveOr.WithRight({ right: "r" });
      expect(value.right).toBe("r");
    });

    test("treats a null left as absent", () => {
      expect(
        InclusiveOr.WithRight({ left: null, right: "right" }),
      ).toStrictEqual(InclusiveOr.RightOnly({ right: "right" }));
    });
  });

  describe("optionFromNullables", () => {
    test.todo("this function");

    test("preserves all present combinations and none", () => {
      expect(
        InclusiveOr.optionFromNullables({ left: 1, right: "r" }),
      ).toStrictEqual(
        Option.some(InclusiveOr.LeftAndRight({ left: 1, right: "r" })),
      );
      expect(InclusiveOr.optionFromNullables({ left: 1 })).toStrictEqual(
        Option.some(InclusiveOr.LeftOnly({ left: 1 })),
      );
      expect(InclusiveOr.optionFromNullables({ right: "r" })).toStrictEqual(
        Option.some(InclusiveOr.RightOnly({ right: "r" })),
      );
      expect(InclusiveOr.optionFromNullables({})).toStrictEqual(Option.none());
    });
  });

  describe("fromNullables", () => {
    test.todo("this function");

    test("uses its fallback only when both values are absent", () => {
      expect(
        InclusiveOr.fromNullables({
          left: null,
          right: undefined,
          orElse: () => InclusiveOr.RightOnly({ right: "fallback" }),
        }),
      ).toStrictEqual(InclusiveOr.RightOnly({ right: "fallback" }));
    });

    test("keeps its default error when both values are nullish", () => {
      expect(() =>
        InclusiveOr.fromNullables({ left: null, right: undefined }),
      ).toThrow("Both left and right are nullable");
    });
  });

  describe("matchLeft", () => {
    test.todo("this function");

    test("uses the left handler whenever a left is present", () => {
      const fold = InclusiveOr.matchLeft({
        Left: (left: number) => left,
        RightOnly: () => 0,
      });
      expect([
        fold(InclusiveOr.LeftOnly({ left: 1 })),
        fold(InclusiveOr.RightOnly({ right: "r" })),
        fold(InclusiveOr.LeftAndRight({ left: 2, right: "r" })),
      ]).toStrictEqual([1, 0, 2]);
    });
  });

  describe("matchRight", () => {
    test.todo("this function");

    test("uses the right handler whenever a right is present", () => {
      const fold = InclusiveOr.matchRight({
        LeftOnly: () => "none",
        Right: (right: string) => right,
      });
      expect([
        fold(InclusiveOr.LeftOnly({ left: 1 })),
        fold(InclusiveOr.RightOnly({ right: "r" })),
        fold(InclusiveOr.LeftAndRight({ left: 2, right: "b" })),
      ]).toStrictEqual(["none", "r", "b"]);
    });
  });

  describe("orElse", () => {
    test.todo("this function");

    test("returns a narrowed both-sides value", () => {
      const complete = InclusiveOr.orElse({
        orElseLeft: () => 0,
        orElseRight: () => "r",
      });
      const value: InclusiveOr.LeftAndRight<number, string> = complete(
        InclusiveOr.LeftOnly({ left: 1 }),
      );
      expect(value).toStrictEqual(
        InclusiveOr.LeftAndRight({ left: 1, right: "r" }),
      );
    });
  });

  describe("orUndefined", () => {
    test.todo("this function");

    test("uses undefined for missing sides", () => {
      expect(
        InclusiveOr.orUndefined(InclusiveOr.LeftOnly({ left: 1 })),
      ).toStrictEqual(InclusiveOr.LeftAndRight({ left: 1, right: undefined }));
    });
  });

  describe("leftOrElse", () => {
    test.todo("this function");

    test("returns left or the fallback", () => {
      const get = InclusiveOr.leftOrElse(() => 0);
      expect([
        get(InclusiveOr.LeftOnly({ left: 1 })),
        get(InclusiveOr.RightOnly({ right: "r" })),
        get(InclusiveOr.LeftAndRight({ left: 2, right: "r" })),
      ]).toStrictEqual([1, 0, 2]);
    });
  });

  describe("leftOrUndefined", () => {
    test.todo("this function");

    test("returns undefined without a left", () => {
      expect(
        InclusiveOr.leftOrUndefined(InclusiveOr.RightOnly({ right: "r" })),
      ).toBeUndefined();
    });
  });

  describe("rightOrElse", () => {
    test.todo("this function");

    test("returns right or the fallback", () => {
      const get = InclusiveOr.rightOrElse(() => "fallback");
      expect([
        get(InclusiveOr.LeftOnly({ left: 1 })),
        get(InclusiveOr.RightOnly({ right: "r" })),
        get(InclusiveOr.LeftAndRight({ left: 2, right: "b" })),
      ]).toStrictEqual(["fallback", "r", "b"]);
    });
  });

  describe("rightOrUndefined", () => {
    test.todo("this function");

    test("returns undefined without a right", () => {
      expect(
        InclusiveOr.rightOrUndefined(InclusiveOr.LeftOnly({ left: 1 })),
      ).toBeUndefined();
    });
  });

  describe("rightOption", () => {
    test.todo("this function");

    test("projects the right side", () => {
      expect(
        InclusiveOr.rightOption(InclusiveOr.LeftOnly({ left: 1 })),
      ).toStrictEqual(Option.none());
      expect(
        InclusiveOr.rightOption(
          InclusiveOr.LeftAndRight({ left: 1, right: "r" }),
        ),
      ).toStrictEqual(Option.some("r"));
    });
  });

  describe("leftOption", () => {
    test.todo("this function");

    test("projects the left side", () => {
      expect(
        InclusiveOr.leftOption(InclusiveOr.RightOnly({ right: "r" })),
      ).toStrictEqual(Option.none());
      expect(
        InclusiveOr.leftOption(
          InclusiveOr.LeftAndRight({ left: 1, right: "r" }),
        ),
      ).toStrictEqual(Option.some(1));
    });
  });

  describe("mapBoth", () => {
    test.todo("this function");

    test("maps every present side", () => {
      const map = InclusiveOr.mapBoth({
        mapLeft: (left: number) => left + 1,
        mapRight: (right: string) => right.toUpperCase(),
      });
      expect([
        map(InclusiveOr.LeftOnly({ left: 1 })),
        map(InclusiveOr.RightOnly({ right: "r" })),
        map(InclusiveOr.LeftAndRight({ left: 1, right: "r" })),
      ]).toStrictEqual([
        InclusiveOr.LeftOnly({ left: 2 }),
        InclusiveOr.RightOnly({ right: "R" }),
        InclusiveOr.LeftAndRight({ left: 2, right: "R" }),
      ]);
    });
  });

  describe("mapBothEffect", () => {
    test.todo("this function");

    test("maps all three variants", () => {
      const map = InclusiveOr.mapBothEffect({
        mapLeft: (left: number) => Effect.succeed(left + 1),
        mapRight: (right: string) => Effect.succeed(right.toUpperCase()),
      });
      expect([
        Effect.runSync(map(InclusiveOr.LeftOnly({ left: 1 }))),
        Effect.runSync(map(InclusiveOr.RightOnly({ right: "r" }))),
        Effect.runSync(map(InclusiveOr.LeftAndRight({ left: 1, right: "r" }))),
      ]).toStrictEqual([
        InclusiveOr.LeftOnly({ left: 2 }),
        InclusiveOr.RightOnly({ right: "R" }),
        InclusiveOr.LeftAndRight({ left: 2, right: "R" }),
      ]);
    });

    it.effect("propagates failures from either mapper", () =>
      Effect.gen(function* () {
        const failLeft = InclusiveOr.mapBothEffect({
          mapLeft: () => Effect.fail("left"),
          mapRight: (right: string) => Effect.succeed(right),
        });
        const leftResult = yield* failLeft(
          InclusiveOr.LeftOnly({ left: 1 }),
        ).pipe(Effect.result);
        expect(leftResult).toStrictEqual(Result.fail("left"));
      }),
    );

    test("runs the left effect before the right effect", () => {
      const order: string[] = [];
      const result = Effect.runSync(
        InclusiveOr.mapBothEffect({
          mapLeft: (left: number) =>
            Effect.sync(() => {
              order.push("left");
              return left;
            }),
          mapRight: (right: string) =>
            Effect.sync(() => {
              order.push("right");
              return right;
            }),
        })(InclusiveOr.LeftAndRight({ left: 1, right: "right" })),
      );

      expect(result).toStrictEqual(
        InclusiveOr.LeftAndRight({ left: 1, right: "right" }),
      );
      expect(order).toStrictEqual(["left", "right"]);
    });
  });

  describe("mapLeft", () => {
    test.todo("this function");

    test("maps present left values only", () => {
      const map = InclusiveOr.mapLeft((left: number) => left + 1);
      expect([
        map(InclusiveOr.LeftOnly({ left: 1 })),
        map(InclusiveOr.RightOnly({ right: "r" })),
        map(InclusiveOr.LeftAndRight({ left: 1, right: "r" })),
      ]).toStrictEqual([
        InclusiveOr.LeftOnly({ left: 2 }),
        InclusiveOr.RightOnly({ right: "r" }),
        InclusiveOr.LeftAndRight({ left: 2, right: "r" }),
      ]);
    });
  });

  describe("flatMapLeft", () => {
    test.todo("this function");

    test("flattens left mappings and passes right-only through", () => {
      const chain = InclusiveOr.flatMapLeft((left: number) =>
        InclusiveOr.LeftAndRight({ left: left + 1, right: "mapped" }),
      );
      expect(chain(InclusiveOr.RightOnly({ right: "original" }))).toStrictEqual(
        InclusiveOr.RightOnly({ right: "original" }),
      );
      expect(
        chain(InclusiveOr.LeftAndRight({ left: 1, right: "discarded" })),
      ).toStrictEqual(InclusiveOr.LeftAndRight({ left: 2, right: "mapped" }));
    });
  });

  describe("mapLeftEffect", () => {
    test.todo("this function");

    test("maps left values in effects", () => {
      const map = InclusiveOr.mapLeftEffect((left: number) =>
        Effect.succeed(left + 1),
      );
      expect(
        Effect.runSync(map(InclusiveOr.LeftAndRight({ left: 1, right: "r" }))),
      ).toStrictEqual(InclusiveOr.LeftAndRight({ left: 2, right: "r" }));
    });
  });

  describe("flatMapLeftEffect", () => {
    test.todo("this function");

    test("flattens effectful left mappings", () => {
      const chain = InclusiveOr.flatMapLeftEffect((left: number) =>
        Effect.succeed(
          InclusiveOr.LeftAndRight({ left: left + 1, right: "mapped" }),
        ),
      );
      expect(
        Effect.runSync(chain(InclusiveOr.LeftOnly({ left: 1 }))),
      ).toStrictEqual(InclusiveOr.LeftAndRight({ left: 2, right: "mapped" }));
    });
  });

  describe("mapRight", () => {
    test.todo("this function");

    test("maps present right values only", () => {
      const map = InclusiveOr.mapRight((right: string) => right.toUpperCase());
      expect([
        map(InclusiveOr.LeftOnly({ left: 1 })),
        map(InclusiveOr.RightOnly({ right: "r" })),
        map(InclusiveOr.LeftAndRight({ left: 1, right: "r" })),
      ]).toStrictEqual([
        InclusiveOr.LeftOnly({ left: 1 }),
        InclusiveOr.RightOnly({ right: "R" }),
        InclusiveOr.LeftAndRight({ left: 1, right: "R" }),
      ]);
    });
  });

  describe("flatMapRight", () => {
    test.todo("this function");

    test("flattens right mappings and passes left-only through", () => {
      const chain = InclusiveOr.flatMapRight((right: string) =>
        InclusiveOr.LeftAndRight({
          left: "mapped",
          right: right.toUpperCase(),
        }),
      );
      expect(chain(InclusiveOr.LeftOnly({ left: 1 }))).toStrictEqual(
        InclusiveOr.LeftOnly({ left: 1 }),
      );
      expect(
        chain(InclusiveOr.LeftAndRight({ left: 1, right: "r" })),
      ).toStrictEqual(InclusiveOr.LeftAndRight({ left: "mapped", right: "R" }));
    });
  });

  describe("mapRightEffect", () => {
    test.todo("this function");

    test("maps right values in effects", () => {
      const map = InclusiveOr.mapRightEffect((right: string) =>
        Effect.succeed(right.toUpperCase()),
      );
      expect(
        Effect.runSync(map(InclusiveOr.LeftAndRight({ left: 1, right: "r" }))),
      ).toStrictEqual(InclusiveOr.LeftAndRight({ left: 1, right: "R" }));
    });
  });

  describe("flatMapRightEffect", () => {
    test.todo("this function");

    test("flattens effectful right mappings", () => {
      const chain = InclusiveOr.flatMapRightEffect((right: string) =>
        Effect.succeed(
          InclusiveOr.LeftAndRight({
            left: "mapped",
            right: right.toUpperCase(),
          }),
        ),
      );
      expect(
        Effect.runSync(chain(InclusiveOr.RightOnly({ right: "r" }))),
      ).toStrictEqual(InclusiveOr.LeftAndRight({ left: "mapped", right: "R" }));
    });
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

    test("keeps an explicit undefined element as present", () => {
      expect(
        InclusiveOr.zip([undefined], ["right"], (inclusiveOr) => inclusiveOr),
      ).toStrictEqual([
        InclusiveOr.LeftAndRight({ left: undefined, right: "right" }),
      ]);
    });
  });

  test("constructors retain structural Equal and Hash behavior", () => {
    const left = InclusiveOr.LeftOnly({ left: 1 });
    const right = InclusiveOr.RightOnly({ right: "right" });
    const both = InclusiveOr.LeftAndRight({ left: 1, right: "right" });

    expect(Equal.equals(left, InclusiveOr.LeftOnly({ left: 1 }))).toBe(true);
    expect(Equal.equals(right, InclusiveOr.RightOnly({ right: "right" }))).toBe(
      true,
    );
    expect(
      Equal.equals(both, InclusiveOr.LeftAndRight({ left: 1, right: "right" })),
    ).toBe(true);
    expect(Hash.hash(both)).toBe(
      Hash.hash(InclusiveOr.LeftAndRight({ left: 1, right: "right" })),
    );
  });
});
