import { Option, Order, pipe } from "effect";
import { describe, expect, test } from "vitest";
import {
  canonicalize,
  collectBy,
  deepMerge,
  deepMergeReducer,
  deleteByPath,
  getOrThrow,
  getOrThrowWith,
  isNonEmptyRecord,
  keysAs,
  modifyIfExists,
  takeFirstWhere,
  takeLast,
  takeLastWhere,
  upsert,
} from "./RecordX.js";

describe("Record utils", () => {
  describe("isNonEmptyRecord", () => {
    test("empty record", () => {
      expect(isNonEmptyRecord({})).toBe(false);
    });

    test("non-empty record", () => {
      expect(isNonEmptyRecord({ a: 1 })).toBe(true);
    });
  });

  describe("takeFirstWhere", () => {
    const numberIsEven = (value: number): value is number => value % 2 === 0;

    test("empty record", () => {
      expect(
        pipe({}, takeFirstWhere(numberIsEven, Order.Number)),
      ).toStrictEqual(Option.none());
    });

    test("no match", () => {
      expect(
        pipe(
          { three: 3, one: 1, five: 5 },
          takeFirstWhere(numberIsEven, Order.Number),
        ),
      ).toStrictEqual(Option.none());
    });

    test("match", () => {
      expect(
        pipe(
          { three: 3, four: 4, one: 1, two: 2, five: 5 },
          takeFirstWhere(numberIsEven, Order.Number),
        ),
      ).toStrictEqual(Option.some(2));
    });
  });

  describe("takeLastWhere", () => {
    const numberIsEven = (value: number): value is number => value % 2 === 0;

    test("empty record", () => {
      expect(pipe({}, takeLastWhere(numberIsEven, Order.Number))).toStrictEqual(
        Option.none(),
      );
    });

    test("no match", () => {
      expect(
        pipe(
          { three: 3, one: 1, five: 5 },
          takeLastWhere(numberIsEven, Order.Number),
        ),
      ).toStrictEqual(Option.none());
    });

    test("match", () => {
      expect(
        pipe(
          { three: 3, four: 4, one: 1, two: 2, five: 5 },
          takeLastWhere(numberIsEven, Order.Number),
        ),
      ).toStrictEqual(Option.some(4));
    });
  });

  describe("takeLast", () => {
    test("empty record", () => {
      expect(pipe({}, takeLast(Order.Number))).toStrictEqual(Option.none());
    });

    test("non-empty record", () => {
      expect(
        pipe(
          { three: 3, four: 4, one: 1, two: 2, five: 5 },
          takeLast(Order.Number),
        ),
      ).toStrictEqual(Option.some(5));
    });
  });

  describe("getOrThrow", () => {
    test("works", () => {
      const record: Record<string, string> = { id: "1" };

      expect(getOrThrow(record, "id")).toBe("1");
      expect(() => getOrThrow(record, "name")).toThrow(
        "Key name not found in record",
      );
    });

    test("works data-first or data-last", () => {
      const record: Record<string, string> = { id: "1" };

      // Data-first
      expect(getOrThrow(record, "id")).toBe("1");

      // Data-last
      expect(pipe(record, getOrThrow("id"))).toBe("1");
    });
  });

  describe("getOrThrowWith", () => {
    const customKeyLookupError =
      <K extends PropertyKey, R extends Record<K, unknown>>(record: R) =>
      (key: K) =>
        `Record has ${Object.keys(record).length} key(s), but "${String(key)}" was not one of them`;

    test("works", () => {
      const record: Record<string, string> = { id: "1" };

      expect(getOrThrowWith(record, "id", customKeyLookupError(record))).toBe(
        "1",
      );

      expect(() =>
        getOrThrowWith(record, "name", customKeyLookupError(record)),
      ).toThrow('Record has 1 key(s), but "name" was not one of them');
    });

    test("works data-first or data-last", () => {
      const record: Record<string, string> = { id: "1" };

      // Data-first
      expect(getOrThrowWith(record, "id", customKeyLookupError(record))).toBe(
        "1",
      );

      // Data-last
      expect(
        pipe(record, getOrThrowWith("id", customKeyLookupError(record))),
      ).toBe("1");
    });
  });

  describe("upsert", () => {
    test("replacing existing value", () => {
      const record: Record<string, string> = { id: "1" };

      expect(
        upsert(
          record,
          "id",
          Option.match({
            onNone: () => "initial",
            onSome: (v) => `${v} updated`,
          }),
        ),
      ).toStrictEqual({ id: "1 updated" });
    });

    test("adding new value", () => {
      const record: Record<string, string> = { name: "One" };

      expect(
        upsert(
          record,
          "id",
          Option.match({
            onNone: () => "initial",
            onSome: (v) => `${v} updated`,
          }),
        ),
      ).toStrictEqual({ id: "initial", name: "One" });
    });
  });

  describe("collectBy", () => {
    test("no conflicts", () => {
      expect(
        collectBy(
          [
            { id: "a", name: "i am a" },
            { id: "b", name: "i am b" },
          ],
          (v) => v.id,
        ),
      ).toStrictEqual({
        a: { id: "a", name: "i am a" },
        b: { id: "b", name: "i am b" },
      });
    });

    test("with conflicts", () => {
      expect(
        collectBy(
          [
            { id: "a", name: "i am a" },
            { id: "b", name: "i am b" },
            { id: "a", name: "i am a but i win" },
          ],
          (v) => v.id,
        ),
      ).toStrictEqual({
        a: { id: "a", name: "i am a but i win" },
        b: { id: "b", name: "i am b" },
      });
    });

    test("works data-first or data-last", () => {
      const collector = (v: { id: string }) => v.id;

      const data = [
        { id: "a", name: "i am a" },
        { id: "b", name: "i am b" },
      ];

      const expectedResult = {
        a: { id: "a", name: "i am a" },
        b: { id: "b", name: "i am b" },
      };

      // Data-first
      expect(collectBy(data, collector)).toStrictEqual(expectedResult);

      // Data-last
      expect(pipe(data, collectBy(collector))).toStrictEqual(expectedResult);
    });
  });

  describe("modifyIfExists", () => {
    test("modifies the value when key exists", () => {
      const input = { a: 1, b: 2, c: 3 };
      const result = modifyIfExists(input, "b", (n) => n * 10);
      expect(result).toStrictEqual({ a: 1, b: 20, c: 3 });
    });

    test("returns the record unchanged when key is absent", () => {
      const input = { a: 1, b: 2 };
      const result = modifyIfExists(
        input as Record<string, number>,
        "missing",
        (n) => n * 10,
      );
      expect(result).toStrictEqual({ a: 1, b: 2 });
    });

    test("does not call the modifier function when key is absent", () => {
      const input = { a: 1 };
      let calls = 0;
      modifyIfExists(input as Record<string, number>, "missing", (n) => {
        calls = calls + 1;
        return n + 1;
      });
      expect(calls).toBe(0);
    });

    test("calls the modifier function exactly once when key exists", () => {
      const input = { a: 1, b: 2 };
      let calls = 0;
      modifyIfExists(input, "a", (n) => {
        calls = calls + 1;
        return n + 1;
      });
      expect(calls).toBe(1);
    });

    test("modifying a nullable value preserves null", () => {
      const input: Record<string, string | null> = { a: "hello", b: null };
      const result = modifyIfExists(input, "b", (v) => v ?? "fallback");
      expect(result).toStrictEqual({ a: "hello", b: "fallback" });
    });

    test("data-last form composes with pipe", () => {
      const input = { a: 1, b: 2 };
      const result = pipe(
        input,
        modifyIfExists("a", (n) => n * 100),
      );
      expect(result).toStrictEqual({ a: 100, b: 2 });
    });

    test("can chain multiple data-last modifications", () => {
      const input = { a: 1, b: 2 };
      const result = pipe(
        input,
        modifyIfExists("a", (n) => n + 10),
        modifyIfExists("b", (n) => n + 20),
      );
      expect(result).toStrictEqual({ a: 11, b: 22 });
    });

    test("modifying an empty record returns empty", () => {
      const input: Record<string, number> = {};
      const result = modifyIfExists(input, "anything", (n) => n + 1);
      expect(result).toStrictEqual({});
    });
  });

  describe("keysAs", () => {
    test("returns the same runtime value, re-typed", () => {
      type UserId = string & { readonly _brand: "UserId" };

      const byId: Record<string, number> = { u1: 10, u2: 20 };
      const branded = keysAs<UserId>()(byId);

      // Identical value and reference — purely a type-level reinterpretation.
      expect(branded).toStrictEqual({ u1: 10, u2: 20 });
      expect(branded).toBe(byId);
    });
  });

  describe("deepMerge", () => {
    test("merges plain objects recursively", () => {
      expect(
        deepMerge({ a: { x: 1 }, b: 2 }, { a: { y: 3 }, c: 4 }),
      ).toStrictEqual({ a: { x: 1, y: 3 }, b: 2, c: 4 });
    });

    test("b wins on leaf conflicts", () => {
      expect(deepMerge({ a: 1 }, { a: 2 })).toStrictEqual({ a: 2 });
    });

    test("replaces arrays and primitives wholesale with b", () => {
      expect(deepMerge({ a: [1, 2] }, { a: [3] })).toStrictEqual({ a: [3] });
      expect(deepMerge(1, 2)).toBe(2);
      expect(deepMerge({ a: 1 }, "x")).toBe("x");
    });

    test("returns b when either side isn't a plain object", () => {
      const map = new Map();
      expect(deepMerge(map, { a: 1 })).toStrictEqual({ a: 1 });
      expect(deepMerge({ a: 1 }, map)).toBe(map);
    });

    test("does not mutate either input", () => {
      const a = { nested: { x: 1 } };
      const b = { nested: { y: 2 } };
      deepMerge(a, b);
      expect(a).toStrictEqual({ nested: { x: 1 } });
      expect(b).toStrictEqual({ nested: { y: 2 } });
    });

    test("data-last (pipeable) merges the override onto the piped base", () => {
      expect(pipe({ a: 1 }, deepMerge({ b: 2 }))).toStrictEqual({ a: 1, b: 2 });
    });
  });

  describe("deepMergeReducer", () => {
    test("folds object layers left-to-right (later wins on leaf conflicts)", () => {
      expect(
        deepMergeReducer.combineAll([
          { a: { x: 1 } },
          { a: { y: 2 }, b: 3 },
          { b: 4 },
        ]),
      ).toStrictEqual({ a: { x: 1, y: 2 }, b: 4 });
    });

    test("returns the identity {} for an empty list", () => {
      expect(deepMergeReducer.combineAll([])).toStrictEqual({});
    });

    test("returns the single layer unchanged for a one-element list", () => {
      expect(deepMergeReducer.combineAll([{ a: 1 }])).toStrictEqual({ a: 1 });
    });
  });

  describe("canonicalize", () => {
    test("recursively sorts object keys", () => {
      expect(JSON.stringify(canonicalize({ b: 1, a: { d: 1, c: 2 } }))).toBe(
        JSON.stringify({ a: { c: 2, d: 1 }, b: 1 }),
      );
    });

    test("preserves array order and canonicalizes elements", () => {
      expect(canonicalize([3, 1, 2])).toStrictEqual([3, 1, 2]);
      expect(canonicalize([{ b: 1, a: 2 }])).toStrictEqual([{ a: 2, b: 1 }]);
    });

    test("passes primitives through", () => {
      expect(canonicalize("x")).toBe("x");
      expect(canonicalize(5)).toBe(5);
      expect(canonicalize(null)).toBe(null);
    });

    test("passes non-record objects (e.g. Map) through unchanged", () => {
      const map = new Map();
      expect(canonicalize(map)).toBe(map);
    });
  });

  describe("deleteByPath", () => {
    test("deletes a nested key and prunes parents that become empty", () => {
      const result = deleteByPath({ a: { b: 1 } }, ["a", "b"]);
      expect(Option.isSome(result)).toBe(true);
      expect(Option.getOrThrow(result)).toStrictEqual({});
    });

    test("keeps parents that still have other keys", () => {
      const result = deleteByPath({ a: { b: 1, c: 2 } }, ["a", "b"]);
      expect(Option.getOrThrow(result)).toStrictEqual({ a: { c: 2 } });
    });

    test("deletes a top-level key", () => {
      const result = deleteByPath({ a: 1, b: 2 }, ["a"]);
      expect(Option.getOrThrow(result)).toStrictEqual({ b: 2 });
    });

    test("returns None when the path is absent", () => {
      expect(Option.isNone(deleteByPath({ a: 1 }, ["b"]))).toBe(true);
      expect(Option.isNone(deleteByPath({ a: 1 }, ["a", "b"]))).toBe(true);
    });

    test("returns None for an empty path or a non-record input", () => {
      expect(Option.isNone(deleteByPath({ a: 1 }, []))).toBe(true);
      expect(Option.isNone(deleteByPath(42, ["a"]))).toBe(true);
    });

    test("does not mutate the input", () => {
      const input = { a: { b: 1, c: 2 } };
      deleteByPath(input, ["a", "b"]);
      expect(input).toStrictEqual({ a: { b: 1, c: 2 } });
    });

    test("data-last (pipeable) form", () => {
      const result = pipe({ a: { b: 1 } }, deleteByPath(["a", "b"]));
      expect(Option.getOrThrow(result)).toStrictEqual({});
    });
  });
});
