import { Option, Order, pipe } from "effect";
import { describe, expect, test } from "vitest";
import {
  collectBy,
  getOrThrow,
  getOrThrowWith,
  isNonEmptyRecord,
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
});
