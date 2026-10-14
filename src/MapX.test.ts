import { describe, expect, expectTypeOf, it, test, vi } from "@effect/vitest";
import { Effect, Equal, pipe } from "effect";
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
    describe.each([false, true])(
      "direct and piped misses and hits agree (populated: %s)",
      (populated) => {
        it.effect("populates and reuses the same stored objects", () =>
          Effect.sync(() => {
            const existing = { name: "Notebook" };
            const entries: [string, { name: string }][] = populated
              ? [["notebook", existing]]
              : [];
            const directMap = new Map(entries);
            const pipedMap = new Map(entries);
            const directFallback = vi.fn(() => ({ name: "Coffee mug" }));
            const pipedFallback = vi.fn(() => ({ name: "Coffee mug" }));

            const direct = getOrElseSetGet(directMap, "mug", directFallback);
            const piped = pipe(pipedMap, getOrElseSetGet("mug", pipedFallback));

            expect(direct).toStrictEqual({ name: "Coffee mug" });
            expect(piped).toStrictEqual(direct);
            expect(direct).toBe(directMap.get("mug"));
            expect(piped).toBe(pipedMap.get("mug"));
            expect(directMap).toStrictEqual(
              new Map([...entries, ["mug", direct]]),
            );
            expect(pipedMap).toStrictEqual(directMap);
            expect(directMap.get("notebook")).toBe(entries[0]?.[1]);
            expect(pipedMap.get("notebook")).toBe(entries[0]?.[1]);
            expect(directFallback).toHaveBeenCalledExactlyOnceWith();
            expect(pipedFallback).toHaveBeenCalledExactlyOnceWith();

            const directHitFallback = vi.fn(() => ({
              name: "Replacement mug",
            }));
            const pipedHitFallback = vi.fn(() => ({ name: "Replacement mug" }));
            expect(getOrElseSetGet(directMap, "mug", directHitFallback)).toBe(
              direct,
            );
            expect(
              pipe(pipedMap, getOrElseSetGet("mug", pipedHitFallback)),
            ).toBe(piped);
            expect(directHitFallback).not.toHaveBeenCalled();
            expect(pipedHitFallback).not.toHaveBeenCalled();
            expect(directMap).toStrictEqual(
              new Map([...entries, ["mug", direct]]),
            );
            expect(pipedMap).toStrictEqual(directMap);
          }),
        );
      },
    );

    it.effect("returns the value stored by an object fallback", () =>
      Effect.sync(() => {
        const map = new Map<string, string[]>();
        const value = getOrElseSetGet(map, "a", () => []);

        expect(value).toBe(map.get("a"));
        value.push("item");
        expect(map.get("a")).toEqual(["item"]);
      }),
    );

    describe.each([null, undefined])(
      "direct and piped misses store and return a nullish fallback: %s",
      (value) => {
        it.effect("stores the result and calls each fallback once", () =>
          Effect.sync(() => {
            const directMap = new Map<string, null | undefined>();
            const pipedMap = new Map<string, null | undefined>();
            const directFallback = vi.fn(() => value);
            const pipedFallback = vi.fn(() => value);

            const direct = getOrElseSetGet(directMap, "a", directFallback);
            const piped = pipe(pipedMap, getOrElseSetGet("a", pipedFallback));

            expect(direct).toBe(value);
            expect(piped).toBe(direct);
            expect(directMap.has("a")).toBe(true);
            expect(pipedMap.has("a")).toBe(true);
            expect(directMap.get("a")).toBe(value);
            expect(pipedMap.get("a")).toBe(value);
            expect(directMap).toStrictEqual(new Map([["a", value]]));
            expect(pipedMap).toStrictEqual(directMap);
            expect(directFallback).toHaveBeenCalledExactlyOnceWith();
            expect(pipedFallback).toHaveBeenCalledExactlyOnceWith();
          }),
        );
      },
    );

    describe.each([null, undefined])(
      "direct and piped hits throw for stored nullish values: %s",
      (value) => {
        it.effect("throws equivalent errors without mutating either map", () =>
          Effect.sync(() => {
            const entries: [string, string | null | undefined][] = [
              ["a", value],
              ["other", "untouched"],
            ];
            const directMap = new Map(entries);
            const pipedMap = new Map(entries);
            const directFallback = vi.fn(() => "fallback");
            const pipedFallback = vi.fn(() => "fallback");
            const directCall = vi.fn(() =>
              getOrElseSetGet(directMap, "a", directFallback),
            );
            const pipedCall = vi.fn(() =>
              pipe(
                pipedMap,
                getOrElseSetGet<string, string | null | undefined>(
                  "a",
                  pipedFallback,
                ),
              ),
            );

            expect(directCall).toThrow(new Error("Value is nullable: a"));
            expect(pipedCall).toThrow(new Error("Value is nullable: a"));
            expect(directCall.mock.results[0]?.value).toBeInstanceOf(Error);
            expect(pipedCall.mock.results[0]?.value).toBeInstanceOf(Error);
            expect(pipedCall.mock.results[0]?.value).toStrictEqual(
              directCall.mock.results[0]?.value,
            );
            expect(directFallback).not.toHaveBeenCalled();
            expect(pipedFallback).not.toHaveBeenCalled();
            expect(directMap).toStrictEqual(new Map(entries));
            expect(pipedMap).toStrictEqual(directMap);
          }),
        );
      },
    );

    describe.each([0, false, "", Number.NaN])(
      "direct and piped hits return stored falsy values unchanged: %s",
      (value) => {
        it.effect(
          "returns the stored value without calling either fallback",
          () =>
            Effect.sync(() => {
              const directMap = new Map([["a", value]]);
              const pipedMap = new Map([["a", value]]);
              const directFallback = vi.fn(() => value);
              const pipedFallback = vi.fn(() => value);

              const direct = getOrElseSetGet(directMap, "a", directFallback);
              const piped = pipe(pipedMap, getOrElseSetGet("a", pipedFallback));

              expect(direct).toBe(value);
              expect(piped).toBe(direct);
              expect(directFallback).not.toHaveBeenCalled();
              expect(pipedFallback).not.toHaveBeenCalled();
              expect(directMap).toStrictEqual(new Map([["a", value]]));
              expect(pipedMap).toStrictEqual(directMap);
            }),
        );
      },
    );

    describe.each([false, true])(
      "direct and piped throwing fallbacks preserve the map (populated: %s)",
      (populated) => {
        it.effect(
          "propagates the same error and leaves both maps unchanged",
          () =>
            Effect.sync(() => {
              const existing = { name: "Notebook" };
              const entries: [string, { name: string }][] = populated
                ? [["notebook", existing]]
                : [];
              const directMap = new Map(entries);
              const pipedMap = new Map(entries);
              const error = new Error("Catalogue unavailable");
              const directFallback = vi.fn(() => {
                throw error;
              });
              const pipedFallback = vi.fn(() => {
                throw error;
              });
              const directCall = vi.fn(() =>
                getOrElseSetGet(directMap, "mug", directFallback),
              );
              const pipedCall = vi.fn(() =>
                pipe(
                  pipedMap,
                  getOrElseSetGet<string, { name: string }>(
                    "mug",
                    pipedFallback,
                  ),
                ),
              );

              expect(directCall).toThrow(error);
              expect(pipedCall).toThrow(error);
              expect(directCall.mock.results[0]?.value).toBe(error);
              expect(pipedCall.mock.results[0]?.value).toBe(error);
              expect(directFallback).toHaveBeenCalledExactlyOnceWith();
              expect(pipedFallback).toHaveBeenCalledExactlyOnceWith();
              expect(directMap.has("mug")).toBe(false);
              expect(pipedMap.has("mug")).toBe(false);
              expect(directMap).toStrictEqual(new Map(entries));
              expect(pipedMap).toStrictEqual(directMap);
              expect(directMap.get("notebook")).toBe(entries[0]?.[1]);
              expect(pipedMap.get("notebook")).toBe(entries[0]?.[1]);
            }),
        );
      },
    );

    describe.each([null, undefined])(
      "rejects a nullish map in both call styles: %s",
      (map) => {
        it.effect("throws TypeError without calling either fallback", () =>
          Effect.sync(() => {
            const directFallback = vi.fn(() => "fallback");
            const pipedFallback = vi.fn(() => "fallback");

            expect(() => {
              // @ts-expect-error - null and undefined are invalid maps from untyped callers
              getOrElseSetGet(map, "a", directFallback);
            }).toThrow(TypeError);
            expect(() => {
              // @ts-expect-error - a piped nullish input is not a Map
              pipe(map, getOrElseSetGet("a", pipedFallback));
            }).toThrow(TypeError);
            expect(directFallback).not.toHaveBeenCalled();
            expect(pipedFallback).not.toHaveBeenCalled();
          }),
        );
      },
    );
  });
});
