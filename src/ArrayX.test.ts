import { describe, expect, expectTypeOf, test, vi } from "@effect/vitest";
import {
  Equal,
  Equivalence,
  Match,
  Option,
  Order,
  Predicate,
  pipe,
} from "effect";
import {
  categorize,
  chunkBy,
  clusterBy,
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
import { ArrayX } from "./index.js";

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

  describe("clusterBy", () => {
    test("empty input never extracts tags", () => {
      const tagsOf = vi.fn((entry: number) => [entry]);
      expect(clusterBy([], tagsOf)).toStrictEqual([]);
      expect(tagsOf).not.toHaveBeenCalled();
    });

    test("single entry keeps its identity and deduplicates tags", () => {
      const entry = { tags: ["a", "a", "b"] };
      const result = clusterBy([entry], (entry) => entry.tags);
      expect(result).toStrictEqual([
        { entries: [entry], tags: new Set(["a", "b"]) },
      ]);
      expect(result[0].entries[0]).toBe(entry);
    });

    test("untagged occurrences each form their own cluster", () => {
      const entry = { tags: [] };
      expect(clusterBy([entry, entry], (entry) => entry.tags)).toStrictEqual([
        { entries: [entry], tags: new Set() },
        { entries: [entry], tags: new Set() },
      ]);
    });

    test("direct overlap and disjoint clusters agree in both call styles", () => {
      const input = [
        { name: "Alice", tags: ["hiking", "climbing"] },
        { name: "Bob", tags: ["painting"] },
        { name: "Carol", tags: ["climbing", "camping"] },
      ];
      const tagsOf = (entry: (typeof input)[number]) => entry.tags;
      const expected = [
        {
          entries: [input[0], input[2]],
          tags: new Set(["hiking", "climbing", "camping"]),
        },
        { entries: [input[1]], tags: new Set(["painting"]) },
      ];
      expect(clusterBy(input, tagsOf)).toStrictEqual(expected);
      expect(pipe(input, clusterBy(tagsOf))).toStrictEqual(expected);
      expect(ArrayX.clusterBy(input, tagsOf)).toStrictEqual(expected);
    });

    test("multi-step chain merges entries without a common tag across all entries", () => {
      const input = [["a"], ["a", "b"], ["b", "c"], ["c", "d"], ["d"]];
      expect(clusterBy(input, (tags) => tags)).toStrictEqual([
        { entries: input, tags: new Set(["a", "b", "c", "d"]) },
      ]);
    });

    test("late bridge preserves cluster position and interleaved entry order", () => {
      const unrelated = { name: "U", tags: ["u"] };
      const first = { name: "A", tags: ["a"] };
      const second = { name: "B", tags: ["b"] };
      const firstAgain = { name: "A2", tags: ["a"] };
      const other = { name: "C", tags: ["c"] };
      const link = { name: "L", tags: ["b", "a"] };
      const input = [unrelated, first, second, firstAgain, other, link];
      const result = clusterBy(input, (entry) => entry.tags);
      expect(result).toStrictEqual([
        { entries: [unrelated], tags: new Set(["u"]) },
        {
          entries: [first, second, firstAgain, link],
          tags: new Set(["a", "b"]),
        },
        { entries: [other], tags: new Set(["c"]) },
      ]);
      expect(result.flatMap((cluster) => cluster.entries)).toHaveLength(
        input.length,
      );
      for (const [index, entry] of [
        first,
        second,
        firstAgain,
        link,
      ].entries()) {
        expect(result[1].entries[index]).toBe(entry);
      }
    });

    test("one-shot tag generators are extracted and consumed once per occurrence", () => {
      const first = (function* () {
        yield "a";
        yield "b";
      })();
      const second = (function* () {
        yield "b";
        yield "c";
      })();
      const tagsOf = vi.fn((tags: Iterable<string>) => tags);
      expect(clusterBy([first, second], tagsOf)).toStrictEqual([
        { entries: [first, second], tags: new Set(["a", "b", "c"]) },
      ]);
      expect(tagsOf.mock.calls).toStrictEqual([[first], [second]]);
      expect([...first]).toStrictEqual([]);
      expect([...second]).toStrictEqual([]);
    });

    test("repeated references remain separate input occurrences", () => {
      const entry = { tags: new Set(["a"]) };
      const tagsOf = vi.fn(
        (entry: { tags: ReadonlySet<string> }) => entry.tags,
      );
      const result = clusterBy([entry, entry, entry], tagsOf);
      expect(result).toStrictEqual([
        { entries: [entry, entry, entry], tags: new Set(["a"]) },
      ]);
      expect(tagsOf.mock.calls).toStrictEqual([[entry], [entry], [entry]]);
      for (const occurrence of result[0].entries) {
        expect(occurrence).toBe(entry);
      }
    });

    test("object tags compare by identity", () => {
      const shared = { interest: "hiking" };
      const distinct = { interest: "hiking" };
      const input = [[shared], [distinct], [shared]];
      const result = clusterBy(input, (tags) => tags);
      expect(result).toStrictEqual([
        { entries: [input[0], input[2]], tags: new Set([shared]) },
        { entries: [input[1]], tags: new Set([distinct]) },
      ]);
      expect(result[0].tags.has(distinct)).toBe(false);
      expect(result[1].tags.has(shared)).toBe(false);
    });

    test("special primitive and nullish tags use native equality", () => {
      const input = [
        [Number.NaN],
        [Number.NaN],
        [0],
        [-0],
        [null],
        [null],
        [undefined],
        [undefined],
      ];
      expect(clusterBy(input, (tags) => tags)).toStrictEqual([
        { entries: [input[0], input[1]], tags: new Set([Number.NaN]) },
        { entries: [input[2], input[3]], tags: new Set([0]) },
        { entries: [input[4], input[5]], tags: new Set([null]) },
        { entries: [input[6], input[7]], tags: new Set([undefined]) },
      ]);
    });

    test("input array, entries, and caller-owned tag collections remain unchanged", () => {
      const firstTags = Object.freeze(["a", "b"]);
      const secondTags = new Set(["b", "c"]);
      const first = Object.freeze({ tags: firstTags });
      const second = Object.freeze({ tags: secondTags });
      const input = Object.freeze([first, second]);
      const result = clusterBy(input, (entry) => entry.tags);
      expect(result).toStrictEqual([
        { entries: [first, second], tags: new Set(["a", "b", "c"]) },
      ]);
      // Re-assert the caller's original references after checking the output.
      expect(input).toStrictEqual([first, second]);
      expect(first.tags).toBe(firstTags);
      expect(second.tags).toBe(secondTags);
      expect(firstTags).toStrictEqual(["a", "b"]);
      expect(secondTags).toStrictEqual(new Set(["b", "c"]));
      expect(result[0].tags).not.toBe(secondTags);
    });

    test("non-iterable callback results throw at runtime", () => {
      expect(() =>
        // @ts-expect-error - untyped callers can return a non-iterable tag value
        clusterBy([1], () => 42),
      ).toThrow(TypeError);
    });

    test("both overloads infer readonly entry and tag types", () => {
      interface Entry {
        readonly name: string;
        readonly tags: ReadonlySet<number>;
      }
      const input: readonly Entry[] = [{ name: "Alice", tags: new Set([1]) }];
      const tagsOf = (entry: Entry) => entry.tags;
      const dataFirst = clusterBy(input, tagsOf);
      const dataLast = pipe(input, clusterBy(tagsOf));
      type Clusters = readonly {
        readonly entries: readonly Entry[];
        readonly tags: ReadonlySet<number>;
      }[];
      expectTypeOf(dataFirst).toEqualTypeOf<Clusters>();
      expectTypeOf(dataLast).toEqualTypeOf<Clusters>();
      expectTypeOf(dataFirst[0].entries[0]).toEqualTypeOf<Entry>();
      expectTypeOf(dataLast[0].tags).toEqualTypeOf<ReadonlySet<number>>();
      expect(dataFirst).toStrictEqual(dataLast);
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
