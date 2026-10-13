import {
  Equal,
  Equivalence,
  Match,
  Option,
  Order,
  Predicate,
  pipe,
} from "effect";
import { describe, expect, expectTypeOf, test, vi } from "vitest";
import {
  categorize,
  chunkBy,
  compactNullable,
  filterHead,
  filterMapNullable,
  filterTail,
  findFirstWithIndex2d,
  insertUniq,
  mapRightAccum,
  maxOption,
  slice,
  takeFirstWhere,
  takeLastWhere,
} from "./ArrayX.js";

describe("Array utils", () => {
  describe("slice", () => {
    test.each([
      { input: ["Amira"], start: 0, end: 1, expected: ["Amira"] },
      {
        input: ["Amira", "Ben", "Chloe"],
        start: 0,
        end: 1,
        expected: ["Amira"],
      },
      {
        input: ["Amira", "Ben", "Chloe"],
        start: 2,
        end: 3,
        expected: ["Chloe"],
      },
      { input: ["Amira", "Ben", "Chloe"], start: 2, end: 1, expected: [] },
      {
        input: ["Amira", "Ben", "Chloe"],
        start: -2,
        end: -1,
        expected: ["Ben"],
      },
      {
        input: ["Amira", "Ben", "Chloe"],
        start: -10,
        end: 10,
        expected: ["Amira", "Ben", "Chloe"],
      },
      { input: ["Amira", "Ben", "Chloe"], start: 10, end: 20, expected: [] },
      { input: ["Amira", "Ben", "Chloe"], start: 0, end: -10, expected: [] },
      {
        input: ["Amira", "Ben", "Chloe"],
        start: 1.9,
        end: 2.9,
        expected: ["Ben"],
      },
      {
        input: ["Amira", "Ben", "Chloe"],
        start: -2.9,
        end: -1.9,
        expected: ["Ben"],
      },
      {
        input: ["Amira", "Ben", "Chloe"],
        start: Number.NaN,
        end: 1,
        expected: ["Amira"],
      },
      {
        input: ["Amira", "Ben", "Chloe"],
        start: 0,
        end: Number.NaN,
        expected: [],
      },
      {
        input: ["Amira", "Ben", "Chloe"],
        start: Number.NEGATIVE_INFINITY,
        end: Number.POSITIVE_INFINITY,
        expected: ["Amira", "Ben", "Chloe"],
      },
      {
        input: ["Amira"],
        start: Number.POSITIVE_INFINITY,
        end: Number.POSITIVE_INFINITY,
        expected: [],
      },
      {
        input: ["Amira"],
        start: 0,
        end: Number.NEGATIVE_INFINITY,
        expected: [],
      },
    ])("bounds $start to $end on $input", ({ input, start, end, expected }) => {
      expect(slice(input, start, end)).toStrictEqual(expected);
    });

    test("data-first and data-last agree", () => {
      const guests = ["Amira", "Ben", "Chloe"];
      const direct = slice(guests, 1, 3);
      const piped = pipe(guests, slice(1, 3));
      expect(direct).toStrictEqual(["Ben", "Chloe"]);
      expect(piped).toStrictEqual(direct);
    });

    test("copies the array while sharing its elements", () => {
      const guest = { name: "Amira" };
      const input = [guest];
      const result = slice(input, 0, 1);
      expect(result).toStrictEqual([guest]);
      expect(result).not.toBe(input);
      expect(result[0]).toBe(guest);
      // The original array is unchanged.
      expect(input).toStrictEqual([guest]);
    });

    test.each([null, undefined])("rejects a nullish array: %s", (input) => {
      expect(() =>
        // @ts-expect-error - nullish input is not an array
        slice(input, 0, 1),
      ).toThrow(TypeError);
    });

    test("empty array", () => {
      expect(slice([], 0, 0)).toStrictEqual([]);
    });

    test("slice from start to end", () => {
      expect(slice([1, 2, 3, 4, 5], 0, 5)).toStrictEqual([1, 2, 3, 4, 5]);
    });

    test("slice from middle", () => {
      expect(slice([1, 2, 3, 4, 5], 1, 4)).toStrictEqual([2, 3, 4]);
    });

    test("slice empty range", () => {
      expect(slice([1, 2, 3, 4, 5], 2, 2)).toStrictEqual([]);
    });

    test("slice with end beyond array length", () => {
      expect(slice([1, 2, 3, 4, 5], 2, 10)).toStrictEqual([3, 4, 5]);
    });

    test("returns a new reference (non-mutating)", () => {
      const input = [1, 2, 3, 4, 5];
      const result = slice(input, 0, 5);
      expect(result).not.toBe(input);
      expect(input).toStrictEqual([1, 2, 3, 4, 5]);
    });

    test("data-last form composes with pipe", () => {
      expect(pipe([1, 2, 3, 4, 5], slice(1, 4))).toStrictEqual([2, 3, 4]);
    });
  });

  describe("insertUniq", () => {
    test.each([
      {
        input: ["bread"],
        item: "bread",
        destination: null,
        expected: ["bread"],
      },
      {
        input: ["bread"],
        item: "milk",
        destination: "bread",
        expected: ["milk", "bread"],
      },
      {
        input: ["bread"],
        item: "milk",
        destination: "missing",
        expected: ["bread", "milk"],
      },
      { input: [], item: "milk", destination: "bread", expected: ["milk"] },
      {
        input: ["bread", "milk", "bread", "coffee"],
        item: "bread",
        destination: "coffee",
        expected: ["milk", "bread", "coffee"],
      },
      {
        input: ["bread", "milk", "bread"],
        item: "bread",
        destination: "missing",
        expected: ["milk", "bread"],
      },
      {
        input: ["milk", "coffee", "milk"],
        item: "bread",
        destination: "milk",
        expected: ["bread", "milk", "coffee", "milk"],
      },
    ])(
      "places $item before $destination on $input",
      ({ input, item, destination, expected }) => {
        expect(
          insertUniq(input, { item, insertToBeLeftOf: destination }),
        ).toStrictEqual(expected);
      },
    );

    test("strict equality keeps NaN copies and never finds a NaN destination", () => {
      expect(
        insertUniq([Number.NaN, 1, Number.NaN], {
          item: Number.NaN,
          insertToBeLeftOf: 1,
        }),
      ).toStrictEqual([Number.NaN, Number.NaN, 1, Number.NaN]);
      expect(
        insertUniq([Number.NaN, 1], { item: 2, insertToBeLeftOf: Number.NaN }),
      ).toStrictEqual([Number.NaN, 1, 2]);
    });

    test("strict equality treats signed zeros alike but distinguishes strings and numbers", () => {
      expect(
        insertUniq([-0, 1, 0], { item: 0, insertToBeLeftOf: 1 }),
      ).toStrictEqual([0, 1]);
      expect(
        insertUniq([0, 1], { item: 2, insertToBeLeftOf: -0 }),
      ).toStrictEqual([2, 0, 1]);
      expect(
        insertUniq<string | number>(["1", 1, "milk"], {
          item: 1,
          insertToBeLeftOf: "1",
        }),
      ).toStrictEqual([1, "1", "milk"]);
    });

    test("data-first and data-last agree, with a fresh result even when unchanged", () => {
      const input = ["bread"];
      const config = { item: "bread", insertToBeLeftOf: null };
      const direct = insertUniq(input, config);
      const piped = pipe(input, insertUniq(config));
      expect(direct).toStrictEqual(["bread"]);
      expect(piped).toStrictEqual(direct);
      expect(direct).not.toBe(input);
    });

    test.each([null, undefined])(
      "rejects a nullish array or configuration: %s",
      (input) => {
        expect(() =>
          // @ts-expect-error - nullish input is not an array
          insertUniq(input, { item: "bread", insertToBeLeftOf: null }),
        ).toThrow(TypeError);
        expect(() =>
          // @ts-expect-error - nullish configuration cannot be destructured
          insertUniq([], input),
        ).toThrow(TypeError);
      },
    );

    test("missing configuration fields append their runtime item value", () => {
      // @ts-expect-error - configuration is missing the required item
      expect(insertUniq(["bread"], { insertToBeLeftOf: null })).toStrictEqual([
        "bread",
        undefined,
      ]);
      // @ts-expect-error - configuration is missing the required destination
      expect(insertUniq(["bread"], { item: "milk" })).toStrictEqual([
        "bread",
        "milk",
      ]);
    });

    test("insert existing (first) to first", () => {
      expect(
        insertUniq(["a", "b", "c", "d"], {
          item: "a",
          insertToBeLeftOf: "b",
        }),
      ).toStrictEqual(["a", "b", "c", "d"]);
    });

    test("insert existing (first) to middle", () => {
      expect(
        insertUniq(["a", "b", "c", "d"], {
          item: "a",
          insertToBeLeftOf: "c",
        }),
      ).toStrictEqual(["b", "a", "c", "d"]);
    });

    test("insert existing (first) to end", () => {
      expect(
        insertUniq(["a", "b", "c", "d"], {
          item: "a",
          insertToBeLeftOf: null,
        }),
      ).toStrictEqual(["b", "c", "d", "a"]);
    });

    test("insert existing (first) to not-found", () => {
      expect(
        insertUniq(["a", "b", "c", "d"], {
          item: "a",
          insertToBeLeftOf: "not-found",
        }),
      ).toStrictEqual(["b", "c", "d", "a"]); // Moved to end
    });

    test("insert existing (middle) to first", () => {
      expect(
        insertUniq(["a", "b", "c", "d"], {
          item: "c",
          insertToBeLeftOf: "a",
        }),
      ).toStrictEqual(["c", "a", "b", "d"]);
    });

    test("insert existing (middle) to middle", () => {
      expect(
        insertUniq(["a", "b", "c", "d"], {
          item: "c",
          insertToBeLeftOf: "b",
        }),
      ).toStrictEqual(["a", "c", "b", "d"]);
    });

    test("insert existing (middle) to last", () => {
      expect(
        insertUniq(["a", "b", "c", "d"], {
          item: "b",
          insertToBeLeftOf: null,
        }),
      ).toStrictEqual(["a", "c", "d", "b"]);
    });

    test("insert existing (middle) to not-found", () => {
      expect(
        insertUniq(["a", "b", "c", "d"], {
          item: "b",
          insertToBeLeftOf: "not-found",
        }),
      ).toStrictEqual(["a", "c", "d", "b"]); // Moved to end
    });

    test("insert existing (last) to first", () => {
      expect(
        insertUniq(["a", "b", "c", "d"], {
          item: "d",
          insertToBeLeftOf: "a",
        }),
      ).toStrictEqual(["d", "a", "b", "c"]);
    });

    test("insert existing (last) to middle", () => {
      expect(
        insertUniq(["a", "b", "c", "d"], {
          item: "d",
          insertToBeLeftOf: "c",
        }),
      ).toStrictEqual(["a", "b", "d", "c"]);
    });

    test("insert existing (last) to last", () => {
      expect(
        insertUniq(["a", "b", "c", "d"], {
          item: "d",
          insertToBeLeftOf: null,
        }),
      ).toStrictEqual(["a", "b", "c", "d"]);
    });

    test("insert existing (last) to not-found", () => {
      expect(
        insertUniq(["a", "b", "c", "d"], {
          item: "d",
          insertToBeLeftOf: "not-found",
        }),
      ).toStrictEqual(["a", "b", "c", "d"]); // Already at end
    });

    test("insertToBeLeftOf equal to item: dedupes and moves item to the end", () => {
      expect(
        insertUniq(["a", "b", "a", "c"], {
          item: "a",
          insertToBeLeftOf: "a",
        }),
      ).toStrictEqual(["b", "c", "a"]);
    });

    test("empty array", () => {
      expect(
        insertUniq([], { item: "a", insertToBeLeftOf: null }),
      ).toStrictEqual(["a"]);
    });

    test("input array is left unmutated", () => {
      const input = ["a", "b", "c", "d"];
      const output = insertUniq(input, { item: "a", insertToBeLeftOf: "c" });
      expect(output).toStrictEqual(["b", "a", "c", "d"]);
      // Re-asserting on `input` (not `output`) confirms the original array
      // was never mutated in place.
      expect(input).toStrictEqual(["a", "b", "c", "d"]);
    });

    test("returns a fresh reference", () => {
      const input = ["a", "b", "c", "d"];
      const result = insertUniq(input, { item: "a", insertToBeLeftOf: "c" });
      expect(result).not.toBe(input);
    });

    test("insert new to first", () => {
      expect(
        insertUniq(["a", "b", "c", "d"], {
          item: "new",
          insertToBeLeftOf: "a",
        }),
      ).toStrictEqual(["new", "a", "b", "c", "d"]);
    });

    test("insert new to middle", () => {
      expect(
        insertUniq(["a", "b", "c", "d"], {
          item: "new",
          insertToBeLeftOf: "c",
        }),
      ).toStrictEqual(["a", "b", "new", "c", "d"]);
    });

    test("insert new to end", () => {
      expect(
        insertUniq(["a", "b", "c", "d"], {
          item: "new",
          insertToBeLeftOf: null,
        }),
      ).toStrictEqual(["a", "b", "c", "d", "new"]);
    });

    test("insert new to not-found", () => {
      expect(
        insertUniq(["a", "b", "c", "d"], {
          item: "new",
          insertToBeLeftOf: "not-found",
        }),
      ).toStrictEqual(["a", "b", "c", "d", "new"]);
    });
  });

  describe("mapRightAccum", () => {
    test("empty input keeps the initial accumulator and never invokes the callback", () => {
      const initial = { minutes: 0 };
      const callback = vi.fn(
        (
          total: { minutes: number },
          track: string,
        ): [{ minutes: number }, string] => [total, track],
      );
      const result = mapRightAccum([], initial, callback);
      expect(result).toStrictEqual([initial, []]);
      expect(result[0]).toBe(initial);
      expect(callback).not.toHaveBeenCalled();
    });

    test("singleton input updates the accumulator once at index zero", () => {
      const callback = vi.fn(
        (total: number, minutes: number, index: number): [number, number] => [
          total + minutes,
          index,
        ],
      );
      expect(mapRightAccum([3], 2, callback)).toStrictEqual([5, [0]]);
      expect(callback.mock.calls).toStrictEqual([[2, 3, 0]]);
    });

    test("traverses right to left with traversal indices and restores output order", () => {
      const input = [3, 4, 2];
      const callback = vi.fn(
        (
          total: number,
          minutes: number,
          index: number,
        ): [number, { remaining: number; index: number }] => [
          total + minutes,
          { remaining: total + minutes, index },
        ],
      );
      const result = mapRightAccum(input, 0, callback);
      expect(result).toStrictEqual([
        9,
        [
          { remaining: 9, index: 2 },
          { remaining: 6, index: 1 },
          { remaining: 2, index: 0 },
        ],
      ]);
      expect(callback.mock.calls).toStrictEqual([
        [0, 2, 0],
        [2, 4, 1],
        [6, 3, 2],
      ]);
      // Re-assert on the original input to prove it was not reversed in place.
      expect(input).toStrictEqual([3, 4, 2]);
    });

    test("data-first and data-last agree", () => {
      const input = [3, 4, 2];
      const callback = (total: number, minutes: number): [number, number] => [
        total + minutes,
        total + minutes,
      ];
      const direct = mapRightAccum(input, 0, callback);
      const piped = pipe(input, mapRightAccum(0, callback));
      expect(direct).toStrictEqual([9, [9, 6, 2]]);
      expect(piped).toStrictEqual(direct);
    });

    test.each([null, undefined])(
      "rejects nullish arrays and bypasses nullish callbacks only on empty input: %s",
      (input) => {
        expect(() =>
          // @ts-expect-error - nullish input is not an array
          mapRightAccum(input, 0, (total, minutes: number) => [
            total + minutes,
            minutes,
          ]),
        ).toThrow(TypeError);
        expect(() =>
          // @ts-expect-error - nullish callback cannot map an element
          mapRightAccum([3], 0, input),
        ).toThrow(TypeError);
        // @ts-expect-error - empty input bypasses the nullish callback
        expect(mapRightAccum([], 0, input)).toStrictEqual([0, []]);
      },
    );

    test("works", () => {
      expect(
        mapRightAccum([1, 2, 3], 0, (accumulator, n) => [
          accumulator + n,
          accumulator + n,
        ]),
      ).toStrictEqual([6, [6, 5, 3]]);
    });
  });

  describe("maxOption", () => {
    test.each([[7], [7, 3, 2], [2, 3, 7]])(
      "maximum at either boundary of %s",
      (...input) => {
        expect(maxOption(input, Order.Number)).toStrictEqual(Option.some(7));
      },
    );

    test("custom and reversed orders select objects and preserve the first tied identity", () => {
      const first = { name: "Tea", price: 4 };
      const second = { name: "Bread", price: 4 };
      const coffee = { name: "Coffee", price: 9 };
      const byPrice = Order.mapInput(
        Order.Number,
        (product: { price: number }) => product.price,
      );
      expect(maxOption([first, coffee], byPrice)).toStrictEqual(
        Option.some(coffee),
      );
      expect(maxOption([coffee, first], Order.flip(byPrice))).toStrictEqual(
        Option.some(first),
      );
      expect(Option.getOrThrow(maxOption([first, second], byPrice))).toBe(
        first,
      );
    });

    test("data-first and data-last agree", () => {
      const input = [4, 9, 5];
      const direct = maxOption(input, Order.Number);
      const piped = pipe(input, maxOption(Order.Number));
      expect(direct).toStrictEqual(Option.some(9));
      expect(piped).toStrictEqual(direct);
    });

    test.each([null, undefined])(
      "rejects nullish arrays and invokes the order only for multiple values: %s",
      (input) => {
        expect(() =>
          // @ts-expect-error - nullish input is not an array
          maxOption(input, Order.Number),
        ).toThrow(TypeError);
        expect(() =>
          // @ts-expect-error - nullish order cannot compare two elements
          maxOption([1, 2], input),
        ).toThrow(TypeError);
        // @ts-expect-error - empty input bypasses the nullish order
        expect(maxOption([], input)).toStrictEqual(Option.none());
        // @ts-expect-error - singleton input bypasses the nullish order
        expect(maxOption([1], input)).toStrictEqual(Option.some(1));
      },
    );

    test("empty array", () => {
      expect(pipe([], maxOption(Order.Number))).toStrictEqual(Option.none());
    });

    test("array with some values", () => {
      expect(
        pipe([3, 7, 2, 3, 6, 7, 1], maxOption(Order.Number)),
      ).toStrictEqual(Option.some(7));
    });
  });

  describe("takeFirstWhere", () => {
    const numberIsEven = (value: number): value is number => value % 2 === 0;

    test.each([
      { input: [2], expected: Option.some(2) },
      { input: [3], expected: Option.none() },
      { input: [2, 4, 6], expected: Option.some(2) },
      { input: [6, 4, 2], expected: Option.some(2) },
    ])("singleton and minimum boundaries on $input", ({ input, expected }) => {
      expect(takeFirstWhere(input, numberIsEven, Order.Number)).toStrictEqual(
        expected,
      );
    });

    test("custom and reversed orders preserve the first tied identity", () => {
      const first = { name: "Tea", price: 4 };
      const second = { name: "Bread", price: 4 };
      const coffee = { name: "Coffee", price: 9 };
      const hasPrice = (product: {
        price: number;
      }): product is { price: number } => product.price > 0;
      const byPrice = Order.mapInput(
        Order.Number,
        (product: { price: number }) => product.price,
      );
      expect(takeFirstWhere([coffee, first], hasPrice, byPrice)).toStrictEqual(
        Option.some(first),
      );
      expect(
        takeFirstWhere([first, coffee], hasPrice, Order.flip(byPrice)),
      ).toStrictEqual(Option.some(coffee));
      expect(
        Option.getOrThrow(takeFirstWhere([first, second], hasPrice, byPrice)),
      ).toBe(first);
    });

    test("both call styles narrow a union to the same minimum", () => {
      const input = ["unavailable", 6, 2, "missing"];
      const direct = takeFirstWhere(input, Predicate.isNumber, Order.Number);
      const piped = pipe(
        input,
        takeFirstWhere(Predicate.isNumber, Order.Number),
      );
      expect(direct).toStrictEqual(Option.some(2));
      expect(piped).toStrictEqual(direct);
      expectTypeOf(direct).toEqualTypeOf<Option.Option<number>>();
      expectTypeOf(piped).toEqualTypeOf<Option.Option<number>>();
    });

    test.each([null, undefined])(
      "rejects nullish arrays and callbacks when invoked: %s",
      (input) => {
        expect(() =>
          // @ts-expect-error - nullish input is not an array
          takeFirstWhere(input, numberIsEven, Order.Number),
        ).toThrow(TypeError);
        expect(() =>
          // @ts-expect-error - nullish predicate cannot filter an element
          takeFirstWhere([2], input, Order.Number),
        ).toThrow(TypeError);
        // @ts-expect-error - empty input bypasses the nullish predicate
        expect(takeFirstWhere([], input, Order.Number)).toStrictEqual(
          Option.none(),
        );
        expect(() =>
          // @ts-expect-error - nullish order cannot compare multiple matches
          takeFirstWhere([2, 4], numberIsEven, input),
        ).toThrow(TypeError);
        // @ts-expect-error - no matches bypass the nullish order
        expect(takeFirstWhere([3], numberIsEven, input)).toStrictEqual(
          Option.none(),
        );
        // @ts-expect-error - singleton match bypasses the nullish order
        expect(takeFirstWhere([2], numberIsEven, input)).toStrictEqual(
          Option.some(2),
        );
      },
    );

    test("empty array", () => {
      expect(
        pipe([], takeFirstWhere(numberIsEven, Order.Number)),
      ).toStrictEqual(Option.none());
    });

    test("no match", () => {
      expect(
        pipe([3, 1, 5], takeFirstWhere(numberIsEven, Order.Number)),
      ).toStrictEqual(Option.none());
    });

    test("match", () => {
      expect(
        pipe([3, 4, 1, 2, 5], takeFirstWhere(numberIsEven, Order.Number)),
      ).toStrictEqual(Option.some(2));
    });
  });

  describe("takeLastWhere", () => {
    const numberIsEven = (value: number): value is number => value % 2 === 0;

    test.each([
      { input: [2], expected: Option.some(2) },
      { input: [3], expected: Option.none() },
      { input: [6, 4, 2], expected: Option.some(6) },
      { input: [2, 4, 6], expected: Option.some(6) },
    ])("singleton and maximum boundaries on $input", ({ input, expected }) => {
      expect(takeLastWhere(input, numberIsEven, Order.Number)).toStrictEqual(
        expected,
      );
    });

    test("custom and reversed orders preserve the first tied identity", () => {
      const first = { name: "Tea", price: 4 };
      const second = { name: "Bread", price: 4 };
      const coffee = { name: "Coffee", price: 9 };
      const hasPrice = (product: {
        price: number;
      }): product is { price: number } => product.price > 0;
      const byPrice = Order.mapInput(
        Order.Number,
        (product: { price: number }) => product.price,
      );
      expect(takeLastWhere([first, coffee], hasPrice, byPrice)).toStrictEqual(
        Option.some(coffee),
      );
      expect(
        takeLastWhere([coffee, first], hasPrice, Order.flip(byPrice)),
      ).toStrictEqual(Option.some(first));
      expect(
        Option.getOrThrow(takeLastWhere([first, second], hasPrice, byPrice)),
      ).toBe(first);
    });

    test("both call styles narrow a union to the same maximum", () => {
      const input = ["unavailable", 6, 2, "missing"];
      const direct = takeLastWhere(input, Predicate.isNumber, Order.Number);
      const piped = pipe(
        input,
        takeLastWhere(Predicate.isNumber, Order.Number),
      );
      expect(direct).toStrictEqual(Option.some(6));
      expect(piped).toStrictEqual(direct);
      expectTypeOf(direct).toEqualTypeOf<Option.Option<number>>();
      expectTypeOf(piped).toEqualTypeOf<Option.Option<number>>();
    });

    test.each([null, undefined])(
      "rejects nullish arrays and callbacks when invoked: %s",
      (input) => {
        expect(() =>
          // @ts-expect-error - nullish input is not an array
          takeLastWhere(input, numberIsEven, Order.Number),
        ).toThrow(TypeError);
        expect(() =>
          // @ts-expect-error - nullish predicate cannot filter an element
          takeLastWhere([2], input, Order.Number),
        ).toThrow(TypeError);
        // @ts-expect-error - empty input bypasses the nullish predicate
        expect(takeLastWhere([], input, Order.Number)).toStrictEqual(
          Option.none(),
        );
        expect(() =>
          // @ts-expect-error - nullish order cannot compare multiple matches
          takeLastWhere([2, 4], numberIsEven, input),
        ).toThrow(TypeError);
        // @ts-expect-error - no matches bypass the nullish order
        expect(takeLastWhere([3], numberIsEven, input)).toStrictEqual(
          Option.none(),
        );
        // @ts-expect-error - singleton match bypasses the nullish order
        expect(takeLastWhere([2], numberIsEven, input)).toStrictEqual(
          Option.some(2),
        );
      },
    );

    test("empty array", () => {
      expect(pipe([], takeLastWhere(numberIsEven, Order.Number))).toStrictEqual(
        Option.none(),
      );
    });

    test("no match", () => {
      expect(
        pipe([3, 1, 5], takeLastWhere(numberIsEven, Order.Number)),
      ).toStrictEqual(Option.none());
    });

    test("match", () => {
      expect(
        pipe([3, 4, 1, 2, 5], takeLastWhere(numberIsEven, Order.Number)),
      ).toStrictEqual(Option.some(4));
    });
  });

  describe("categorize", () => {
    const categorizeParity = Match.type<number>().pipe(
      Match.when(
        (n) => n % 2 === 0,
        () => "even" as const,
      ),
      Match.orElse(() => "odd" as const),
    );

    test("singleton input fills only its own category", () => {
      expect(categorize([2], categorizeParity)).toStrictEqual({ even: [2] });
    });

    test("accepts non-array iterables and preserves category order", () => {
      const input = new Set([1, 2, 3, 4]);
      expect(categorize(input, categorizeParity)).toStrictEqual({
        odd: [1, 3],
        even: [2, 4],
      });
    });

    test("property-name categories are own properties rather than inherited buckets", () => {
      const input = ["__proto__", "constructor", "toString", "__proto__"];
      const result = categorize(input, (category) => category);
      expect(Object.entries(result)).toStrictEqual([
        ["__proto__", ["__proto__", "__proto__"]],
        ["constructor", ["constructor"]],
        ["toString", ["toString"]],
      ]);
      expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    });

    test.each([null, undefined])(
      "rejects nullish iterables and bypasses nullish callbacks only on empty input: %s",
      (input) => {
        expect(() =>
          // @ts-expect-error - nullish input is not iterable
          categorize(input, categorizeParity),
        ).toThrow(TypeError);
        expect(() =>
          // @ts-expect-error - nullish callback cannot categorize an element
          categorize([2], input),
        ).toThrow(TypeError);
        // @ts-expect-error - empty input bypasses the nullish callback
        expect(categorize([], input)).toStrictEqual({});
      },
    );

    test("empty array", () => {
      expect(categorize([], categorizeParity)).toStrictEqual({});
    });

    test("some categories never filled", () => {
      expect(categorize([1, 3, 5], categorizeParity)).toStrictEqual({
        odd: [1, 3, 5],
      });
    });

    test("all categories filled", () => {
      expect(categorize([1, 2, 3, 4, 5, 6], categorizeParity)).toStrictEqual({
        odd: [1, 3, 5],
        even: [2, 4, 6],
      });
    });
  });

  describe("compactNullable", () => {
    test.each([
      { input: ["Amira"], expected: ["Amira"] },
      { input: [null], expected: [] },
      { input: [undefined], expected: [] },
      { input: [null, undefined], expected: [] },
    ])("singleton and all-nullish inputs: $input", ({ input, expected }) => {
      expect(compactNullable(input)).toStrictEqual(expected);
    });

    test("keeps every falsy but present value and narrows away nullish types", () => {
      const input = [false, 0, "", Number.NaN, null, undefined];
      const result = compactNullable(input);
      expect(result).toStrictEqual([false, 0, "", Number.NaN]);
      expectTypeOf(result).toEqualTypeOf<(boolean | number | string)[]>();
    });

    test.each([null, undefined])("rejects a nullish array: %s", (input) => {
      expect(() =>
        // @ts-expect-error - nullish input is not an array
        compactNullable(input),
      ).toThrow(TypeError);
    });

    test("empty array", () => {
      expect(compactNullable([])).toStrictEqual([]);
    });

    test("array with only non-null values", () => {
      expect(compactNullable([1, 2, 3])).toStrictEqual([1, 2, 3]);
      expect(compactNullable(["a", "b", "c"])).toStrictEqual(["a", "b", "c"]);
      expect(compactNullable([true, false])).toStrictEqual([true, false]);
    });

    test("array with only null values", () => {
      expect(compactNullable([null, null, null])).toStrictEqual([]);
    });

    test("array with only undefined values", () => {
      expect(compactNullable([undefined, undefined, undefined])).toStrictEqual(
        [],
      );
    });

    test("array with mix of null, undefined, and non-null values", () => {
      expect(
        compactNullable([1, null, 2, undefined, 3, null, 4]),
      ).toStrictEqual([1, 2, 3, 4]);
    });

    test("array with zero and empty string (should be kept)", () => {
      expect(compactNullable([0, "", null, undefined])).toStrictEqual([0, ""]);
    });
  });

  describe("filterMapNullable", () => {
    test("returns transformed values and removes nullish mapper results", () => {
      const input = ["12", "", "not a number", "34"];
      const callback = (value: string) => {
        if (value === "") {
          return;
        }
        const amount = Number(value);
        return Number.isNaN(amount) ? null : amount;
      };
      const direct = filterMapNullable(input, callback);
      const piped = pipe(input, filterMapNullable(callback));
      expect(direct).toStrictEqual([12, 34]);
      expect(piped).toStrictEqual(direct);
      expectTypeOf(direct).toEqualTypeOf<number[]>();
      expectTypeOf(piped).toEqualTypeOf<number[]>();
    });

    test.each([
      { input: ["Amira"], expected: ["Amira"] },
      { input: [null], expected: [] },
      { input: [undefined], expected: [] },
      { input: [undefined, undefined], expected: [] },
    ])("singleton and all-undefined results: $input", ({ input, expected }) => {
      expect(filterMapNullable(input, (value) => value)).toStrictEqual(
        expected,
      );
    });

    test("maps once per element in input order and narrows away nullish results", () => {
      const input = [false, 0, "", Number.NaN, null, undefined];
      const callback = vi.fn(
        (value: boolean | number | string | null | undefined) => value,
      );
      const result = filterMapNullable(input, callback);
      expect(result).toStrictEqual([false, 0, "", Number.NaN]);
      expect(callback.mock.calls).toStrictEqual([
        [false],
        [0],
        [""],
        [Number.NaN],
        [null],
        [undefined],
      ]);
      expectTypeOf(result).toEqualTypeOf<(boolean | number | string)[]>();
    });

    test("data-first and data-last agree", () => {
      const input = ["Amira", null, "Ben", undefined];
      const callback = (name: string | null | undefined) => name;
      const direct = filterMapNullable(input, callback);
      const piped = pipe(input, filterMapNullable(callback));
      expect(direct).toStrictEqual(["Amira", "Ben"]);
      expect(piped).toStrictEqual(direct);
      expectTypeOf(piped).toEqualTypeOf<string[]>();
    });

    test.each([null, undefined])(
      "rejects nullish arrays and bypasses nullish callbacks only on empty input: %s",
      (input) => {
        expect(() =>
          // @ts-expect-error - nullish input is not an array
          filterMapNullable(input, (value) => value),
        ).toThrow(TypeError);
        expect(() =>
          // @ts-expect-error - nullish callback cannot map an element
          filterMapNullable(["Amira"], input),
        ).toThrow(TypeError);
        // @ts-expect-error - empty input bypasses the nullish callback
        expect(filterMapNullable([], input)).toStrictEqual([]);
      },
    );

    test("empty array", () => {
      expect(filterMapNullable([], (a) => a)).toStrictEqual([]);
    });

    test("array with only non-null values", () => {
      expect(filterMapNullable([1, 2, 3], (a) => a)).toStrictEqual([1, 2, 3]);
    });

    test("array with only null values", () => {
      expect(filterMapNullable([null, null, null], (a) => a)).toStrictEqual([]);
    });

    test("array with mix of null, undefined, and non-null values", () => {
      expect(
        filterMapNullable([1, null, 2, undefined, 3, null, 4], (a) => a),
      ).toStrictEqual([1, 2, 3, 4]);
    });

    test("array with zero and empty string (should be kept)", () => {
      expect(
        filterMapNullable([0, "", null, undefined], (a) => a),
      ).toStrictEqual([0, ""]);
    });

    test("works data-first or data-last", () => {
      expect(filterMapNullable([1, 2, 3], (a) => a)).toStrictEqual([1, 2, 3]);

      expect(
        pipe(
          [1, 2, 3],
          filterMapNullable((a) => a),
        ),
      ).toStrictEqual([1, 2, 3]);
    });
  });

  describe("findFirstWithIndex2d", () => {
    test.each([
      { input: [[], []], expected: Option.none() },
      { input: [["Piranesi"]], expected: Option.some(["Piranesi", 0, 0]) },
      { input: [["Dune"]], expected: Option.none() },
      {
        input: [["Dune"], ["Foundation", "Earthsea"]],
        expected: Option.none(),
      },
      {
        input: [[], ["Dune"], [], ["Foundation", "Piranesi"]],
        expected: Option.some(["Piranesi", 3, 1]),
      },
    ])(
      "empty rows, singleton and ragged boundaries: $input",
      ({ input, expected }) => {
        expect(
          findFirstWithIndex2d(input, (book) => book === "Piranesi"),
        ).toStrictEqual(expected);
      },
    );

    test("selects the first row-major match and stops invoking the predicate", () => {
      const predicate = vi.fn((book: string) => book === "Piranesi");
      const input = [["Dune", "Piranesi", "Earthsea"], ["Piranesi"]];
      expect(findFirstWithIndex2d(input, predicate)).toStrictEqual(
        Option.some(["Piranesi", 0, 1]),
      );
      expect(predicate.mock.calls).toStrictEqual([
        ["Dune", 0],
        ["Piranesi", 1],
      ]);
    });

    test("data-first and data-last agree", () => {
      const input = [["Dune"], ["Foundation", "Piranesi"]];
      const predicate = (book: string) => book === "Piranesi";
      const direct = findFirstWithIndex2d(input, predicate);
      const piped = pipe(input, findFirstWithIndex2d(predicate));
      expect(direct).toStrictEqual(Option.some(["Piranesi", 1, 1]));
      expect(piped).toStrictEqual(direct);
    });

    test.each([null, undefined])(
      "rejects nullish grids, rows and predicates when reached: %s",
      (input) => {
        expect(() =>
          // @ts-expect-error - nullish input is not a grid
          findFirstWithIndex2d(input, Predicate.isString),
        ).toThrow(TypeError);
        expect(() =>
          // @ts-expect-error - nullish row is not an array
          findFirstWithIndex2d([input], Predicate.isString),
        ).toThrow(TypeError);
        expect(
          // @ts-expect-error - malformed later row is never reached after a match
          findFirstWithIndex2d([["Dune"], input], Predicate.isString),
        ).toStrictEqual(Option.some(["Dune", 0, 0]));
        expect(() =>
          // @ts-expect-error - nullish predicate cannot inspect a cell
          findFirstWithIndex2d([["Dune"]], input),
        ).toThrow(TypeError);
        // @ts-expect-error - empty grid bypasses the nullish predicate
        expect(findFirstWithIndex2d([], input)).toStrictEqual(Option.none());
        // @ts-expect-error - empty rows bypass the nullish predicate
        expect(findFirstWithIndex2d([[]], input)).toStrictEqual(Option.none());
      },
    );

    test("empty array", () => {
      expect(findFirstWithIndex2d([], (a) => a === "A")).toStrictEqual(
        Option.none(),
      );
    });

    test("array with some values, in index (0, 0)", () => {
      expect(
        findFirstWithIndex2d(
          [
            ["A", "B", "C"],
            ["D", "E", "F"],
          ],
          (a) => a === "A",
        ),
      ).toStrictEqual(Option.some(["A", 0, 0]));
    });

    test("array with some values, in index (0, 1)", () => {
      expect(
        findFirstWithIndex2d(
          [
            ["A", "B", "C"],
            ["D", "E", "F"],
          ],
          (a) => a === "B",
        ),
      ).toStrictEqual(Option.some(["B", 0, 1]));
    });

    test("array with some values, in index (1, 0)", () => {
      expect(
        findFirstWithIndex2d(
          [
            ["A", "B", "C"],
            ["D", "E", "F"],
          ],
          (a) => a === "D",
        ),
      ).toStrictEqual(Option.some(["D", 1, 0]));
    });
  });

  describe("filterHead", () => {
    test.each([
      { input: [1], expected: [1] },
      { input: ["missing"], expected: [] },
      { input: [1, "missing", 2], expected: [1, "missing", 2] },
      { input: ["missing", 1], expected: [1] },
      { input: ["missing", 1, "unavailable"], expected: [1, "unavailable"] },
    ])(
      "singleton and first/last/only matches: $input",
      ({ input, expected }) => {
        expect(filterHead(input, Predicate.isNumber)).toStrictEqual(expected);
      },
    );

    test("traverses from the head and stops at the first match", () => {
      const predicate = vi.fn((value: string | number) =>
        Predicate.isNumber(value),
      );
      expect(
        filterHead(["missing", 1, "unavailable", 2], predicate),
      ).toStrictEqual([1, "unavailable", 2]);
      expect(predicate.mock.calls).toStrictEqual([["missing"], [1]]);
    });

    test("data-first and data-last agree", () => {
      const input = ["missing", 1, "unavailable", 2];
      const direct = filterHead(input, Predicate.isNumber);
      const piped = pipe(input, filterHead(Predicate.isNumber));
      expect(direct).toStrictEqual([1, "unavailable", 2]);
      expect(piped).toStrictEqual(direct);
    });

    test.each([null, undefined])(
      "rejects nullish arrays and bypasses nullish predicates only on empty input: %s",
      (input) => {
        expect(() =>
          // @ts-expect-error - nullish input is not an array
          filterHead(input, Predicate.isNumber),
        ).toThrow(TypeError);
        expect(() =>
          // @ts-expect-error - nullish predicate cannot inspect an element
          filterHead([1], input),
        ).toThrow(TypeError);
        // @ts-expect-error - empty input bypasses the nullish predicate
        expect(filterHead([], input)).toStrictEqual([]);
      },
    );

    test("empty array", () => {
      expect(filterHead([], Predicate.isNumber)).toStrictEqual([]);
    });

    test("array with only numbers", () => {
      expect(filterHead([1, 2, 3], Predicate.isNumber)).toStrictEqual([
        1, 2, 3,
      ]);
    });

    test("array with only strings", () => {
      expect(filterHead(["a", "b", "c"], Predicate.isNumber)).toStrictEqual([]);
    });

    test("array with leading strings", () => {
      expect(filterHead(["a", "b", 1, 2], Predicate.isNumber)).toStrictEqual([
        1, 2,
      ]);
    });

    test("array with trailing strings (kept)", () => {
      expect(filterHead(["a", 1, 2, "b"], Predicate.isNumber)).toStrictEqual([
        1,
        2,
        "b",
      ]);
    });

    test("data-last form", () => {
      expect(
        pipe(["a", "b", 1, 2], filterHead(Predicate.isNumber)),
      ).toStrictEqual([1, 2]);
    });

    test("input array is left unmutated", () => {
      const input = ["a", "b", 1, 2];
      const output = filterHead(input, Predicate.isNumber);
      expect(output).toStrictEqual([1, 2]);
      // Re-asserting on `input` (not `output`) confirms the original array
      // was never mutated in place.
      expect(input).toStrictEqual(["a", "b", 1, 2]);
    });

    test("returns a fresh reference", () => {
      const input = [1, 2, 3];
      const result = filterHead(input, Predicate.isNumber);
      expect(result).not.toBe(input);
    });
  });

  describe("filterTail", () => {
    test.each([
      { input: [1], expected: [1] },
      { input: ["missing"], expected: [] },
      { input: [1, "missing", 2], expected: [1, "missing", 2] },
      { input: [1, "missing"], expected: [1] },
      { input: ["missing", 1, "unavailable"], expected: ["missing", 1] },
    ])(
      "singleton and first/last/only matches: $input",
      ({ input, expected }) => {
        expect(filterTail(input, Predicate.isNumber)).toStrictEqual(expected);
      },
    );

    test("traverses from the tail and stops at the last match", () => {
      const predicate = vi.fn((value: string | number) =>
        Predicate.isNumber(value),
      );
      expect(
        filterTail([1, "missing", 2, "unavailable"], predicate),
      ).toStrictEqual([1, "missing", 2]);
      expect(predicate.mock.calls).toStrictEqual([["unavailable"], [2]]);
    });

    test("data-first and data-last agree", () => {
      const input = [1, "missing", 2, "unavailable"];
      const direct = filterTail(input, Predicate.isNumber);
      const piped = pipe(input, filterTail(Predicate.isNumber));
      expect(direct).toStrictEqual([1, "missing", 2]);
      expect(piped).toStrictEqual(direct);
    });

    test.each([null, undefined])(
      "rejects nullish arrays and bypasses nullish predicates only on empty input: %s",
      (input) => {
        expect(() =>
          // @ts-expect-error - nullish input is not an array
          filterTail(input, Predicate.isNumber),
        ).toThrow(TypeError);
        expect(() =>
          // @ts-expect-error - nullish predicate cannot inspect an element
          filterTail([1], input),
        ).toThrow(TypeError);
        // @ts-expect-error - empty input bypasses the nullish predicate
        expect(filterTail([], input)).toStrictEqual([]);
      },
    );

    test("empty array", () => {
      expect(filterTail([], Predicate.isNumber)).toStrictEqual([]);
    });

    test("array with only numbers", () => {
      expect(filterTail([1, 2, 3], Predicate.isNumber)).toStrictEqual([
        1, 2, 3,
      ]);
    });

    test("array with only strings", () => {
      expect(filterTail(["a", "b", "c"], Predicate.isNumber)).toStrictEqual([]);
    });

    test("array with trailing strings", () => {
      expect(filterTail([1, 2, "a", "b"], Predicate.isNumber)).toStrictEqual([
        1, 2,
      ]);
    });

    test("array with leading strings (kept)", () => {
      expect(filterTail(["a", 1, 2, "b"], Predicate.isNumber)).toStrictEqual([
        "a",
        1,
        2,
      ]);
    });

    test("data-last form", () => {
      expect(
        pipe([1, 2, "a", "b"], filterTail(Predicate.isNumber)),
      ).toStrictEqual([1, 2]);
    });

    test("input array is left unmutated", () => {
      const input = [1, 2, "a", "b"];
      const output = filterTail(input, Predicate.isNumber);
      expect(output).toStrictEqual([1, 2]);
      // Re-asserting on `input` (not `output`) confirms the original array
      // was never mutated in place.
      expect(input).toStrictEqual([1, 2, "a", "b"]);
    });

    test("returns a fresh reference", () => {
      const input = [1, 2, 3];
      const result = filterTail(input, Predicate.isNumber);
      expect(result).not.toBe(input);
    });
  });

  describe("chunkBy", () => {
    test("singleton input projects once without comparing groups", () => {
      const chunk = vi.fn((entry: string) => entry);
      const equivalent = vi.fn(Equivalence.String);
      expect(chunkBy(["Monday"], chunk, equivalent)).toStrictEqual([
        { group: "Monday", values: ["Monday"] },
      ]);
      expect(chunk.mock.calls).toStrictEqual([["Monday"]]);
      expect(equivalent).not.toHaveBeenCalled();
    });

    test("empty input invokes neither callback", () => {
      const chunk = vi.fn((entry: string) => entry);
      const equivalent = vi.fn(Equivalence.String);
      expect(chunkBy([], chunk, equivalent)).toStrictEqual([]);
      expect(chunk).not.toHaveBeenCalled();
      expect(equivalent).not.toHaveBeenCalled();
    });

    test("each distinct key starts a new run", () => {
      expect(
        chunkBy(
          ["Monday", "Tuesday", "Wednesday"],
          (day) => day,
          Equivalence.String,
        ),
      ).toStrictEqual([
        { group: "Monday", values: ["Monday"] },
        { group: "Tuesday", values: ["Tuesday"] },
        { group: "Wednesday", values: ["Wednesday"] },
      ]);
    });

    test("custom object equivalence uses the first projected object as the group", () => {
      const input = [
        { day: "Monday", title: "Dentist" },
        { day: "Monday", title: "Lunch" },
        { day: "Tuesday", title: "Book club" },
      ];
      const equivalent = Equivalence.make<{ day: string }>(
        (a, b) => a.day === b.day,
      );
      const result = chunkBy(input, (entry) => entry, equivalent);
      expect(result).toStrictEqual([
        { group: input[0], values: [input[0], input[1]] },
        { group: input[2], values: [input[2]] },
      ]);
      expect(result[0]?.group).toBe(input[0]);
    });

    test("data-first and data-last agree", () => {
      const input = ["Monday", "Monday", "Tuesday", "Monday"];
      const chunk = (day: string) => day;
      const direct = chunkBy(input, chunk, Equivalence.String);
      const piped = pipe(input, chunkBy(chunk, Equivalence.String));
      expect(direct).toStrictEqual([
        { group: "Monday", values: ["Monday", "Monday"] },
        { group: "Tuesday", values: ["Tuesday"] },
        { group: "Monday", values: ["Monday"] },
      ]);
      expect(piped).toStrictEqual(direct);
    });

    test.each([null, undefined])(
      "rejects nullish arrays and callbacks when invoked: %s",
      (input) => {
        expect(() =>
          // @ts-expect-error - nullish input is not an array
          chunkBy(input, (day: string) => day, Equivalence.String),
        ).toThrow(TypeError);
        expect(() =>
          // @ts-expect-error - nullish projection cannot group an element
          chunkBy(["Monday"], input, Equivalence.String),
        ).toThrow(TypeError);
        // @ts-expect-error - empty input bypasses the nullish projection
        expect(chunkBy([], input, Equivalence.String)).toStrictEqual([]);
        expect(() =>
          // @ts-expect-error - nullish equivalence cannot compare two groups
          chunkBy(["Monday", "Tuesday"], (day) => day, input),
        ).toThrow(TypeError);
        // @ts-expect-error - empty input bypasses the nullish equivalence
        expect(chunkBy([], (day: string) => day, input)).toStrictEqual([]);
        // @ts-expect-error - singleton input bypasses the nullish equivalence
        expect(chunkBy(["Monday"], (day) => day, input)).toStrictEqual([
          { group: "Monday", values: ["Monday"] },
        ]);
      },
    );

    test("empty array", () => {
      expect(chunkBy([], (a) => a, Equal.equals)).toStrictEqual([]);
    });

    test("array with only one group", () => {
      expect(
        chunkBy([1, 2, 3], () => "number", Equivalence.String),
      ).toStrictEqual([{ group: "number", values: [1, 2, 3] }]);
    });

    test("many groups", () => {
      expect(
        chunkBy(
          [1, 2, 4, 3, 4, 8, 1],
          (number_) => (number_ % 2 === 0 ? "even" : "odd"),
          Equivalence.String,
        ),
      ).toStrictEqual([
        { group: "odd", values: [1] },
        { group: "even", values: [2, 4] },
        { group: "odd", values: [3] },
        { group: "even", values: [4, 8] },
        { group: "odd", values: [1] },
      ]);
    });

    test("input array is left unmutated", () => {
      const input = [1, 2, 4, 3];
      const output = chunkBy(input, (n) => n % 2 === 0, Equal.equals);
      expect(output).toStrictEqual([
        { group: false, values: [1] },
        { group: true, values: [2, 4] },
        { group: false, values: [3] },
      ]);
      // Re-asserting on `input` (not `output`) confirms the original array
      // was never mutated in place.
      expect(input).toStrictEqual([1, 2, 4, 3]);
    });

    test("returns a fresh reference", () => {
      const input = [1, 2, 3];
      const result = chunkBy(input, (n) => n % 2 === 0, Equal.equals);
      expect(result).not.toBe(input);
    });

    test("non-transitive equivalence compares each item against its run's first group value, in (firstGroup, current) order", () => {
      const closeToFirst = vi.fn(
        (a: number, b: number) => Math.abs(a - b) <= 1,
      );

      expect(chunkBy([1, 2, 3, 10], (n) => n, closeToFirst)).toStrictEqual([
        { group: 1, values: [1, 2] },
        { group: 3, values: [3] },
        { group: 10, values: [10] },
      ]);
      expect(closeToFirst.mock.calls).toStrictEqual([
        [1, 2],
        [1, 3],
        [3, 10],
      ]);
    });

    test("asymmetric equivalence proves the result is order-sensitive: swapping the comparator's argument order would change the grouping", () => {
      const groupIsAtMostOneBelowCurrent: Equivalence.Equivalence<number> = (
        firstGroup,
        current,
      ) => current - firstGroup >= 0 && current - firstGroup <= 1;

      expect(
        chunkBy([1, 2, 3], (n) => n, groupIsAtMostOneBelowCurrent),
      ).toStrictEqual([
        { group: 1, values: [1, 2] },
        { group: 3, values: [3] },
      ]);
    });

    test("the chunk projection is called exactly once per item, in input order", () => {
      const chunk = vi.fn((n: number) => n % 2 === 0);

      const result = chunkBy([2, 4, 1, 3, 6], chunk, Equal.equals);

      expect(chunk.mock.calls).toStrictEqual([[2], [4], [1], [3], [6]]);
      expect(result).toStrictEqual([
        { group: true, values: [2, 4] },
        { group: false, values: [1, 3] },
        { group: true, values: [6] },
      ]);
    });
  });
});
