/**
 * Generic, framework-agnostic extensions to Effect's `Record` module.
 *
 * @since 0.0.0
 */
import {
  Array,
  Match,
  Option,
  Order,
  Predicate,
  Record,
  Reducer,
  pipe,
} from "effect";
import { dual } from "effect/Function";
import * as ArrayX from "./ArrayX.js";
import * as PredicateX from "./PredicateX.js";

/**
 * Returns `true` when `record` has at least one own enumerable string key.
 * Use it to check whether a settings or lookup record contains entries before
 * processing it. Symbol keys and inherited entries do not count; the guard
 * preserves the existing record type rather than proving any particular key exists.
 *
 * @example
 * ```ts
 * import { RecordX } from "@nunofyobiz/effect-extras"
 *
 * // A saved theme counts as a setting; an empty settings record has no entries.
 * assert.deepStrictEqual(RecordX.isNonEmptyRecord({ theme: "dark" }), true)
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
 * Use it to adjust a saved setting only when the user has already supplied it.
 *
 * `Record.modify` returns `Option<Record>` — `None` when the key is absent.
 * This helper provides the common "do nothing if absent" semantics. The
 * modifier is never invoked when the key is missing.
 *
 * @example
 * ```ts
 * import { pipe } from "effect"
 * import { RecordX } from "@nunofyobiz/effect-extras"
 *
 * const settings: Record<string, number> = { fontSize: 14, lineHeight: 20 }
 *
 * // Increase the saved font size without changing the other settings.
 * assert.deepStrictEqual(
 *   RecordX.modifyIfExists(settings, "fontSize", (size) => size + 2),
 *   { fontSize: 16, lineHeight: 20 },
 * )
 *
 * // An unsaved setting stays absent, and its modifier is never called.
 * assert.deepStrictEqual(
 *   RecordX.modifyIfExists(settings, "zoom", (zoom) => zoom + 1),
 *   settings,
 * )
 *
 * // The pipeable form makes the same font-size adjustment.
 * assert.deepStrictEqual(
 *   pipe(settings, RecordX.modifyIfExists("fontSize", (size) => size + 2)),
 *   { fontSize: 16, lineHeight: 20 },
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
 * Use it to find the lowest-ranked eligible value in a lookup table. Only own
 * enumerable string-keyed values participate; keys do not affect the ranking.
 *
 * @example
 * ```ts
 * import { Option, Order, Predicate, pipe } from "effect"
 * import { RecordX } from "@nunofyobiz/effect-extras"
 *
 * const prices: Record<string, number | null> = { mug: 12, notebook: 8, lamp: null }
 *
 * // Find the cheapest listed product, ignoring the unavailable lamp.
 * assert.deepStrictEqual(
 *   RecordX.takeFirstWhere(prices, Predicate.isNumber, Order.Number),
 *   Option.some(8),
 * )
 *
 * // The pipeable form finds the same listed price.
 * assert.deepStrictEqual(
 *   pipe(prices, RecordX.takeFirstWhere(Predicate.isNumber, Order.Number)),
 *   Option.some(8),
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
 * Use it to find the highest-ranked eligible value in a lookup table. Only own
 * enumerable string-keyed values participate; keys do not affect the ranking.
 *
 * @example
 * ```ts
 * import { Option, Order, Predicate, pipe } from "effect"
 * import { RecordX } from "@nunofyobiz/effect-extras"
 *
 * const prices: Record<string, number | null> = { mug: 12, notebook: 8, lamp: null }
 *
 * // Find the highest listed price, ignoring the unavailable lamp.
 * assert.deepStrictEqual(
 *   RecordX.takeLastWhere(prices, Predicate.isNumber, Order.Number),
 *   Option.some(12),
 * )
 *
 * // No available products means there is no price to return.
 * assert.deepStrictEqual(
 *   pipe({ lamp: null }, RecordX.takeLastWhere(Predicate.isNumber, Order.Number)),
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
 * Use it to find a maximum, such as the highest price in a product lookup.
 * Only own enumerable string-keyed values participate; an empty record yields
 * `Option.none()`. Reverse the order to select the minimum instead.
 *
 * @example
 * ```ts
 * import { Option, Order, pipe } from "effect"
 * import { RecordX } from "@nunofyobiz/effect-extras"
 *
 * // Select the highest product price without needing to sort the lookup yourself.
 * assert.deepStrictEqual(
 *   RecordX.takeLast({ mug: 12, notebook: 8, lamp: 35 }, Order.Number),
 *   Option.some(35),
 * )
 *
 * // An empty price lookup has no maximum.
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
 * type ProductId = "mug" | "notebook"
 *
 * const prices: Record<string, number> = { mug: 12, notebook: 8 }
 * const byProduct = RecordX.keysAs<ProductId>()(prices)
 *
 * // Treat the known product keys as ProductId; values and the reference stay the same.
 * assert.deepStrictEqual(byProduct, { mug: 12, notebook: 8 })
 * assert.strictEqual(byProduct, prices)
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
 * Only own keys count, including symbols and keys with `undefined` values.
 * The throwing counterpart to `Record.get` (which returns an
 * `Option`). The thrown error names the missing key and lists the record's
 * existing keys to aid debugging. Reach for {@link getOrThrowWith} when you need
 * a custom error; prefer `Record.get` whenever absence is a real possibility.
 *
 * @example
 * ```ts
 * import { pipe } from "effect"
 * import { RecordX } from "@nunofyobiz/effect-extras"
 *
 * const prices: Record<string, number> = { mug: 12, notebook: 8 }
 *
 * // Read a price when the product is required to exist.
 * assert.deepStrictEqual(RecordX.getOrThrow(prices, "mug"), 12)
 *
 * // The pipeable form retrieves the same price.
 * assert.deepStrictEqual(pipe(prices, RecordX.getOrThrow("mug")), 12)
 *
 * // An unlisted product throws instead of silently returning undefined.
 * assert.throws(() => RecordX.getOrThrow(prices, "lamp"))
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
 * const prices: Record<string, number> = { mug: 12 }
 * const onNone = (key: string) => new Error(`No price listed for ${key}`)
 *
 * // A listed price is returned without creating a failure.
 * assert.deepStrictEqual(RecordX.getOrThrowWith(prices, "mug", onNone), 12)
 *
 * // The pipeable form reads the same price.
 * assert.deepStrictEqual(pipe(prices, RecordX.getOrThrowWith("mug", onNone)), 12)
 *
 * // A missing product throws the caller's descriptive error.
 * assert.throws(() => RecordX.getOrThrowWith(prices, "lamp", onNone), /No price listed for lamp/)
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
 * // Count another view of a product already in the lookup.
 * assert.deepStrictEqual(RecordX.upsert({ mug: 1 }, "mug", bump), { mug: 2 })
 *
 * // The first view of an unlisted product starts its count at one.
 * const views: Record<string, number> = { mug: 1 }
 * assert.deepStrictEqual(pipe(views, RecordX.upsert("notebook", bump)), {
 *   mug: 1,
 *   notebook: 1,
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
 * const products = [
 *   { id: "mug", price: 12 },
 *   { id: "notebook", price: 8 },
 *   { id: "mug", price: 10 }, // The later price replaces the earlier mug entry.
 * ]
 *
 * // Build a product lookup using the latest entry for each id.
 * assert.deepStrictEqual(
 *   RecordX.collectBy(products, (product) => product.id),
 *   { mug: { id: "mug", price: 10 }, notebook: { id: "notebook", price: 8 } },
 * )
 *
 * // The pipeable form builds the same lookup.
 * assert.deepStrictEqual(
 *   pipe(products, RecordX.collectBy((product) => product.id)),
 *   { mug: { id: "mug", price: 10 }, notebook: { id: "notebook", price: 8 } },
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

/**
 * Deep-merges two JSON values, with `b` winning on conflicts.
 *
 * Plain objects (per `PredicateX.unsafeIsRecord`) are merged recursively,
 * key-by-key; every other shape — primitives, arrays, and impostors like
 * `Map`/`Date`/class instances — is replaced wholesale by `b`. If either side
 * isn't a plain object, `b` is returned as-is. Neither input is mutated. Reach
 * for it to layer partial JSON overrides on top of a base.
 *
 * @example
 * ```ts
 * import { RecordX } from "@nunofyobiz/effect-extras"
 * import { pipe } from "effect"
 *
 * const defaults = { editor: { fontSize: 14, theme: "light" }, plugins: ["spellcheck"] }
 * const saved = { editor: { theme: "dark" }, plugins: ["formatter"] }
 *
 * // Keep the default font size, override the theme, and replace the plugin list.
 * assert.deepStrictEqual(
 *   RecordX.deepMerge(defaults, saved),
 *   { editor: { fontSize: 14, theme: "dark" }, plugins: ["formatter"] },
 * )
 *
 * // The pipeable form layers saved settings onto the same defaults.
 * assert.deepStrictEqual(pipe(defaults, RecordX.deepMerge(saved)), {
 *   editor: { fontSize: 14, theme: "dark" }, plugins: ["formatter"],
 * })
 * ```
 *
 * @category combining
 * @since 0.0.0
 */
export const deepMerge = dual<
  (b: unknown) => (a: unknown) => unknown,
  (a: unknown, b: unknown) => unknown
>(2, (a: unknown, b: unknown): unknown => {
  if (!PredicateX.unsafeIsRecord(a) || !PredicateX.unsafeIsRecord(b)) {
    return b;
  }
  return Record.reduce(b, { ...a }, (accumulator, value, key) => ({
    ...accumulator,
    [key]: key in a ? deepMerge(a[key], value) : value,
  }));
});

/**
 * Combines settings or other object-valued layers from left to right using
 * {@link deepMerge}, with later layers winning on conflicts.
 *
 * `deepMergeReducer.combineAll(layers)` folds an iterable of object layers
 * left-to-right via {@link deepMerge}. Use it when defaults and multiple sets of
 * overrides need to become one object. Its `initialValue` is `{}`, an identity
 * for object-valued layers, but not for every `unknown` value. An empty list
 * yields `{}`, and a single object layer retains its contents.
 *
 * @example
 * ```ts
 * import { RecordX } from "@nunofyobiz/effect-extras"
 *
 * // Saved preferences override defaults; workspace settings override both.
 * assert.deepStrictEqual(
 *   RecordX.deepMergeReducer.combineAll([
 *     { editor: { fontSize: 14, theme: "light" } },
 *     { editor: { theme: "dark" }, autosave: true },
 *     { autosave: false },
 *   ]),
 *   { editor: { fontSize: 14, theme: "dark" }, autosave: false },
 * )
 *
 * // No settings layers produce an empty settings object.
 * assert.deepStrictEqual(RecordX.deepMergeReducer.combineAll([]), {})
 * ```
 *
 * @category instances
 * @since 0.0.0
 */
export const deepMergeReducer: Reducer.Reducer<unknown> = Reducer.make<unknown>(
  deepMerge,
  {},
);

/**
 * Canonicalizes a JSON value by recursively sorting object keys; arrays keep
 * their order.
 *
 * Use it for stable serialization or comparison of JSON values that differ only
 * in object key order. Plain objects (per `PredicateX.unsafeIsRecord`) and arrays
 * become fresh containers with recursively canonicalized values; other leaves
 * pass through unchanged. Only own enumerable string keys are retained. Keys
 * sort ascending, subject to JavaScript's numeric ordering of integer keys.
 * Array order is preserved and the input is never mutated.
 *
 * @example
 * ```ts
 * import { RecordX } from "@nunofyobiz/effect-extras"
 *
 * const settings = { theme: "dark", editor: { tabSize: 2, fontSize: 14 } }
 *
 * // Different insertion orders now serialize to the same settings string.
 * assert.deepStrictEqual(
 *   JSON.stringify(RecordX.canonicalize(settings)),
 *   JSON.stringify({ editor: { fontSize: 14, tabSize: 2 }, theme: "dark" }),
 * )
 *
 * // Plugin priority stays in array order, and a theme string passes through.
 * assert.deepStrictEqual(RecordX.canonicalize(["formatter", "spellcheck"]), ["formatter", "spellcheck"])
 * assert.deepStrictEqual(RecordX.canonicalize("dark"), "dark")
 * ```
 *
 * @category transformations
 * @since 0.0.0
 */
export const canonicalize = (value: unknown): unknown =>
  Match.value(value).pipe(
    Match.when(Array.isArray, (array) => Array.map(array, canonicalize)),
    Match.when(PredicateX.unsafeIsRecord, (record) =>
      pipe(
        Record.toEntries(record),
        Array.map(([key, entry]) => [key, canonicalize(entry)] as const),
        Array.sort(
          Order.mapInput(
            Order.String,
            ([key]: readonly [string, unknown]) => key,
          ),
        ),
        Record.fromEntries,
      ),
    ),
    Match.orElse((value) => value),
  );

/**
 * Immutably deletes the value at a `path` from a JSON object, pruning any parent
 * objects left empty by the deletion.
 *
 * Walks `path` from the root; when it resolves to an existing key, that key is
 * removed and every ancestor that becomes empty as a result is removed too.
 * Returns `Some(newObject)` when the path existed (so callers can tell something
 * changed), or `None` when it was absent or `object` isn't a plain object. The
 * input is never mutated. Use it to remove a nested setting and avoid leaving
 * empty settings sections behind. An empty path or traversal into a leaf or
 * array also returns `None`.
 *
 * @example
 * ```ts
 * import { RecordX } from "@nunofyobiz/effect-extras"
 * import { Option, pipe } from "effect"
 *
 * // Remove the only editor setting, so the empty editor section disappears too.
 * assert.deepStrictEqual(
 *   RecordX.deleteByPath({ editor: { theme: "dark" } }, ["editor", "theme"]),
 *   Option.some({}),
 * )
 *
 * // A saved font size keeps the editor section present after removing the theme.
 * assert.deepStrictEqual(
 *   RecordX.deleteByPath({ editor: { theme: "dark", fontSize: 14 } }, ["editor", "theme"]),
 *   Option.some({ editor: { fontSize: 14 } }),
 * )
 *
 * // An unsaved setting has nothing to delete, including in the pipeable form.
 * assert.deepStrictEqual(pipe({ theme: "dark" }, RecordX.deleteByPath(["zoom"])), Option.none())
 * ```
 *
 * @category combining
 * @since 0.0.0
 */
export const deleteByPath = dual<
  (path: readonly string[]) => (object: unknown) => Option.Option<unknown>,
  (object: unknown, path: readonly string[]) => Option.Option<unknown>
>(
  2,
  (object: unknown, path: readonly string[]): Option.Option<unknown> =>
    Match.value(object).pipe(
      Match.when(PredicateX.unsafeIsRecord, (record) =>
        Match.value(path).pipe(
          Match.when(Array.isReadonlyArrayNonEmpty<string>, (nonEmptyPath) => {
            const [head, rest] = Array.unprepend(nonEmptyPath);
            return Match.value(rest).pipe(
              Match.when(Array.isReadonlyArrayEmpty<string>, () =>
                Record.has(record, head)
                  ? Option.some(Record.remove(record, head))
                  : Option.none(),
              ),
              Match.orElse(() =>
                Record.has(record, head)
                  ? Option.map(deleteByPath(record[head], rest), (newChild) =>
                      PredicateX.unsafeIsRecord(newChild) &&
                      Record.isEmptyRecord(newChild)
                        ? Record.remove(record, head)
                        : { ...record, [head]: newChild },
                    )
                  : Option.none(),
              ),
            );
          }),
          Match.orElse(() => Option.none()),
        ),
      ),
      Match.orElse(() => Option.none()),
    ),
);
