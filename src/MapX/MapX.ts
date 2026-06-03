import { Predicate } from "effect";
import { dual } from "effect/Function";

/**
 * Like `Map.prototype.get`, but if the key is not present, the fallback is
 * stored at that key and returned. Mutates the input map in place.
 *
 * Throws if the stored value is nullish (only possible if `fallbackIfNotFound`
 * returns `null` or `undefined` for a `V` that includes them — in practice
 * this is treated as a programmer error).
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
