/**
 * Generic, framework-agnostic extensions for working with `Set`.
 *
 * @since 0.0.0
 */
import { dual } from "effect/Function";

/**
 * Runs a mutating function against a copy of `set`, leaving the original
 * untouched, and returns the mutated copy.
 *
 * Use it to reuse imperative `Set` mutation code (`.add`, `.delete`) without
 * sacrificing immutability: the callback may freely mutate the set it receives
 * because it operates on a fresh clone. Supports both data-first and data-last
 * (pipeable) call styles.
 *
 * @example
 * ```ts
 * import { SetX } from "@nunofyobiz/effect-extras"
 * import { pipe } from "effect"
 *
 * const original = new Set(["a", "b"])
 *
 * const result = pipe(
 *   original,
 *   SetX.safelyMutate((set) => {
 *     set.delete("a")
 *     return set.add("c")
 *   })
 * )
 *
 * assert.deepStrictEqual(result, new Set(["b", "c"]))
 * // The original is left intact
 * assert.deepStrictEqual(original, new Set(["a", "b"]))
 * ```
 *
 * @category combinators
 * @since 0.0.0
 */
export const safelyMutate = dual<
  <A>(mutate: (set: Set<A>) => Set<A>) => (set: Set<A>) => Set<A>,
  <A>(set: Set<A>, mutate: (set: Set<A>) => Set<A>) => Set<A>
>(2, <A>(set: Set<A>, mutate: (set: Set<A>) => Set<A>): Set<A> => {
  const copy = new Set(set);
  return mutate(copy);
});

/**
 * Returns a new `Set` with `value` added, leaving the input set unchanged.
 *
 * When `value` is already present the input set is returned as-is (no copy),
 * making repeated adds of existing members allocation-free. Supports both
 * data-first and data-last (pipeable) call styles.
 *
 * @example
 * ```ts
 * import { SetX } from "@nunofyobiz/effect-extras"
 * import { pipe } from "effect"
 *
 * // Data-first — adds a new element into a fresh set
 * assert.deepStrictEqual(
 *   SetX.add(new Set(["a", "b"]), "c"),
 *   new Set(["a", "b", "c"])
 * )
 *
 * // Data-last — existing element leaves the set unchanged
 * assert.deepStrictEqual(
 *   pipe(new Set(["a", "b"]), SetX.add("b")),
 *   new Set(["a", "b"])
 * )
 * ```
 *
 * @category combinators
 * @since 0.0.0
 */
export const add = dual<
  <A>(value: A) => (set: Set<A>) => Set<A>,
  <A>(set: Set<A>, value: A) => Set<A>
>(
  2,
  <A>(set: Set<A>, value: A): Set<A> =>
    set.has(value) ? set : new Set(set).add(value),
);

/**
 * Returns a new `Set` with `value` removed, leaving the input set unchanged.
 *
 * When `value` is absent the input set is returned as-is (no copy). Supports both
 * data-first and data-last (pipeable) call styles.
 *
 * @example
 * ```ts
 * import { SetX } from "@nunofyobiz/effect-extras"
 * import { pipe } from "effect"
 *
 * // Data-first — removes an existing element into a fresh set
 * assert.deepStrictEqual(
 *   SetX.remove(new Set(["a", "b", "c"]), "c"),
 *   new Set(["a", "b"])
 * )
 *
 * // Data-last — absent element leaves the set unchanged
 * assert.deepStrictEqual(
 *   pipe(new Set(["a", "b"]), SetX.remove("z")),
 *   new Set(["a", "b"])
 * )
 * ```
 *
 * @category combinators
 * @since 0.0.0
 */
export const remove = dual<
  <A>(value: A) => (set: Set<A>) => Set<A>,
  <A>(set: Set<A>, value: A) => Set<A>
>(2, <A>(set: Set<A>, value: A): Set<A> => {
  if (set.has(value)) {
    const newSet = new Set(set);
    newSet.delete(value);
    return newSet;
  }
  return set;
});

/**
 * Returns a new `Set` with `value` added if it was absent or removed if it was
 * present, leaving the input set unchanged.
 *
 * Use it for membership toggles (selection state, feature flags by key) where a
 * value's presence should flip on each call. Supports both data-first and
 * data-last (pipeable) call styles.
 *
 * @example
 * ```ts
 * import { SetX } from "@nunofyobiz/effect-extras"
 * import { pipe } from "effect"
 *
 * // Data-first — absent value gets added
 * assert.deepStrictEqual(
 *   SetX.toggle(new Set(["a", "b"]), "c"),
 *   new Set(["a", "b", "c"])
 * )
 *
 * // Data-last — present value gets removed
 * assert.deepStrictEqual(
 *   pipe(new Set(["a", "b", "c"]), SetX.toggle("b")),
 *   new Set(["a", "c"])
 * )
 * ```
 *
 * @category combinators
 * @since 0.0.0
 */
export const toggle = dual<
  <A>(value: A) => (set: Set<A>) => Set<A>,
  <A>(set: Set<A>, value: A) => Set<A>
>(
  2,
  <A>(set: Set<A>, value: A): Set<A> =>
    set.has(value) ? remove(set, value) : add(set, value),
);
