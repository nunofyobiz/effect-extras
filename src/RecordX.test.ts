import { expect } from "@effect/vitest";
import { Array, Option, Order, Predicate, pipe } from "effect";
import { assert, describe, expectTypeOf, test, vi } from "vitest";
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

    test("counts only own enumerable string keys", () => {
      expect(isNonEmptyRecord({ theme: "dark", autosave: true })).toBe(true);
      expect(isNonEmptyRecord({ [Symbol("theme")]: "dark" })).toBe(false);
      const settings: Record<string, unknown> = Object.create({
        theme: "dark",
      });
      Object.defineProperty(settings, "autosave", { value: true });
      expect(isNonEmptyRecord(settings)).toBe(false);
    });

    test("untyped array input follows its enumerable keys", () => {
      // @ts-expect-error - arrays are not string-keyed settings records
      expect(isNonEmptyRecord<string, number>([])).toBe(false);
      // @ts-expect-error - arrays are not string-keyed settings records
      expect(isNonEmptyRecord<string, number>([14])).toBe(true);
    });
  });

  test("ordered getters consider only own enumerable string-keyed values", () => {
    const prices: Record<string | symbol, number> = Object.create({ lamp: 35 });
    prices.mug = 12;
    prices[Symbol("notebook")] = 8;
    Object.defineProperty(prices, "chair", { value: 50 });
    const first = takeFirstWhere(prices, Predicate.isNumber, Order.Number);
    const lastWhere = takeLastWhere(prices, Predicate.isNumber, Order.Number);
    const last = takeLast(prices, Order.Number);
    expect(first).toStrictEqual(Option.some(12));
    expect(lastWhere).toStrictEqual(Option.some(12));
    expect(last).toStrictEqual(Option.some(12));
    expect(
      pipe(prices, takeFirstWhere(Predicate.isNumber, Order.Number)),
    ).toStrictEqual(first);
    expect(
      pipe(prices, takeLastWhere(Predicate.isNumber, Order.Number)),
    ).toStrictEqual(lastWhere);
    expect(pipe(prices, takeLast(Order.Number))).toStrictEqual(last);
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

    test.each([
      { prices: {}, expected: Option.none<number>() },
      { prices: { mug: 12 }, expected: Option.some(12) },
      { prices: { mug: null }, expected: Option.none<number>() },
      {
        prices: { mug: null, notebook: 8, lamp: 35 },
        expected: Option.some(8),
      },
      {
        prices: { mug: -10, notebook: 0, lamp: 10 },
        expected: Option.some(-10),
      },
    ])(
      "both forms select the lowest eligible price from $prices",
      ({ prices, expected }) => {
        const input: Record<string, number | null> = prices;
        const dataFirst = takeFirstWhere(
          input,
          Predicate.isNumber,
          Order.Number,
        );
        const dataLast = pipe(
          input,
          takeFirstWhere(Predicate.isNumber, Order.Number),
        );
        expect(dataFirst).toStrictEqual(expected);
        expect(dataLast).toStrictEqual(dataFirst);
        expectTypeOf(dataFirst).toEqualTypeOf<Option.Option<number>>();
        expectTypeOf(dataLast).toEqualTypeOf<Option.Option<number>>();
      },
    );

    test("reversed ordering selects the maximum", () => {
      const prices = { mug: 12, notebook: 8 };
      const order = Order.flip(Order.Number);
      const dataFirst = takeFirstWhere(prices, Predicate.isNumber, order);
      expect(dataFirst).toStrictEqual(Option.some(12));
      expect(
        pipe(prices, takeFirstWhere(Predicate.isNumber, order)),
      ).toStrictEqual(dataFirst);
    });

    test("equal-ranked products keep the first matching value", () => {
      const mug = { id: "mug", price: 12 };
      const notebook = { id: "notebook", price: 12 };
      const products = { mug, unavailable: null, notebook };
      const order = Order.mapInput(
        Order.Number,
        (product: typeof mug) => product.price,
      );
      const dataFirst = takeFirstWhere(products, Predicate.isNotNull, order);
      expect(dataFirst).toStrictEqual(Option.some(mug));
      expect(Option.getOrThrow(dataFirst)).toBe(mug);
      expect(
        pipe(products, takeFirstWhere(Predicate.isNotNull, order)),
      ).toStrictEqual(dataFirst);
    });

    test("untyped arrays supply values in the same way as records", () => {
      expect(
        takeFirstWhere<string, number | null, number>(
          // @ts-expect-error - arrays do not implement a string-keyed price record
          [12, null, 8],
          Predicate.isNumber,
          Order.Number,
        ),
      ).toStrictEqual(Option.some(8));
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

    test.each([
      { prices: {}, expected: Option.none<number>() },
      { prices: { mug: 12 }, expected: Option.some(12) },
      { prices: { mug: null }, expected: Option.none<number>() },
      {
        prices: { mug: null, notebook: 8, lamp: 35 },
        expected: Option.some(35),
      },
      {
        prices: { mug: -10, notebook: 0, lamp: 10 },
        expected: Option.some(10),
      },
    ])(
      "both forms select the highest eligible price from $prices",
      ({ prices, expected }) => {
        const input: Record<string, number | null> = prices;
        const dataFirst = takeLastWhere(
          input,
          Predicate.isNumber,
          Order.Number,
        );
        const dataLast = pipe(
          input,
          takeLastWhere(Predicate.isNumber, Order.Number),
        );
        expect(dataFirst).toStrictEqual(expected);
        expect(dataLast).toStrictEqual(dataFirst);
        expectTypeOf(dataFirst).toEqualTypeOf<Option.Option<number>>();
        expectTypeOf(dataLast).toEqualTypeOf<Option.Option<number>>();
      },
    );

    test("reversed ordering selects the minimum", () => {
      const prices = { mug: 12, notebook: 8 };
      const order = Order.flip(Order.Number);
      const dataFirst = takeLastWhere(prices, Predicate.isNumber, order);
      expect(dataFirst).toStrictEqual(Option.some(8));
      expect(
        pipe(prices, takeLastWhere(Predicate.isNumber, order)),
      ).toStrictEqual(dataFirst);
    });

    test("equal-ranked products keep the first matching value", () => {
      const mug = { id: "mug", price: 12 };
      const notebook = { id: "notebook", price: 12 };
      const products = { mug, unavailable: null, notebook };
      const order = Order.mapInput(
        Order.Number,
        (product: typeof mug) => product.price,
      );
      const dataFirst = takeLastWhere(products, Predicate.isNotNull, order);
      // TakeLastWhere reverses the ranking, so equal-ranked matches still keep the first value.
      expect(dataFirst).toStrictEqual(Option.some(mug));
      expect(Option.getOrThrow(dataFirst)).toBe(mug);
      expect(
        pipe(products, takeLastWhere(Predicate.isNotNull, order)),
      ).toStrictEqual(dataFirst);
    });

    test("untyped arrays supply values in the same way as records", () => {
      expect(
        takeLastWhere<string, number | null, number>(
          // @ts-expect-error - arrays do not implement a string-keyed price record
          [12, null, 8],
          Predicate.isNumber,
          Order.Number,
        ),
      ).toStrictEqual(Option.some(12));
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

    test.each([
      { prices: {}, expected: Option.none<number>() },
      { prices: { mug: 12 }, expected: Option.some(12) },
      { prices: { mug: 12, notebook: 12 }, expected: Option.some(12) },
      {
        prices: { mug: -10, notebook: 0, lamp: 10 },
        expected: Option.some(10),
      },
    ])("both forms select the maximum from $prices", ({ prices, expected }) => {
      const input: Record<string, number> = prices;
      const dataFirst = takeLast(input, Order.Number);
      expect(dataFirst).toStrictEqual(expected);
      expect(pipe(input, takeLast(Order.Number))).toStrictEqual(dataFirst);
    });

    test("reversed ordering selects the minimum", () => {
      const prices = { mug: 12, notebook: 8 };
      const order = Order.flip(Order.Number);
      const dataFirst = takeLast(prices, order);
      expect(dataFirst).toStrictEqual(Option.some(8));
      expect(pipe(prices, takeLast(order))).toStrictEqual(dataFirst);
    });

    test("equal-ranked products keep the last value", () => {
      const mug = { id: "mug", price: 12 };
      const notebook = { id: "notebook", price: 12 };
      const products = { mug, notebook };
      const order = Order.mapInput(
        Order.Number,
        (product: typeof mug) => product.price,
      );
      const dataFirst = takeLast(products, order);
      expect(dataFirst).toStrictEqual(Option.some(notebook));
      expect(Option.getOrThrow(dataFirst)).toBe(notebook);
      expect(pipe(products, takeLast(order))).toStrictEqual(dataFirst);
    });

    test("untyped arrays supply values in the same way as records", () => {
      // @ts-expect-error - arrays do not implement a string-keyed price record
      expect(takeLast<string, number>([12, 8], Order.Number)).toStrictEqual(
        Option.some(12),
      );
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

      const dataFirst = getOrThrow(record, "id");
      expect(dataFirst).toBe("1");
      expect(pipe(record, getOrThrow("id"))).toBe(dataFirst);
    });

    test.each([undefined, null, false, 0, ""])(
      "returns a present %s rather than throwing",
      (value) => {
        const record = { setting: value };
        const dataFirst = getOrThrow(record, "setting");
        expect(dataFirst).toBe(value);
        expect(pipe(record, getOrThrow("setting"))).toBe(dataFirst);
      },
    );

    test.each([
      { record: {}, message: "Key lamp not found in record\nExisting keys=" },
      {
        record: { mug: 12, notebook: 8 },
        message: "Key lamp not found in record\nExisting keys=mug,notebook",
      },
    ])(
      "both forms explain missing keys and existing entries",
      ({ record, message }) => {
        const prices: Record<string, number> = record;
        expect(() => getOrThrow(prices, "lamp")).toThrow(message);
        expect(() => pipe(prices, getOrThrow("lamp"))).toThrow(message);
      },
    );

    test("untyped missing key on a narrow record throws", () => {
      // @ts-expect-error - lamp is missing from this narrow product record
      expect(() => getOrThrow({ mug: 12 }, "lamp")).toThrow(
        "Key lamp not found",
      );
    });

    test("reads own symbol keys and reports missing symbols", () => {
      const key = Symbol("price");
      const record = { [key]: 12 };
      const dataFirst = getOrThrow(record, key);
      expect(dataFirst).toBe(12);
      expect(pipe(record, getOrThrow(key))).toBe(dataFirst);
      const empty: Record<symbol, number> = {};
      expect(() => getOrThrow(empty, key)).toThrow(
        "Key Symbol(price) not found in record\nExisting keys=",
      );
      expect(() => pipe(empty, getOrThrow(key))).toThrow(
        "Key Symbol(price) not found in record\nExisting keys=",
      );
    });

    test("ignores inherited keys but reads non-enumerable own keys", () => {
      const record: Record<string, number> = Object.create({ mug: 12 });
      Object.defineProperty(record, "notebook", { value: 8 });
      expect(getOrThrow(record, "notebook")).toBe(8);
      expect(() => getOrThrow(record, "mug")).toThrow("Key mug not found");
      expect(() => pipe(record, getOrThrow("mug"))).toThrow(
        "Key mug not found",
      );
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

      const dataFirst = getOrThrowWith(
        record,
        "id",
        customKeyLookupError(record),
      );
      expect(dataFirst).toBe("1");
      expect(
        pipe(record, getOrThrowWith("id", customKeyLookupError(record))),
      ).toBe(dataFirst);
    });

    test.each([undefined, null, false, 0, ""])(
      "a present %s does not create a failure",
      (value) => {
        const record = { setting: value };
        const onNone = vi.fn(() => new Error("missing"));
        const dataFirst = getOrThrowWith(record, "setting", onNone);
        expect(dataFirst).toBe(value);
        expect(pipe(record, getOrThrowWith("setting", onNone))).toBe(dataFirst);
        expect(onNone).not.toHaveBeenCalled();
      },
    );

    test.each([{}, { mug: 12 }])(
      "both forms throw the exact custom failure for a missing key",
      (record) => {
        const prices: Record<string, number> = record;
        const failure = new Error("Price unavailable");
        const onNone = vi.fn<(key: string) => Error>(() => failure);
        expect(() => getOrThrowWith(prices, "lamp", onNone)).toThrow(failure);
        expect(onNone.mock.calls).toStrictEqual([["lamp"]]);
        expect(() => pipe(prices, getOrThrowWith("lamp", onNone))).toThrow(
          failure,
        );
        expect(onNone.mock.calls).toStrictEqual([["lamp"], ["lamp"]]);
      },
    );

    test("untyped missing key throws the custom failure unchanged", () => {
      const failure = { reason: "missing price" };
      const onNone = vi.fn<(key: string) => typeof failure>(() => failure);
      const lookup = () => {
        // @ts-expect-error - lamp is missing from this narrow product record
        getOrThrowWith({ mug: 12 }, "lamp", onNone);
      };
      try {
        lookup();
        expect.unreachable("A missing product must throw");
      } catch (error) {
        expect(error).toBe(failure);
      }
      expect(onNone.mock.calls).toStrictEqual([["lamp"]]);
    });

    test("symbol keys use own entries and pass the missing symbol to onNone", () => {
      const key = Symbol("price");
      const record = { [key]: 12 };
      const failure = new Error("missing symbol");
      const onNone = vi.fn<(key: symbol) => Error>(() => failure);
      const dataFirst = getOrThrowWith(record, key, onNone);
      expect(dataFirst).toBe(12);
      expect(pipe(record, getOrThrowWith(key, onNone))).toBe(dataFirst);
      expect(onNone).not.toHaveBeenCalled();
      const inherited: Record<symbol, number> = Object.create(record);
      expect(() => getOrThrowWith(inherited, key, onNone)).toThrow(failure);
      expect(() => pipe(inherited, getOrThrowWith(key, onNone))).toThrow(
        failure,
      );
      expect(onNone.mock.calls).toStrictEqual([[key], [key]]);
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

    test.each([
      {
        input: {},
        key: "mug",
        current: Option.none<number>(),
        expected: { mug: 1 },
      },
      {
        input: { notebook: 2 },
        key: "mug",
        current: Option.none<number>(),
        expected: { notebook: 2, mug: 1 },
      },
      {
        input: { mug: 1 },
        key: "mug",
        current: Option.some(1),
        expected: { mug: 2 },
      },
    ])(
      "both forms insert or update $key in $input without mutation",
      ({ input, key, current, expected }) => {
        const views: Record<string, number> = input;
        const original = { ...views };
        const update = vi.fn(
          Option.match({
            onNone: () => 1,
            onSome: (count: number) => count + 1,
          }),
        );
        const dataFirst = upsert(views, key, update);
        expect(dataFirst).toStrictEqual(expected);
        expect(update.mock.calls).toStrictEqual([[current]]);
        expect(pipe(views, upsert(key, update))).toStrictEqual(dataFirst);
        expect(update.mock.calls).toStrictEqual([[current], [current]]);
        // The original views record retains its entries.
        expect(views).toStrictEqual(original);
        expect(dataFirst).not.toBe(views);
      },
    );

    test("distinguishes Some(undefined) from a missing value", () => {
      const input: Record<string, string | undefined> = { theme: undefined };
      const update = vi.fn<
        (current: Option.Option<string | undefined>) => string
      >(() => "dark");
      expect(upsert(input, "theme", update)).toStrictEqual({ theme: "dark" });
      expect(update.mock.calls).toStrictEqual([[Option.some(undefined)]]);
      expect(upsert(input, "font", update)).toStrictEqual({
        theme: undefined,
        font: "dark",
      });
      expect(update.mock.calls).toStrictEqual([
        [Option.some(undefined)],
        [Option.none()],
      ]);
    });

    test("preserves symbols and makes __proto__ an own data property", () => {
      const key = Symbol("views");
      const input: Record<string | symbol, number> = { [key]: 2, mug: 1 };
      const bump = Option.match({
        onNone: () => 1,
        onSome: (count: number) => count + 1,
      });
      const symbols = upsert(input, key, bump);
      expect(symbols).toStrictEqual({ [key]: 3, mug: 1 });
      expect(pipe(input, upsert(key, bump))).toStrictEqual(symbols);
      const result = upsert(input, "__proto__", bump);
      expect(result).toStrictEqual({ [key]: 2, mug: 1, ["__proto__"]: 1 });
      expect(pipe(input, upsert("__proto__", bump))).toStrictEqual(result);
      expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
      expect(Object.hasOwn(result, "__proto__")).toBe(true);
      // Neither insertion nor update changes the original lookup.
      expect(input).toStrictEqual({ [key]: 2, mug: 1 });
    });

    test("untyped numeric keys are stored as string keys", () => {
      const input: Record<string, number> = {};
      // @ts-expect-error - numeric keys are excluded from the upsert signature
      expect(upsert(input, 42, () => 1)).toStrictEqual({ "42": 1 });
    });
  });

  describe("collectBy", () => {
    test("preserves keys, symbols, and safe __proto__ assignments", () => {
      const symbol = Symbol("id");
      const values = [
        { id: "a", value: 1 },
        { id: "b", value: 2 },
        { id: "a", value: 3 },
        { id: "__proto__", value: 4 },
        { id: symbol, value: 5 },
      ];

      const result = collectBy(values, (value) => value.id);

      expect(Object.keys(result)).toStrictEqual(["a", "b", "__proto__"]);
      expect(result.a).toStrictEqual({ id: "a", value: 3 });
      expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
      expect(Object.hasOwn(result, "__proto__")).toBe(true);
      expect(
        Object.getOwnPropertyDescriptor(result, "__proto__")?.value,
      ).toStrictEqual({
        id: "__proto__",
        value: 4,
      });
      expect(result[symbol]).toStrictEqual({ id: symbol, value: 5 });
      expect(result).not.toBe(values);
      // The original iterable keeps its values and ordering.
      expect(values).toStrictEqual([
        { id: "a", value: 1 },
        { id: "b", value: 2 },
        { id: "a", value: 3 },
        { id: "__proto__", value: 4 },
        { id: symbol, value: 5 },
      ]);
    });

    test("returns a fresh empty record", () => {
      const values: readonly { id: string }[] = [];
      const identify = vi.fn((value: { id: string }) => value.id);
      const dataFirst = collectBy(values, identify);
      const dataLast = pipe(values, collectBy(identify));
      expect(dataFirst).toStrictEqual({});
      expect(dataLast).toStrictEqual(dataFirst);
      expect(dataLast).not.toBe(dataFirst);
      expect(identify).not.toHaveBeenCalled();
    });

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

      const dataFirst = collectBy(data, collector);
      expect(dataFirst).toStrictEqual(expectedResult);
      expect(pipe(data, collectBy(collector))).toStrictEqual(dataFirst);
    });

    test("indexes a singleton iterable", () => {
      const mug = { id: "mug", price: 12 };
      const products = new Set([mug]);
      const identify = vi.fn((product: typeof mug) => product.id);
      const dataFirst = collectBy(products, identify);
      expect(dataFirst).toStrictEqual({ mug });
      expect(dataFirst.mug).toBe(mug);
      expect(identify.mock.calls).toStrictEqual([[mug]]);
      expect(pipe(products, collectBy(identify))).toStrictEqual(dataFirst);
      expect(identify.mock.calls).toStrictEqual([[mug], [mug]]);
    });

    test("identifies each value in iterator order, including duplicate ids", () => {
      const products = [
        { id: "mug", price: 12 },
        { id: "notebook", price: 8 },
        { id: "mug", price: 10 },
      ];
      const identify = vi.fn(
        (product: { id: string; price: number }) => product.id,
      );
      const dataFirst = collectBy(products.values(), identify);
      expect(dataFirst).toStrictEqual({
        mug: products[2],
        notebook: products[1],
      });
      expect(identify.mock.calls).toStrictEqual(
        products.map((product) => [product]),
      );
      expect(pipe(products.values(), collectBy(identify))).toStrictEqual(
        dataFirst,
      );
      expect(identify.mock.calls).toStrictEqual(
        [...products, ...products].map((product) => [product]),
      );
    });

    test("untyped numeric identifiers become string keys", () => {
      // @ts-expect-error - collectBy requires string or symbol identifiers
      expect(collectBy([{ id: 42 }], (value) => value.id)).toStrictEqual({
        "42": { id: 42 },
      });
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
      const modify = vi.fn((n: number) => n * 10);
      const result = modifyIfExists(
        input,
        // @ts-expect-error - missing key is outside the narrow input key union
        "missing",
        modify,
      );
      expect(result).toStrictEqual({ a: 1, b: 2 });
      expect(result).toBe(input);
      expect(modify).not.toHaveBeenCalled();
    });

    test("does not call the modifier function when key is absent", () => {
      const input: Record<string, number> = { a: 1 };
      const modify = vi.fn((n: number) => n + 1);
      expect(modifyIfExists(input, "missing", modify)).toBe(input);
      expect(modify).not.toHaveBeenCalled();
    });

    test("calls the modifier function exactly once when key exists", () => {
      const input = { a: 1, b: 2 };
      const modify = vi.fn((n: number) => n + 1);
      expect(modifyIfExists(input, "a", modify)).toStrictEqual({ a: 2, b: 2 });
      expect(modify.mock.calls).toStrictEqual([[1]]);
      // The callback only changes the returned record, not the original input.
      expect(input).toStrictEqual({ a: 1, b: 2 });
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

    test.each([
      { input: {}, expected: {} },
      { input: { fontSize: 14 }, expected: { fontSize: 16 } },
      {
        input: { fontSize: 14, lineHeight: 20 },
        expected: { fontSize: 16, lineHeight: 20 },
      },
      { input: { lineHeight: 20 }, expected: { lineHeight: 20 } },
    ])(
      "both forms adjust only an existing setting in $input",
      ({ input, expected }) => {
        const settings: Record<string, number> = input;
        const modify = (size: number) => size + 2;
        const dataFirst = modifyIfExists(settings, "fontSize", modify);
        expect(dataFirst).toStrictEqual(expected);
        expect(
          pipe(settings, modifyIfExists("fontSize", modify)),
        ).toStrictEqual(dataFirst);
      },
    );

    test.each([null, undefined])(
      "a present %s reaches the modifier",
      (value) => {
        const settings: Record<string, string | null | undefined> = {
          theme: value,
        };
        const modify = vi.fn(
          (theme: string | null | undefined): string | null | undefined =>
            theme ?? "dark",
        );
        const dataFirst = modifyIfExists(settings, "theme", modify);
        expect(dataFirst).toStrictEqual({ theme: "dark" });
        expect(modify.mock.calls).toStrictEqual([[value]]);
        expect(pipe(settings, modifyIfExists("theme", modify))).toStrictEqual(
          dataFirst,
        );
        expect(modify.mock.calls).toStrictEqual([[value], [value]]);
      },
    );
  });

  describe("keysAs", () => {
    test("returns the same runtime value, re-typed", () => {
      type UserId = string & { readonly _brand: "UserId" };

      const byId: Record<string, number> = { u1: 10, u2: 20 };
      const branded = keysAs<UserId>()(byId);

      // Identical value and reference — purely a type-level reinterpretation.
      expect(branded).toStrictEqual({ u1: 10, u2: 20 });
      expect(branded).toBe(byId);
      expectTypeOf(branded).toEqualTypeOf<Record<UserId, number>>();
    });

    test.each([{}, { mug: 12 }, { mug: 12, notebook: 8 }])(
      "curried conversion preserves $prices",
      (prices) => {
        const input: Record<string, number> = prices;
        const result = keysAs<"mug" | "notebook">()(input);
        expect(result).toStrictEqual(prices);
        expect(result).toBe(input);
        expectTypeOf<keyof typeof result>().toEqualTypeOf<"mug" | "notebook">();
        expectTypeOf(result.mug).toEqualTypeOf<number>();
      },
    );

    test("untyped arrays pass through without runtime validation", () => {
      const prices = [12, 8];
      // @ts-expect-error - an array is not a string-keyed product record
      const result = keysAs<"mug">()<string, number>(prices);
      expect(result).toStrictEqual([12, 8]);
      expect(result).toBe(prices);
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
      expect(deepMerge(a, b)).toStrictEqual({ nested: { x: 1, y: 2 } });
      // Both original layers retain their contents.
      expect(a).toStrictEqual({ nested: { x: 1 } });
      expect(b).toStrictEqual({ nested: { y: 2 } });
    });

    test("data-last (pipeable) merges the override onto the piped base", () => {
      expect(pipe({ a: 1 }, deepMerge({ b: 2 }))).toStrictEqual({ a: 1, b: 2 });
    });

    test.each([
      { base: {}, override: {}, expected: {} },
      { base: {}, override: { theme: "dark" }, expected: { theme: "dark" } },
      { base: { theme: "dark" }, override: {}, expected: { theme: "dark" } },
      {
        base: { theme: "dark" },
        override: { fontSize: 14 },
        expected: { theme: "dark", fontSize: 14 },
      },
      {
        base: { editor: { theme: "light", fontSize: 14 } },
        override: { editor: { theme: "dark" } },
        expected: { editor: { theme: "dark", fontSize: 14 } },
      },
      {
        base: { editor: { theme: "dark" } },
        override: { editor: false },
        expected: { editor: false },
      },
      {
        base: { editor: false },
        override: { editor: { theme: "dark" } },
        expected: { editor: { theme: "dark" } },
      },
      {
        base: { plugins: ["spellcheck"] },
        override: { plugins: ["formatter"] },
        expected: { plugins: ["formatter"] },
      },
      {
        base: { theme: undefined },
        override: { theme: "dark" },
        expected: { theme: "dark" },
      },
      {
        base: { theme: "dark" },
        override: { theme: undefined },
        expected: { theme: undefined },
      },
      {
        base: { theme: null },
        override: { theme: "dark" },
        expected: { theme: "dark" },
      },
      {
        base: { theme: "dark" },
        override: { theme: null },
        expected: { theme: null },
      },
    ])(
      "both forms merge $base with $override",
      ({ base, override, expected }) => {
        const originalBase = structuredClone(base);
        const originalOverride = structuredClone(override);
        const dataFirst = deepMerge(base, override);
        expect(dataFirst).toStrictEqual(expected);
        expect(pipe(base, deepMerge(override))).toStrictEqual(dataFirst);
        // Deep merging preserves both original layers, including their nested values.
        expect(base).toStrictEqual(originalBase);
        expect(override).toStrictEqual(originalOverride);
        expect(dataFirst).not.toBe(base);
        expect(dataFirst).not.toBe(override);
      },
    );

    test.each([
      null,
      undefined,
      0,
      false,
      "dark",
      ["formatter"],
      new Map([["theme", "dark"]]),
      new Set(["formatter"]),
      /theme/u,
    ])("replaces a non-record %s on either side", (leaf) => {
      const settings = { theme: "dark" };
      expect(deepMerge(leaf, settings)).toBe(settings);
      expect(pipe(leaf, deepMerge(settings))).toBe(settings);
      expect(deepMerge(settings, leaf)).toBe(leaf);
      expect(pipe(settings, deepMerge(leaf))).toBe(leaf);
      expect(deepMerge(leaf, leaf)).toBe(leaf);
      expect(deepMerge({ setting: leaf }, { setting: {} })).toStrictEqual({
        setting: {},
      });
      expect(deepMerge({ setting: {} }, { setting: leaf })).toStrictEqual({
        setting: leaf,
      });
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

    test("combine uses the same recursive merge as deepMerge", () => {
      const defaults = { editor: { theme: "light", fontSize: 14 } };
      const saved = { editor: { theme: "dark" } };
      expect(deepMergeReducer.combine(defaults, saved)).toStrictEqual({
        editor: { theme: "dark", fontSize: 14 },
      });
      expect(deepMergeReducer.combine(defaults, saved)).toStrictEqual(
        deepMerge(defaults, saved),
      );
    });

    test("initialValue is an identity for object layers on both sides", () => {
      const settings = { editor: { theme: "dark" }, plugins: ["formatter"] };
      const initial = deepMergeReducer.initialValue;
      expect(initial).toStrictEqual({});
      expect(deepMergeReducer.combine(initial, settings)).toStrictEqual(
        settings,
      );
      expect(deepMergeReducer.combine(settings, initial)).toStrictEqual(
        settings,
      );
      expect(deepMergeReducer.combineAll([])).toBe(initial);
      // The initial object is also left untouched by combining settings.
      expect(initial).toStrictEqual({});
    });

    test("the initial object is not an identity for every unknown leaf", () => {
      const initial = deepMergeReducer.initialValue;
      expect(deepMergeReducer.combine(initial, null)).toBe(null);
      expect(deepMergeReducer.combine(null, initial)).toBe(initial);
      expect(deepMergeReducer.combineAll([null])).toBe(null);
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

    test("returns fresh arrays and records without mutating them", () => {
      const input = [{ b: 1, a: 2 }];
      const result = canonicalize(input);

      expect(result).toStrictEqual([{ a: 2, b: 1 }]);
      expect(result).not.toBe(input);
      assert(Array.isArray(result));
      expect(result[0]).not.toBe(input[0]);
      // The original array and record retain their contents and insertion order.
      expect(input).toStrictEqual([{ b: 1, a: 2 }]);
      expect(Object.keys(input[0])).toStrictEqual(["b", "a"]);
    });

    test.each([{}, { theme: "dark" }, [], ["formatter"]])(
      "returns fresh empty and singleton containers for %s",
      (input) => {
        const result = canonicalize(input);
        expect(result).toStrictEqual(input);
        expect(result).not.toBe(input);
      },
    );

    test("sorts nested record keys while retaining array order and is idempotent", () => {
      const input = {
        theme: "dark",
        plugins: [
          { priority: 2, name: "formatter" },
          { priority: 1, name: "spellcheck" },
        ],
        editor: { tabSize: 2, fontSize: 14 },
      };
      const result = canonicalize(input);
      const serialized =
        '{"editor":{"fontSize":14,"tabSize":2},"plugins":[{"name":"formatter","priority":2},{"name":"spellcheck","priority":1}],"theme":"dark"}';
      expect(JSON.stringify(result)).toBe(serialized);
      expect(JSON.stringify(canonicalize(result))).toBe(serialized);
      expect(canonicalize(result)).toStrictEqual(result);
      // Canonicalizing does not reorder the original root or nested records.
      expect(Object.keys(input)).toStrictEqual(["theme", "plugins", "editor"]);
      expect(Object.keys(input.editor)).toStrictEqual(["tabSize", "fontSize"]);
      expect(input.plugins).toStrictEqual([
        { priority: 2, name: "formatter" },
        { priority: 1, name: "spellcheck" },
      ]);
    });

    test("integer keys enumerate numerically even after lexicographic sorting", () => {
      expect(
        JSON.stringify(
          canonicalize({
            "10": "lamp",
            "2": "mug",
            theme: "dark",
            autosave: true,
          }),
        ),
      ).toBe('{"2":"mug","10":"lamp","autosave":true,"theme":"dark"}');
    });

    test("retains only own enumerable string keys in fresh records", () => {
      const input: Record<string | symbol, unknown> = {
        theme: "dark",
        [Symbol("private")]: "secret",
      };
      Object.defineProperty(input, "hidden", { value: true });
      const result = canonicalize(input);
      expect(result).toStrictEqual({ theme: "dark" });
      assert(Predicate.isObject(result));
      expect(Reflect.ownKeys(result)).toStrictEqual(["theme"]);
      expect(result).not.toBe(input);
      // The original record still owns its symbol and non-enumerable entries.
      expect(Reflect.ownKeys(input)).toHaveLength(3);
    });

    test.each([
      undefined,
      false,
      0,
      1n,
      Symbol("theme"),
      new Set(["formatter"]),
      /theme/u,
      () => "dark",
    ])("passes a non-record leaf %s through unchanged", (leaf) => {
      expect(canonicalize(leaf)).toBe(leaf);
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
      expect(Option.isNone(deleteByPath([], ["a"]))).toBe(true);
    });

    test("does not mutate the input", () => {
      const input = { a: { b: 1, c: 2 } };
      expect(deleteByPath(input, ["a", "b"])).toStrictEqual(
        Option.some({ a: { c: 2 } }),
      );
      // The original nested record still contains the deleted key.
      expect(input).toStrictEqual({ a: { b: 1, c: 2 } });
    });

    test("returns a fresh root after a successful deletion", () => {
      const input = { a: 1, b: 2 };
      const result = Option.getOrThrow(deleteByPath(input, ["a"]));
      expect(result).toStrictEqual({ b: 2 });
      expect(result).not.toBe(input);
    });

    test("data-last (pipeable) form", () => {
      const result = pipe({ a: { b: 1 } }, deleteByPath(["a", "b"]));
      expect(Option.getOrThrow(result)).toStrictEqual({});
    });

    test.each([
      { input: {}, path: ["theme"], expected: Option.none() },
      { input: { theme: "dark" }, path: [], expected: Option.none() },
      { input: { theme: "dark" }, path: ["theme"], expected: Option.some({}) },
      {
        input: { theme: "dark", autosave: true },
        path: ["theme"],
        expected: Option.some({ autosave: true }),
      },
      {
        input: { editor: { theme: "dark" } },
        path: ["missing", "theme"],
        expected: Option.none(),
      },
      {
        input: { editor: {} },
        path: ["editor", "theme"],
        expected: Option.none(),
      },
      {
        input: { editor: { theme: "dark" } },
        path: ["editor", "fontSize"],
        expected: Option.none(),
      },
      {
        input: { editor: { appearance: { theme: "dark" } } },
        path: ["editor", "appearance", "theme"],
        expected: Option.some({}),
      },
      {
        input: {
          editor: { appearance: { theme: "dark" }, fontSize: 14 },
          autosave: true,
        },
        path: ["editor", "appearance", "theme"],
        expected: Option.some({ editor: { fontSize: 14 }, autosave: true }),
      },
      {
        input: { editor: { theme: "dark", fontSize: 14 } },
        path: ["editor", "theme"],
        expected: Option.some({ editor: { fontSize: 14 } }),
      },
      {
        input: { "": { "": "dark" }, theme: "light" },
        path: ["", ""],
        expected: Option.some({ theme: "light" }),
      },
      {
        input: { theme: undefined },
        path: ["theme"],
        expected: Option.some({}),
      },
      // Inherited properties are absent paths: no own key was deleted.
      { input: {}, path: ["toString"], expected: Option.none() },
      { input: {}, path: ["__proto__", "toString"], expected: Option.none() },
      { input: {}, path: ["constructor", "name"], expected: Option.none() },
      {
        input: { editor: {} },
        path: ["editor", "toString"],
        expected: Option.none(),
      },
    ])("both forms delete $path from $input", ({ input, path, expected }) => {
      const original = structuredClone(input);
      const dataFirst = deleteByPath(input, path);
      expect(dataFirst).toStrictEqual(expected);
      expect(pipe(input, deleteByPath(path))).toStrictEqual(dataFirst);
      // The original settings retain every key and nested value.
      expect(input).toStrictEqual(original);
    });

    test("deletes through an own constructor key without mutating it", () => {
      const constructor = { name: "saved" };
      const input = { constructor };
      const dataFirst = deleteByPath(input, ["constructor", "name"]);
      expect(dataFirst).toStrictEqual(Option.some({}));
      expect(pipe(input, deleteByPath(["constructor", "name"]))).toStrictEqual(
        dataFirst,
      );
      // The original root still owns the same child, which retains its name.
      expect(Object.keys(input)).toStrictEqual(["constructor"]);
      expect(input.constructor).toBe(constructor);
      expect(constructor).toStrictEqual({ name: "saved" });
    });

    test.each<{ input: unknown; path: readonly string[] }>([
      { input: { toString: "saved" }, path: ["toString"] },
      {
        input: { ["__proto__"]: { toString: "saved" } },
        path: ["__proto__", "toString"],
      },
    ])("deletes own prototype-named keys at $path", ({ input, path }) => {
      const original = structuredClone(input);
      const dataFirst = deleteByPath(input, path);
      expect(dataFirst).toStrictEqual(Option.some({}));
      expect(pipe(input, deleteByPath(path))).toStrictEqual(dataFirst);
      // The original record still owns its prototype-named keys.
      expect(input).toStrictEqual(original);
    });

    test.each([null, undefined, 0, false, "dark", ["formatter"], new Map()])(
      "does not traverse non-record %s at root or nested paths",
      (leaf) => {
        const dataFirst = deleteByPath(leaf, ["theme"]);
        expect(dataFirst).toStrictEqual(Option.none());
        expect(pipe(leaf, deleteByPath(["theme"]))).toStrictEqual(dataFirst);
        expect(
          deleteByPath({ editor: leaf }, ["editor", "theme"]),
        ).toStrictEqual(Option.none());
        expect(deleteByPath({ editor: leaf }, ["editor", "0"])).toStrictEqual(
          Option.none(),
        );
      },
    );

    test("successful nested deletion returns fresh containers and retains siblings", () => {
      const input = {
        editor: { theme: "dark", fontSize: 14 },
        plugins: ["formatter"],
      };
      const result = Option.getOrThrow(
        deleteByPath(input, ["editor", "theme"]),
      );
      expect(result).toStrictEqual({
        editor: { fontSize: 14 },
        plugins: ["formatter"],
      });
      expect(result).not.toBe(input);
      assert(Predicate.isObject(result));
      expect(Reflect.get(result, "editor")).not.toBe(input.editor);
      // The original editor section and the sibling plugin list remain unchanged.
      expect(input).toStrictEqual({
        editor: { theme: "dark", fontSize: 14 },
        plugins: ["formatter"],
      });
    });

    test("untyped numeric path segments address stringified keys", () => {
      // @ts-expect-error - deleteByPath accepts string path segments only
      expect(deleteByPath({ "42": "dark" }, [42])).toStrictEqual(
        Option.some({}),
      );
    });
  });
});
