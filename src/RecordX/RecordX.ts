/**
 * Generic, framework-agnostic extensions to Effect's `Record` module.
 *
 * @since 0.0.0
 */
import { Array, Option, Order, Predicate, Record, pipe } from "effect";
import { dual } from "effect/Function";
import { ArrayX } from "../ArrayX";

/**
 * Returns `true` when `record` has at least one entry, narrowing it to a
 * known-non-empty `Record`.
 *
 * The negation of `Record.isEmptyRecord`, packaged as a type guard so it reads
 * naturally at call sites that want to branch on "this record has something in
 * it" without a manual `!Record.isEmptyRecord(...)`.
 *
 * @example
 * ```ts
 * import { RecordX } from "@nunofyobiz/effect-extras"
 *
 * assert.deepStrictEqual(RecordX.isNonEmptyRecord({ a: 1 }), true)
 * assert.deepStrictEqual(RecordX.isNonEmptyRecord({}), false)
 * ```
 *
 * @category guards
 * @since 0.0.0
 */
export const isNonEmptyRecord = <K extends PropertyKey, V>(
  record: Record<K, V>,
): record is Record<K, V> => pipe(record, Predicate.not(Record.isEmptyRecord));

/**
 * Modifies the value at `key` in `self` with `f`, leaving the record unchanged
 * if the key doesn't exist.
 *
 * v4's `Record.modify` returns `Option<Record>` — `None` when the key is
 * absent. This helper picks the "do nothing if absent" semantics that v3's
 * `Record.modify` had implicitly, and that most call sites assume. The modifier
 * is never invoked when the key is missing.
 *
 * @example
 * ```ts
 * import { pipe } from "effect"
 * import { RecordX } from "@nunofyobiz/effect-extras"
 *
 * // data-first
 * assert.deepStrictEqual(
 *   RecordX.modifyIfExists({ a: 1, b: 2 }, "b", (n) => n * 10),
 *   { a: 1, b: 20 },
 * )
 *
 * // a missing key leaves the record untouched
 * const counts: Record<string, number> = { a: 1, b: 2 }
 * assert.deepStrictEqual(
 *   RecordX.modifyIfExists(counts, "missing", (n) => n + 1),
 *   { a: 1, b: 2 },
 * )
 *
 * // data-last (pipeable)
 * assert.deepStrictEqual(
 *   pipe({ a: 1, b: 2 }, RecordX.modifyIfExists("a", (n) => n * 10)),
 *   { a: 10, b: 2 },
 * )
 * ```
 *
 * @category mapping
 * @since 0.0.0
 */
export const modifyIfExists: {
  <K extends string, A>(
    key: NoInfer<K>,
    f: (a: A) => A,
  ): (self: Record<K, A>) => Record<K, A>;
  <K extends string, A>(
    self: Record<K, A>,
    key: NoInfer<K>,
    f: (a: A) => A,
  ): Record<K, A>;
} = dual(
  3,
  <K extends string, A>(
    self: Record<K, A>,
    key: K,
    f: (a: A) => A,
  ): Record<K, A> =>
    pipe(
      Record.modify(self, key, f),
      Option.getOrElse(() => self),
    ),
);

/**
 * Returns the smallest value of `record` (per `order`) that matches
 * `predicate`, narrowed to the refined type `B`, or `Option.none()` if none
 * match.
 *
 * The `Record` counterpart of `ArrayX.takeFirstWhere`: it considers only the
 * record's values, keeps those satisfying `predicate`, and returns the minimum
 * of them by `order`. Keys are ignored entirely.
 *
 * @example
 * ```ts
 * import { Option, Order, pipe } from "effect"
 * import { RecordX } from "@nunofyobiz/effect-extras"
 *
 * const isEven = (n: number): n is number => n % 2 === 0
 *
 * // data-first
 * assert.deepStrictEqual(
 *   RecordX.takeFirstWhere({ a: 3, b: 4, c: 2 }, isEven, Order.Number),
 *   Option.some(2),
 * )
 *
 * // data-last (pipeable); no even values yields None
 * assert.deepStrictEqual(
 *   pipe({ a: 1, b: 3 }, RecordX.takeFirstWhere(isEven, Order.Number)),
 *   Option.none(),
 * )
 * ```
 *
 * @category getters
 * @since 0.0.0
 */
export const takeFirstWhere = dual<
  <K extends PropertyKey, A, B extends A>(
    predicate: Predicate.Refinement<A, B>,
    order: Order.Order<B>,
  ) => (record: Record<K, A>) => Option.Option<B>,
  <K extends PropertyKey, A, B extends A>(
    record: Record<K, A>,
    predicate: Predicate.Refinement<A, B>,
    order: Order.Order<B>,
  ) => Option.Option<B>
>(
  3,
  <K extends PropertyKey, A, B extends A>(
    record: Record<K, A>,
    predicate: Predicate.Refinement<A, B>,
    order: Order.Order<B>,
  ): Option.Option<B> =>
    ArrayX.takeFirstWhere(Record.values(record), predicate, order),
);

/**
 * Returns the largest value of `record` (per `order`) that matches `predicate`,
 * narrowed to the refined type `B`, or `Option.none()` if none match.
 *
 * The mirror of {@link takeFirstWhere}: it considers only the record's values,
 * keeps those satisfying `predicate`, and returns the maximum of them by
 * `order`. Keys are ignored entirely.
 *
 * @example
 * ```ts
 * import { Option, Order, pipe } from "effect"
 * import { RecordX } from "@nunofyobiz/effect-extras"
 *
 * const isEven = (n: number): n is number => n % 2 === 0
 *
 * // data-first
 * assert.deepStrictEqual(
 *   RecordX.takeLastWhere({ a: 3, b: 4, c: 2 }, isEven, Order.Number),
 *   Option.some(4),
 * )
 *
 * // data-last (pipeable); no even values yields None
 * assert.deepStrictEqual(
 *   pipe({ a: 1, b: 3 }, RecordX.takeLastWhere(isEven, Order.Number)),
 *   Option.none(),
 * )
 * ```
 *
 * @category getters
 * @since 0.0.0
 */
export const takeLastWhere = dual<
  <K extends PropertyKey, A, B extends A>(
    predicate: Predicate.Refinement<A, B>,
    order: Order.Order<B>,
  ) => (record: Record<K, A>) => Option.Option<B>,
  <K extends PropertyKey, A, B extends A>(
    record: Record<K, A>,
    predicate: Predicate.Refinement<A, B>,
    order: Order.Order<B>,
  ) => Option.Option<B>
>(
  3,
  <K extends PropertyKey, A, B extends A>(
    record: Record<K, A>,
    predicate: Predicate.Refinement<A, B>,
    order: Order.Order<B>,
  ): Option.Option<B> =>
    ArrayX.takeLastWhere(Record.values(record), predicate, order),
);

/**
 * Returns the largest value of `record` according to `order`, wrapped in an
 * `Option` so empty records are handled safely.
 *
 * Sorts the record's values by `order` and takes the last one, yielding
 * `Option.none()` when the record is empty and `Option.some(max)` otherwise.
 * Keys are ignored — only values participate in the ordering.
 *
 * @example
 * ```ts
 * import { Option, Order, pipe } from "effect"
 * import { RecordX } from "@nunofyobiz/effect-extras"
 *
 * // data-first
 * assert.deepStrictEqual(
 *   RecordX.takeLast({ a: 3, b: 5, c: 1 }, Order.Number),
 *   Option.some(5),
 * )
 *
 * // data-last (pipeable); empty record yields None
 * assert.deepStrictEqual(
 *   pipe({}, RecordX.takeLast(Order.Number)),
 *   Option.none(),
 * )
 * ```
 *
 * @category getters
 * @since 0.0.0
 */
export const takeLast = dual<
  <K extends PropertyKey, A>(
    order: Order.Order<A>,
  ) => (record: Record<K, A>) => Option.Option<A>,
  <K extends PropertyKey, A>(
    record: Record<K, A>,
    order: Order.Order<A>,
  ) => Option.Option<A>
>(
  2,
  <K extends PropertyKey, A>(
    record: Record<K, A>,
    order: Order.Order<A>,
  ): Option.Option<A> =>
    pipe(Record.values(record), Array.sort(order), Array.last),
);

/**
 * Re-types the keys of a `Record` to a different key type `K2` without touching
 * the runtime value.
 *
 * A purely type-level reinterpretation: the record is returned as-is, but the
 * compiler now treats its keys as `K2` instead of the inferred `K1`. Use it at a
 * boundary where you know the keys conform to a narrower branded or literal key
 * type that TypeScript can't infer from the value alone. It performs no
 * validation — the caller is responsible for the keys actually matching `K2`.
 *
 * @example
 * ```ts
 * import { RecordX } from "@nunofyobiz/effect-extras"
 *
 * type UserId = string & { readonly _brand: "UserId" }
 *
 * const byId: Record<string, number> = { u1: 10, u2: 20 }
 * const branded = RecordX.keysAs<UserId>()(byId)
 *
 * // Same runtime value, keys now seen as `UserId`
 * assert.deepStrictEqual(branded, { u1: 10, u2: 20 })
 * ```
 *
 * @category conversions
 * @since 0.0.0
 */
export const keysAs =
  <K2 extends PropertyKey>() =>
  <K1 extends PropertyKey, V>(record: Record<K1, V>): Record<K2, V> =>
    record as unknown as Record<K2, V>;

/**
 * Returns the value at `key` in `record`, throwing an `Error` if the key is
 * absent.
 *
 * The unsafe, get-or-explode counterpart to `Record.get` (which returns an
 * `Option`). The thrown error names the missing key and lists the record's
 * existing keys to aid debugging. Reach for {@link getOrThrowWith} when you need
 * a custom error; prefer `Record.get` whenever absence is a real possibility.
 *
 * @example
 * ```ts
 * import { pipe } from "effect"
 * import { RecordX } from "@nunofyobiz/effect-extras"
 *
 * const record: Record<string, number> = { a: 1, b: 2 }
 *
 * // data-first
 * assert.deepStrictEqual(RecordX.getOrThrow(record, "a"), 1)
 *
 * // data-last (pipeable)
 * assert.deepStrictEqual(pipe(record, RecordX.getOrThrow("b")), 2)
 *
 * // missing key throws
 * assert.throws(() => RecordX.getOrThrow(record, "missing"))
 * ```
 *
 * @category unsafe
 * @since 0.0.0
 */
export const getOrThrow = dual<
  <K extends string | symbol>(key: K) => <V>(record: Record<K, V>) => V,
  <K extends string | symbol, V>(record: Record<K, V>, key: K) => V
>(
  2,
  <K extends string | symbol, V>(record: Record<K, V>, key: K): V =>
    getOrThrowWith(
      record,
      key,
      (key) =>
        new Error(
          `Key ${String(key)} not found in record\nExisting keys=${String(Record.keys(record))}`,
        ),
    ),
);

/**
 * Returns the value at `key` in `record`, throwing the result of `onNone(key)`
 * if the key is absent.
 *
 * Like {@link getOrThrow}, but lets the caller supply the thrown value (an
 * `Error`, a string, or any custom failure) computed from the missing key. Use
 * it when the default "key not found" message isn't descriptive enough for the
 * call site.
 *
 * @example
 * ```ts
 * import { pipe } from "effect"
 * import { RecordX } from "@nunofyobiz/effect-extras"
 *
 * const record: Record<string, number> = { a: 1 }
 * const onNone = (key: string) => new Error(`no ${key}`)
 *
 * // data-first
 * assert.deepStrictEqual(RecordX.getOrThrowWith(record, "a", onNone), 1)
 *
 * // data-last (pipeable)
 * assert.deepStrictEqual(pipe(record, RecordX.getOrThrowWith("a", onNone)), 1)
 *
 * // missing key throws the custom error
 * assert.throws(() => RecordX.getOrThrowWith(record, "missing", onNone))
 * ```
 *
 * @category unsafe
 * @since 0.0.0
 */
export const getOrThrowWith = dual<
  <K extends string | symbol>(
    key: K,
    onNone: (key: K) => unknown,
  ) => <V>(record: Record<K, V>) => V,
  <K extends string | symbol, V>(
    record: Record<K, V>,
    key: K,
    onNone: (key: K) => unknown,
  ) => V
>(
  3,
  <K extends string | symbol, V>(
    record: Record<K, V>,
    key: K,
    onNone: (key: K) => unknown,
  ): V =>
    Record.get(record, key).pipe(Option.getOrThrowWith(() => onNone(key))),
);

/**
 * Inserts or updates the value at `key`, deriving the new value from the current
 * one via `upsert`.
 *
 * The `upsert` function receives an `Option` of the existing value —
 * `Option.some(value)` when the key is present, `Option.none()` when it's
 * absent — and returns the value to store. This unifies "insert if missing" and
 * "update if present" into a single pass, with `Option.match` as the natural way
 * to handle both cases.
 *
 * @example
 * ```ts
 * import { Option, pipe } from "effect"
 * import { RecordX } from "@nunofyobiz/effect-extras"
 *
 * const bump = Option.match({
 *   onNone: () => 1,
 *   onSome: (n: number) => n + 1,
 * })
 *
 * // data-first: updates an existing entry
 * assert.deepStrictEqual(RecordX.upsert({ a: 1 }, "a", bump), { a: 2 })
 *
 * // data-last (pipeable): inserts a missing entry
 * const counts: Record<string, number> = { a: 1 }
 * assert.deepStrictEqual(pipe(counts, RecordX.upsert("b", bump)), {
 *   a: 1,
 *   b: 1,
 * })
 * ```
 *
 * @category mapping
 * @since 0.0.0
 */
export const upsert = dual<
  <K extends string | symbol, V>(
    key: K,
    upsert: (existingValue: Option.Option<V>) => V,
  ) => (record: Record<K, V>) => Record<K, V>,
  <K extends string | symbol, V>(
    record: Record<K, V>,
    key: K,
    upsert: (existingValue: Option.Option<V>) => V,
  ) => Record<K, V>
>(
  3,
  <K extends string | symbol, V>(
    record: Record<K, V>,
    key: K,
    upsert: (existingValue: Option.Option<V>) => V,
  ): Record<K, V> => {
    const existingValue = Record.get(record, key);
    const updatedValue = upsert(existingValue);
    return Record.set(record, key, updatedValue);
  },
);

/**
 * Indexes an iterable of values into a `Record`, keying each value by the result
 * of `identify`.
 *
 * Builds a lookup table from a collection: every value is stored under the key
 * `identify(value)`. When two values produce the same key the later one wins, so
 * the result holds the last value seen per key. Useful for turning a list of
 * records into a by-id map.
 *
 * @example
 * ```ts
 * import { pipe } from "effect"
 * import { RecordX } from "@nunofyobiz/effect-extras"
 *
 * const items = [
 *   { id: "a", n: 1 },
 *   { id: "b", n: 2 },
 *   { id: "a", n: 3 }, // wins over the earlier "a"
 * ]
 *
 * // data-first
 * assert.deepStrictEqual(
 *   RecordX.collectBy(items, (item) => item.id),
 *   { a: { id: "a", n: 3 }, b: { id: "b", n: 2 } },
 * )
 *
 * // data-last (pipeable)
 * assert.deepStrictEqual(
 *   pipe(items, RecordX.collectBy((item) => item.id)),
 *   { a: { id: "a", n: 3 }, b: { id: "b", n: 2 } },
 * )
 * ```
 *
 * @category constructors
 * @since 0.0.0
 */
export const collectBy = dual<
  <K extends string | symbol, V>(
    identify: (v: V) => K,
  ) => (values: Iterable<V>) => Record<K, V>,
  <K extends string | symbol, V>(
    values: Iterable<V>,
    identify: (v: V) => K,
  ) => Record<K, V>
>(
  2,
  <K extends string | symbol, V>(
    values: Iterable<V>,
    identify: (v: V) => K,
  ): Record<K, V> =>
    Array.reduce(values, {} as Record<K, V>, (accumulator, value) =>
      Record.set<K, V, K, V>(accumulator, identify(value), value),
    ),
);
