/**
 * Generic, framework-agnostic extensions for working with `Map`.
 *
 * @since 0.0.0
 */
import { Predicate } from "effect";
import { dual } from "effect/Function";

/**
 * Like `Map.prototype.get`, but when the key is absent it stores the computed
 * fallback at that key and returns it. Mutates the input map in place.
 *
 * Use it for memoization-style caches where a miss should both populate the map
 * and yield the value in one step. Throws if the resolved value is nullish (only
 * possible when `fallbackIfNotFound` returns `null`/`undefined` for a value type
 * that admits them — treated as a programmer error). Supports both data-first and
 * data-last (pipeable) call styles.
 *
 * @example
 * ```ts
 * import { MapX } from "@nunofyobiz/effect-extras"
 * import { pipe } from "effect"
 *
 * // Miss: stores the fallback and returns it (data-first)
 * const map = new Map<string, number>()
 * assert.deepStrictEqual(MapX.getOrElseSetGet(map, "a", () => 1), 1)
 * assert.deepStrictEqual(map.get("a"), 1)
 *
 * // Hit: returns the existing value, fallback is ignored (data-last)
 * assert.deepStrictEqual(
 *   pipe(map, MapX.getOrElseSetGet("a", () => 99)),
 *   1
 * )
 * ```
 *
 * @category combinators
 * @since 0.0.0
 */
export const getOrElseSetGet = dual<
  <K, V>(key: K, fallbackIfNotFound: () => V) => (map: Map<K, V>) => V,
  <K, V>(map: Map<K, V>, key: K, fallbackIfNotFound: () => V) => V
>(3, <K, V>(map: Map<K, V>, key: K, fallbackIfNotFound: () => V): V => {
  if (!map.has(key)) {
    map.set(key, fallbackIfNotFound());
    return fallbackIfNotFound();
  }

  const existingValue = map.get(key);
  if (Predicate.isNullish(existingValue)) {
    throw new Error(`Value is nullable: ${String(key)}`);
  }

  return existingValue;
});
