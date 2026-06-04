import {
  Array,
  Equal,
  Equivalence,
  Match,
  Option,
  Order,
  Predicate,
  pipe,
} from "effect";
import { describe, expect, test } from "vitest";
import { WarnResult } from "../WarnResult";
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
  zipWithWarnings,
} from "./ArrayX";

describe("Array utils", () => {
  describe("slice", () => {
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

  describe("zipWithWarnings", () => {
    test("same length", () => {
      expect(
        zipWithWarnings(
          [1, 2, 3],
          [4, 5, 6],
          WarnResult.match({
            WarningsOnly: ({ warnings }) => `Warnings ${warnings}`,
            SuccessOnly: ({ success }) => `Success ${success}`,
            SuccessWithWarnings: ({ warnings, success }) =>
              `Warnings ${warnings} and Success ${success}`,
          }),
        ),
      ).toStrictEqual([
        "Warnings 1 and Success 4",
        "Warnings 2 and Success 5",
        "Warnings 3 and Success 6",
      ]);
    });

    test("longer first array", () => {
      expect(
        zipWithWarnings(
          [1, 2, 3, 4],
          [4, 5, 6],
          WarnResult.match({
            WarningsOnly: ({ warnings }) => `Warnings ${warnings}`,
            SuccessOnly: ({ success }) => `Success ${success}`,
            SuccessWithWarnings: ({ warnings, success }) =>
              `Warnings ${warnings} and Success ${success}`,
          }),
        ),
      ).toStrictEqual([
        "Warnings 1 and Success 4",
        "Warnings 2 and Success 5",
        "Warnings 3 and Success 6",
        "Warnings 4",
      ]);
    });

    test("longer second array", () => {
      expect(
        zipWithWarnings(
          [1, 2, 3],
          [4, 5, 6, 7],
          WarnResult.match({
            WarningsOnly: ({ warnings }) => `Warnings ${warnings}`,
            SuccessOnly: ({ success }) => `Success ${success}`,
            SuccessWithWarnings: ({ warnings, success }) =>
              `Warnings ${warnings} and Success ${success}`,
          }),
        ),
      ).toStrictEqual([
        "Warnings 1 and Success 4",
        "Warnings 2 and Success 5",
        "Warnings 3 and Success 6",
        "Success 7",
      ]);
    });

    test("empty first array", () => {
      expect(
        zipWithWarnings(
          Array.empty<number>(),
          [4, 5, 6],
          WarnResult.match({
            WarningsOnly: ({ warnings }) => `Warnings ${warnings}`,
            SuccessOnly: ({ success }) => `Success ${success}`,
            SuccessWithWarnings: ({ warnings, success }) =>
              `Warnings ${warnings} and Success ${success}`,
          }),
        ),
      ).toStrictEqual(["Success 4", "Success 5", "Success 6"]);
    });

    test("empty second array", () => {
      expect(
        zipWithWarnings(
          [1, 2, 3],
          Array.empty<number>(),
          WarnResult.match({
            WarningsOnly: ({ warnings }) => `Warnings ${warnings}`,
            SuccessOnly: ({ success }) => `Success ${success}`,
            SuccessWithWarnings: ({ warnings, success }) =>
              `Warnings ${warnings} and Success ${success}`,
          }),
        ),
      ).toStrictEqual(["Warnings 1", "Warnings 2", "Warnings 3"]);
    });

    test("empty both arrays", () => {
      expect(
        zipWithWarnings(
          Array.empty<number>(),
          Array.empty<number>(),
          WarnResult.match({
            WarningsOnly: ({ warnings }) => `Warnings ${warnings}`,
            SuccessOnly: ({ success }) => `Success ${success}`,
            SuccessWithWarnings: ({ warnings, success }) =>
              `Warnings ${warnings} and Success ${success}`,
          }),
        ),
      ).toStrictEqual([]);
    });
  });

  describe("insertUniq", () => {
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
  });

  describe("filterTail", () => {
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
  });

  describe("chunkBy", () => {
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
  });
});
