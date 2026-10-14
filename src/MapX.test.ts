import { describe, expect, expectTypeOf, test, vi } from "@effect/vitest";
import { Equal, pipe } from "effect";
import {
  firstIndexes,
  getOrElseSetGet,
  indexes,
  indices,
  lastIndexes,
} from "./MapX.js";

interface PositionHelper {
  <A, K>(
    keyOf: (value: A) => K,
  ): (self: Iterable<A>) => Map<K, number | number[]>;
  <A, K>(self: Iterable<A>, keyOf: (value: A) => K): Map<K, number | number[]>;
}

describe("Map utils", () => {
  const positionHelpers: {
    name: string;
    helper: PositionHelper;
    select: (positions: number[]) => number | number[] | undefined;
  }[] = [
    {
      name: "indexes",
      helper: indexes,
      select: (positions: number[]) => positions,
    },
    {
      name: "firstIndexes",
      helper: firstIndexes,
      select: (positions: number[]) => positions[0],
    },
    {
      name: "lastIndexes",
      helper: lastIndexes,
      select: (positions: number[]) => positions.at(-1),
    },
  ];

  describe.each(positionHelpers)("$name", ({ helper, select }) => {
    test.each([
      { input: [], positions: [] },
      { input: ["a"], positions: [["a", [0]]] },
      { input: ["a", "a", "a"], positions: [["a", [0, 1, 2]]] },
      {
        input: ["a", "b", "a", "c", "b"],
        positions: [
          ["a", [0, 2]],
          ["b", [1, 4]],
          ["c", [3]],
        ],
      },
      {
        input: ["a", "a", "b", "a"],
        positions: [
          ["a", [0, 1, 3]],
          ["b", [2]],
        ],
      },
    ] satisfies { input: string[]; positions: [string, number[]][] }[])(
      "positions and key order for $input in both call styles",
      ({ input, positions }) => {
        const expected = positions.map(([key, values]) => [
          key,
          select(values),
        ]);
        const direct = helper(input, (value) => value);
        const piped = pipe(
          input,
          helper((value: string) => value),
        );

        expect(direct).toBeInstanceOf(Map);
        expect([...direct]).toStrictEqual(expected);
        expect([...direct.keys()]).toStrictEqual(positions.map(([key]) => key));
        expect(piped).toStrictEqual(direct);
        expect([...piped]).toStrictEqual(expected);
      },
    );

    test.each([
      { name: "Set", make: () => new Set(["a", "b", "c"]) },
      { name: "string", make: () => "abc" },
      {
        name: "one-shot generator",
        *make() {
          yield "a";
          yield "b";
          yield "c";
        },
      },
    ])("accepts $name in both call styles", ({ make }) => {
      const direct = helper(make(), (value) => value);
      const piped = pipe(
        make(),
        helper((value: string) => value),
      );

      expect([...direct]).toStrictEqual([
        ["a", select([0])],
        ["b", select([1])],
        ["c", select([2])],
      ]);
      expect(piped).toStrictEqual(direct);
    });

    test("consumes one iterator and calls keyOf once per value with only the value", () => {
      function* values() {
        yield "a";
        yield "b";
        yield "a";
      }
      const iterator = values();
      const acquire = vi.fn(() => iterator);
      const input = { [Symbol.iterator]: acquire };
      const keyOf = vi.fn((value: string) => value);

      expect([...helper(input, keyOf)]).toStrictEqual([
        ["a", select([0, 2])],
        ["b", select([1])],
      ]);
      expect(acquire).toHaveBeenCalledTimes(1);
      expect(keyOf.mock.calls).toStrictEqual([["a"], ["b"], ["a"]]);
      expect(iterator.next().done).toBe(true);
    });

    test("does not call keyOf for empty input", () => {
      const keyOf = vi.fn((value: string) => value);

      expect(helper([], keyOf)).toStrictEqual(new Map());
      expect(keyOf).not.toHaveBeenCalled();
    });

    test("uses native object identity even for structurally and Effect-equal keys", () => {
      const first = { id: "a" };
      const second = { id: "a" };
      expect(Equal.equals(first, second)).toBe(true);
      const result = helper([first, second, first], (value) => value);
      expect(result.size).toBe(2);
      expect([...result]).toStrictEqual([
        [first, select([0, 2])],
        [second, select([1])],
      ]);
      expect([...result.keys()][0]).toBe(first);
      expect([...result.keys()][1]).toBe(second);
    });

    test("uses SameValueZero equality and supports nullish keys", () => {
      const result = helper(
        [Number.NaN, 0, -0, Number.NaN, null, undefined, null, undefined],
        (value) => value,
      );

      expect([...result]).toStrictEqual([
        [Number.NaN, select([0, 3])],
        [0, select([1, 2])],
        [null, select([4, 6])],
        [undefined, select([5, 7])],
      ]);
    });

    test("leaves the original array and its elements unchanged", () => {
      const input = [{ key: "a" }, { key: "b" }, { key: "a" }];

      expect([...helper(input, (value) => value.key)]).toStrictEqual([
        ["a", select([0, 2])],
        ["b", select([1])],
      ]);
      // Assert on the original input reference, including its element objects.
      expect(input).toStrictEqual([{ key: "a" }, { key: "b" }, { key: "a" }]);
    });

    test("leaves the original Set unchanged", () => {
      const input = new Set(["a", "b"]);

      expect([...helper(input, (value) => value)]).toStrictEqual([
        ["a", select([0])],
        ["b", select([1])],
      ]);
      // Assert on the original input reference, rather than the result.
      expect([...input]).toStrictEqual(["a", "b"]);
    });

    test.each([null, undefined])(
      "throws TypeError for a nullish iterable: %s",
      (input) => {
        expect(() => {
          // @ts-expect-error - untyped callers may pass a nullish iterable
          helper(input, (value: string) => value);
        }).toThrow(TypeError);
        expect(() => {
          // @ts-expect-error - untyped callers may pipe a nullish iterable
          helper((value: string) => value)(input);
        }).toThrow(TypeError);
      },
    );
  });

  describe("indexes and indices", () => {
    test("allocates independent buckets for each key and each call", () => {
      const input = ["a", "b", "a"];
      const first = indexes(input, (value) => value);
      const second = indexes(input, (value) => value);

      expect(first).toStrictEqual(
        new Map([
          ["a", [0, 2]],
          ["b", [1]],
        ]),
      );
      // Assert on the original input reference before mutating an output bucket.
      expect(input).toStrictEqual(["a", "b", "a"]);
      expect(first.get("a")).not.toBe(first.get("b"));
      expect(first.get("a")).not.toBe(second.get("a"));
      expect(first.get("b")).not.toBe(second.get("b"));
      first.get("a")?.push(99);
      expect(first.get("a")).toStrictEqual([0, 2, 99]);
      expect(first.get("b")).toStrictEqual([1]);
      expect(second).toStrictEqual(
        new Map([
          ["a", [0, 2]],
          ["b", [1]],
        ]),
      );
    });

    test("indices is the same function and supports both call styles", () => {
      const input = ["a", "b", "a"];

      expect(indices).toBe(indexes);
      expect(indices(input, (value) => value)).toStrictEqual(
        indexes(input, (value) => value),
      );
      expect(
        pipe(
          input,
          indices((value: string) => value),
        ),
      ).toStrictEqual(indexes(input, (value) => value));
    });

    test("infers the callback input and exact key and result types", () => {
      const input: readonly { key: "a" | "b" }[] = [{ key: "a" }];
      const direct = indexes(input, (value) => {
        expectTypeOf(value).toEqualTypeOf<{ key: "a" | "b" }>();
        return value.key;
      });
      const piped = pipe(
        input,
        indexes((value) => {
          expectTypeOf(value).toEqualTypeOf<{ key: "a" | "b" }>();
          return value.key;
        }),
      );
      const byKey = indexes((value: { key: { id: string } }) => value.key);

      expect(direct).toStrictEqual(new Map([["a", [0]]]));
      expect(piped).toStrictEqual(direct);
      expectTypeOf(direct).toEqualTypeOf<Map<"a" | "b", number[]>>();
      expectTypeOf(piped).toEqualTypeOf<Map<"a" | "b", number[]>>();
      expectTypeOf(byKey).toEqualTypeOf<
        (
          self: Iterable<{ key: { id: string } }>,
        ) => Map<{ id: string }, number[]>
      >();
      expectTypeOf(indices).toEqualTypeOf<typeof indexes>();
      expectTypeOf(indices(input, (value) => value.key)).toEqualTypeOf<
        Map<"a" | "b", number[]>
      >();
      expectTypeOf(
        pipe(
          input,
          indices((value) => value.key),
        ),
      ).toEqualTypeOf<Map<"a" | "b", number[]>>();
    });
  });

  describe.each([
    { name: "firstIndexes", helper: firstIndexes },
    { name: "lastIndexes", helper: lastIndexes },
  ])("$name inference", ({ helper }) => {
    test("infers the callback input and exact key and result types", () => {
      const input: readonly { key: "a" | "b" }[] = [{ key: "a" }];
      const direct = helper(input, (value) => {
        expectTypeOf(value).toEqualTypeOf<{ key: "a" | "b" }>();
        return value.key;
      });
      const piped = pipe(
        input,
        helper((value) => {
          expectTypeOf(value).toEqualTypeOf<{ key: "a" | "b" }>();
          return value.key;
        }),
      );
      const byKey = helper((value: { key: { id: string } }) => value.key);

      expect(direct).toStrictEqual(new Map([["a", 0]]));
      expect(piped).toStrictEqual(direct);
      expectTypeOf(direct).toEqualTypeOf<Map<"a" | "b", number>>();
      expectTypeOf(piped).toEqualTypeOf<Map<"a" | "b", number>>();
      expectTypeOf(byKey).toEqualTypeOf<
        (self: Iterable<{ key: { id: string } }>) => Map<{ id: string }, number>
      >();
    });
  });

  describe("getOrElseSetGet", () => {
    test("when value exists already, it returns the existing value", () => {
      const map = new Map<string, string>([["a", "1"]]);

      expect(getOrElseSetGet(map, "a", () => "2")).toBe("1");

      // And now the value should be untouched
      expect(map.get("a")).toBe("1");
    });

    test("when value does not exist, it sets the value and returns the fallback value", () => {
      const map = new Map<string, string>();

      expect(getOrElseSetGet(map, "b", () => "2")).toBe("2");

      // And now the value should be set
      expect(map.get("b")).toBe("2");
    });

    test("data-last (piped)", () => {
      const map = new Map<string, string>();

      // Miss: stores and returns the fallback
      expect(
        pipe(
          map,
          getOrElseSetGet("b", () => "2"),
        ),
      ).toBe("2");
      expect(map.get("b")).toBe("2");

      // Hit: returns the existing value, fallback ignored
      expect(
        pipe(
          map,
          getOrElseSetGet("b", () => "99"),
        ),
      ).toBe("2");
    });

    test("calls the data-first fallback once on a miss and not on a hit", () => {
      const map = new Map<string, string>();
      let misses = 0;

      expect(
        getOrElseSetGet(map, "a", () => {
          misses = misses + 1;
          return "fallback";
        }),
      ).toBe("fallback");
      expect(misses).toBe(1);

      let hits = 0;
      expect(
        getOrElseSetGet(map, "a", () => {
          hits = hits + 1;
          return "ignored";
        }),
      ).toBe("fallback");
      expect(hits).toBe(0);
    });

    test("calls the data-last fallback once on a miss and not on a hit", () => {
      const map = new Map<string, string>();
      let misses = 0;

      expect(
        pipe(
          map,
          getOrElseSetGet("a", () => {
            misses = misses + 1;
            return "fallback";
          }),
        ),
      ).toBe("fallback");
      expect(misses).toBe(1);

      let hits = 0;
      expect(
        pipe(
          map,
          getOrElseSetGet("a", () => {
            hits = hits + 1;
            return "ignored";
          }),
        ),
      ).toBe("fallback");
      expect(hits).toBe(0);
    });

    test("returns the value stored by an object fallback", () => {
      const map = new Map<string, string[]>();
      const value = getOrElseSetGet(map, "a", () => []);

      expect(value).toBe(map.get("a"));
      value.push("item");
      expect(map.get("a")).toEqual(["item"]);
    });

    test.each([null, undefined])(
      "stores and returns a nullish fallback on a miss",
      (fallback) => {
        const map = new Map<string, null | undefined>();

        expect(getOrElseSetGet(map, "a", () => fallback)).toBe(fallback);
        expect(map.has("a")).toBe(true);
        expect(map.get("a")).toBe(fallback);
      },
    );

    test("throws when the stored value is nullish", () => {
      const map = new Map<string, string | null>([["a", null]]);

      expect(() => getOrElseSetGet(map, "a", () => "fallback")).toThrow(
        "Value is nullable: a",
      );
    });
  });
});
