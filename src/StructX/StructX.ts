import { Option, Predicate, Record, pipe } from "effect";
import { dual } from "effect/Function";

/**
 * Copied from Effect's Struct.evolve() function.
 * It would be better to use theirs, but it's not exported.
 */
export type PartialTransform<O, T> = {
  [K in keyof T]: T[K] extends (a: O[K & keyof O]) => unknown
    ? T[K]
    : (a: O[K & keyof O]) => unknown;
};

/**
 *
 * This is useful because we have exactOptionalPropertyTypes=true in our tsconfig.json
 * See https://www.typescriptlang.org/tsconfig/#exactOptionalPropertyTypes
 *
 * We need this set to true for @effect/schema
 * Setup intructions: https://github.com/Effect-TS/effect/blob/main/packages/schema/README.md#requirements
 * More info about why it's needed: https://github.com/Effect-TS/effect/blob/main/packages/schema/README.md#understanding-exactoptionalpropertytypes
 *
 * See this example:
 * ```ts
 * // This function has an optional argument a
 * function doStuff({ a }: { a?: string }) { /* ... * / }
 *
 * // Load this value from somewhere
 * const a: string | undefined = undefined;
 *
 * // This will result in a type error TS2379
 * const result = doStuff({ a });
 *
 * ```
 */
export const defined = <const K extends string, V>(
  name: K,
  value: V | undefined,
): Partial<Record<K, Exclude<V, undefined>>> =>
  Predicate.isUndefined(value)
    ? {}
    : Record.singleton(name, value as Exclude<V, undefined>);

/**
 * Very useful for update actions, when:
 * - "undefined" means "do not make any changes"
 * - any other value means "set to this value",including null and Option.none()
 */
export const filterDefined = <R extends Record<string, unknown>>(
  record: R,
): Partial<{ [P in keyof R]: Exclude<R[P], undefined> }> =>
  Object.entries(record).reduce(
    (accumulator, [key, value]) => ({ ...accumulator, ...defined(key, value) }),
    {} as Partial<{ [P in keyof R]: Exclude<R[P], undefined> }>,
  );

export const some = <const K extends string, V>(
  name: K,
  value: Option.Option<V>,
): Partial<Record<K, V>> =>
  Option.match(value, {
    onSome: (someValue) => Record.singleton(name, someValue),
    onNone: () => ({}),
  });

/**
 * Like {@link some}, but with swapped argument order for piping. Returns a
 * singleton record `{ [name]: value }` when the Option is `Some`, or an
 * empty object `{}` when `None`.
 *
 * Internal-only — exists to support {@link pickSome} in data-last form.
 * Not exported because the codebase has no direct callers.
 */
const someSingleton: {
  <const K extends string>(
    name: K,
  ): <V>(value: Option.Option<V>) => Partial<Record<K, V>>;
  <V, const K extends string>(
    value: Option.Option<V>,
    name: K,
  ): Partial<Record<K, V>>;
} = dual(
  2,
  <V, const K extends string>(
    value: Option.Option<V>,
    name: K,
  ): Partial<Record<K, V>> => some(name, value),
);

/**
 * Looks up `key` in `record` via `Record.get`, and returns a singleton
 * record when the value is `Some`, or `{}` when absent or `None`.
 *
 * By default the output key matches the lookup key. Pass `renameKeyTo`
 * to use a different name in the output record.
 *
 * Combines `Record.get` + `Option.flatten` + {@link someSingleton} in
 * a single call — useful for spreading optional fields from a lookup
 * table into an object.
 *
 * @example
 * ```ts
 * // Lookup key matches output key:
 * ...StructX.pickSome(assetDurations, assetId)
 *
 * // Rename the output key:
 * ...StructX.pickSome(assetDurations, assetId, "durationMillis")
 * ```
 */
export function pickSome<const K extends string, V>(
  record: Record<K, Option.Option<V>>,
  key: K,
): Partial<Record<K, V>>;
export function pickSome<const K1 extends string, V, const K2 extends string>(
  record: Record<K1, Option.Option<V>>,
  key: K1,
  renameKeyTo: K2,
): Partial<Record<K2, V>>;
export function pickSome<const K1 extends string, V, const K2 extends string>(
  record: Record<K1, Option.Option<V>>,
  key: K1,
  renameKeyTo?: K2,
): Partial<Record<K1 | K2, V>> {
  return pipe(
    Record.get(record, key),
    Option.flatten,
    someSingleton(renameKeyTo ?? key),
  );
}

export const truthy = <const K extends string, V>(
  name: K,
  value: V,
): Partial<Record<K, Exclude<NonNullable<V>, false | 0 | "">>> =>
  Predicate.isTruthy(value)
    ? Record.singleton(name, value as Exclude<NonNullable<V>, false | 0 | "">)
    : {};

export const hasNotNullableProperty = dual<
  <T, K extends keyof T>(
    key: K,
  ) => (object: T) => object is T & Record<K, NonNullable<T[K]>>,
  <T, K extends keyof T>(
    object: T,
    key: K,
  ) => object is T & Record<K, NonNullable<T[K]>>
>(
  2,
  <T, K extends keyof T>(
    object: T,
    key: K,
  ): object is T & Record<K, NonNullable<T[K]>> =>
    Predicate.hasProperty(object, key) && Predicate.isNotNullish(object[key]),
);
