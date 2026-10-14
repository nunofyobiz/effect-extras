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
  compactNullable,
  filterHead,
  filterMapNullable,
  filterTail,
  findFirstWithIndex2d,
  insertUniq,
  mapRightAccum,
  maxOption,
  mergeByWhere,
  slice,
  takeFirstWhere,
  takeLastWhere,
} from "./ArrayX.js";
import { ArrayX } from ".";

describe("Array utils", () => {
  describe("mergeByWhere", () => {
    const styles = [
      { name: "data-first", merge: mergeByWhere },
      {
        name: "data-last",
        merge: <A, K>(
          existing: readonly A[],
          incoming: Iterable<A>,
          keyOf: (value: A) => K,
          isPreferred: (candidate: A, existing: A) => boolean,
        ): readonly A[] =>
          pipe(existing, mergeByWhere(incoming, keyOf, isPreferred)),
      },
    ];
    const item = (id: string, revision: number) => ({ id, revision });
    const keyOf = (value: ReturnType<typeof item>) => value.id;
    const newer = (
      candidate: ReturnType<typeof item>,
      existing: ReturnType<typeof item>,
    ) => candidate.revision > existing.revision;

    describe.each(styles)("$name", ({ merge }) => {
      test.each([{ existing: [] }, { existing: [item("a", 1)] }])(
        "empty incoming preserves existing $existing",
        ({ existing }) => {
          const result = merge(existing, [], keyOf, newer);
          expect(result).toStrictEqual(existing);
          expect(result).toBe(existing);
        },
      );

      test("appends a single item to empty existing without comparing", () => {
        const existing: ReturnType<typeof item>[] = [];
        const candidate = item("a", 1);
        const preferred = vi.fn(newer);
        const result = merge(existing, [candidate], keyOf, preferred);
        expect(result).toStrictEqual([candidate]);
        expect(result).not.toBe(existing);
        expect(preferred).not.toHaveBeenCalled();
      });

      test.each([0, 1, 2])("replaces only the item at index %i", (index) => {
        const existing = [item("a", 1), item("b", 1), item("c", 1)];
        const original = existing.at(index);
        if (Predicate.isUndefined(original)) {
          throw new TypeError("Missing test fixture");
        }
        const candidate = item(original.id, 2);
        const result = merge(existing, [candidate], keyOf, newer);
        expect(result).toStrictEqual(
          existing.map((value, position) =>
            position === index ? candidate : value,
          ),
        );
        expect(result[index]).toBe(candidate);
        expect(result).not.toBe(existing);
        for (const [position, value] of existing.entries()) {
          expect(result[position]).toBe(position === index ? candidate : value);
        }
      });

      test("accepts or rejects a single matching update", () => {
        const original = item("a", 2);
        const existing = [original];
        const accepted = item("a", 3);
        const rejected = merge(existing, [item("a", 1)], keyOf, newer);
        expect(rejected).toStrictEqual([original]);
        expect(rejected).toBe(existing);
        const result = merge(existing, [accepted], keyOf, newer);
        expect(result).toStrictEqual([accepted]);
        expect(result[0]).toBe(accepted);
        expect(result).not.toBe(existing);
      });

      test("compares repeats against current winners and keeps append order", () => {
        const a = item("a", 1);
        const b = item("b", 4);
        const a2 = item("a", 2);
        const a3 = item("a", 3);
        const c = item("c", 1);
        const c2 = item("c", 2);
        const d = item("d", 1);
        const preferred = vi.fn(newer);
        const existing = [a, b];
        const incoming = [c, a2, d, a, c2, c, a3, b];
        const result = merge(existing, incoming, keyOf, preferred);
        expect(result).toStrictEqual([a3, b, c2, d]);
        expect(result).not.toBe(existing);
        expect(preferred.mock.calls).toStrictEqual([
          [a2, a],
          [a, a2],
          [c2, c],
          [c, c2],
          [a3, a2],
          [b, b],
        ]);
      });

      test.each(["array", "set", "generator"])(
        "reduces an empty existing array from a %s in first-key order",
        (kind) => {
          const a = item("a", 1);
          const b = item("b", 3);
          const a2 = item("a", 2);
          const values = [a, b, a2, item("b", 2), a];
          function* updates() {
            yield* values;
          }
          const incoming = Match.value(kind).pipe(
            Match.when("array", () => values),
            Match.when("set", () => new Set(values)),
            Match.orElse(() => updates()),
          );
          const existing: ReturnType<typeof item>[] = [];
          const result = merge(existing, incoming, keyOf, newer);
          expect(result).toStrictEqual([a2, b]);
          expect(result).not.toBe(existing);
          const remaining = Match.value(kind).pipe(
            Match.when("array", () => values),
            Match.when("set", () => [...new Set(values)]),
            Match.orElse(() => []),
          );
          expect([...incoming]).toStrictEqual(remaining);
        },
      );

      test("matches NaN and signed-zero keys with SameValueZero", () => {
        const existing = [
          { key: Number.NaN, value: 1 },
          { key: 0, value: 1 },
        ];
        const incoming = [
          { key: Number.NaN, value: 2 },
          { key: -0, value: 2 },
        ];
        const result = merge(
          existing,
          incoming,
          (value) => value.key,
          () => true,
        );
        expect(result).toStrictEqual(incoming);
        expect(result).not.toBe(existing);
      });

      test("matches shared object keys and keeps distinct objects separate", () => {
        const key = { id: "a" };
        const original = { key, value: 1 };
        const replacement = { key, value: 2 };
        const appended = { key: { id: "a" }, value: 3 };
        const existing = [original];
        const result = merge(
          existing,
          [replacement, appended],
          (value) => value.key,
          () => true,
        );
        expect(result).toStrictEqual([replacement, appended]);
        expect(result).not.toBe(existing);
      });

      test("supports nullish keys", () => {
        const existing = [
          { key: null, value: 1 },
          { key: undefined, value: 2 },
        ];
        const incoming = [
          { key: undefined, value: 3 },
          { key: null, value: 4 },
        ];
        const result = merge(
          existing,
          incoming,
          (value) => value.key,
          () => true,
        );
        expect(result).toStrictEqual([incoming[1], incoming[0]]);
        expect(result).not.toBe(existing);
      });

      test("only the first existing duplicate participates in comparisons", () => {
        const first = item("a", 1);
        const duplicate = item("a", 10);
        const a2 = item("a", 2);
        const a3 = item("a", 3);
        const existing = [first, duplicate];
        const preferred = vi.fn(newer);
        const result = merge(existing, [a2, first, a3], keyOf, preferred);
        expect(result).toStrictEqual([a3, duplicate]);
        expect(result[1]).toBe(duplicate);
        expect(result).not.toBe(existing);
        expect(preferred.mock.calls).toStrictEqual([
          [a2, first],
          [first, a2],
          [a3, a2],
        ]);
      });

      test("all rejected updates retain the original array", () => {
        const existing = [item("a", 2), item("b", 3)];
        const result = merge(
          existing,
          [item("b", 1), item("a", 1)],
          keyOf,
          newer,
        );
        expect(result).toStrictEqual(existing);
        expect(result).toBe(existing);
      });

      test("accepted identical references retain the original array", () => {
        const existing = [item("a", 1), item("b", 2)];
        const preferred = vi.fn(() => true);
        const result = merge(existing, existing, keyOf, preferred);
        expect(result).toStrictEqual(existing);
        expect(result).toBe(existing);
        expect(preferred).toHaveBeenCalledTimes(2);
      });

      test("restoring every original reference returns the original array", () => {
        const a = item("a", 1);
        const b = item("b", 1);
        const existing = [a, b];
        const result = merge(
          existing,
          [item("a", 2), item("b", 2), a, b],
          keyOf,
          () => true,
        );
        expect(result).toStrictEqual([a, b]);
        expect(result).toBe(existing);
      });

      test("structurally equal replacements still produce a fresh array", () => {
        const existing = [item("a", 1)];
        const candidate = item("a", 1);
        const result = merge(existing, [candidate], keyOf, () => true);
        expect(result).toStrictEqual(existing);
        expect(result[0]).toBe(candidate);
        expect(result).not.toBe(existing);
      });

      test("element identity uses Object.is for NaN and signed zeros", () => {
        const nan = [Number.NaN];
        expect(
          merge(
            nan,
            [Number.NaN],
            (value) => value,
            () => true,
          ),
        ).toBe(nan);
        const existing = [0];
        const result = merge(
          existing,
          [-0],
          (value) => value,
          () => true,
        );
        expect(result).toStrictEqual([-0]);
        expect(result).not.toBe(existing);
        expect(
          merge(
            existing,
            [-0, 0],
            (value) => value,
            () => true,
          ),
        ).toBe(existing);
      });

      test("nullish elements are values, not missing positions", () => {
        const existing = [undefined, null];
        const preferred = vi.fn(() => true);
        expect(
          merge(existing, [undefined, null], (value) => value, preferred),
        ).toBe(existing);
        expect(preferred.mock.calls).toStrictEqual([
          [undefined, undefined],
          [null, null],
        ]);
        const result = merge(
          [null],
          [undefined, null],
          () => "same",
          () => true,
        );
        expect(result).toStrictEqual([null]);
        expect(
          merge(
            [],
            [undefined, null, undefined],
            (value) => value,
            () => true,
          ),
        ).toStrictEqual([undefined, null]);
      });

      test("does not mutate frozen arrays or their elements", () => {
        const a = Object.freeze(item("a", 1));
        const b = Object.freeze(item("b", 2));
        const update = Object.freeze(item("a", 3));
        const appended = Object.freeze(item("c", 1));
        const existing = Object.freeze([a, b]);
        const incoming = Object.freeze([update, appended]);
        const result = merge(existing, incoming, keyOf, newer);
        expect(result).toStrictEqual([update, b, appended]);
        expect(result).not.toBe(existing);
        // Reasserting on the original inputs confirms neither was mutated.
        expect(existing).toStrictEqual([item("a", 1), item("b", 2)]);
        expect(incoming).toStrictEqual([item("a", 3), item("c", 1)]);
      });

      test("rejects a non-iterable incoming value at runtime", () => {
        // @ts-expect-error - untyped callers can supply a non-iterable incoming object
        expect(() => merge([], {}, keyOf, newer)).toThrow(TypeError);
      });

      test("infers an exactly readonly result from mutable and readonly inputs", () => {
        const mutable = [item("a", 1)];
        const readonly = Object.freeze([item("a", 2)]);
        expectTypeOf(merge(mutable, readonly, keyOf, newer)).toEqualTypeOf<
          readonly ReturnType<typeof item>[]
        >();
        expectTypeOf(merge(readonly, mutable, keyOf, newer)).toEqualTypeOf<
          readonly ReturnType<typeof item>[]
        >();
        expect(merge(mutable, readonly, keyOf, newer)).toStrictEqual(readonly);
      });
    });

    test("infers the element type in the direct and piped public overloads", () => {
      const existing = [{ id: "a", revision: 1 }];
      const incoming = Object.freeze([{ id: "a", revision: 2 }]);
      const direct = mergeByWhere(
        existing,
        incoming,
        (value) => value.id,
        (candidate, current) => candidate.revision > current.revision,
      );
      const piped = pipe(
        existing,
        mergeByWhere(
          incoming,
          (value) => value.id,
          (candidate, current) => candidate.revision > current.revision,
        ),
      );
      expectTypeOf(direct).toEqualTypeOf<
        readonly { id: string; revision: number }[]
      >();
      expectTypeOf(piped).toEqualTypeOf<
        readonly { id: string; revision: number }[]
      >();
      expect(piped).toStrictEqual(direct);
    });

    test("is exposed through the root ArrayX namespace", () => {
      expect(ArrayX.mergeByWhere).toBe(mergeByWhere);
      expect(
        ArrayX.mergeByWhere(
          [1],
          [2],
          () => "key",
          (candidate, current) => candidate > current,
        ),
      ).toStrictEqual([2]);
    });
  });

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
