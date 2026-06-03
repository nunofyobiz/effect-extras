import { Array, Option, Order, Predicate, Record, pipe } from "effect";
import { dual } from "effect/Function";
import { dedent } from "ts-dedent";
import { ArrayX } from "../ArrayX";

export const isNonEmptyRecord = <K extends PropertyKey, V>(
  record: Record<K, V>,
): record is Record<K, V> => pipe(record, Predicate.not(Record.isEmptyRecord));

/**
 * Modify the value at `key` in `self`, leaving the record unchanged if the key
 * doesn't exist.
 *
 * v4's `Record.modify` returns `Option<Record>` — `None` when the key is
 * absent. This helper picks the "do nothing if absent" semantics that v3's
 * `Record.modify` had implicitly, and that most call sites assume.
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

export const keysAs =
  <K2 extends PropertyKey>() =>
  <K1 extends PropertyKey, V>(record: Record<K1, V>): Record<K2, V> =>
    record as unknown as Record<K2, V>;

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
        new Error(dedent`
        Key ${String(key)} not found in record
        Existing keys=${Record.keys(record)}
      `),
    ),
);

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
 * Collect an array of objects into a record, using the identify function to determine the key.
 * Last value wins.
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
