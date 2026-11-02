/**
 * Generic, framework-agnostic extensions to Effect's `Array` module.
 *
 * @since 0.0.0
 */
import { Array, Equivalence, Option, Order, Predicate, pipe } from "effect";
import { dual } from "effect/Function";

/**
 * Returns a shallow copy of `array` between `start` (inclusive) and `end`
 * (exclusive). Use it to select a portion of a list inside an Effect pipeline.
 *
 * `Array.prototype.slice` is already non-mutating (it returns a shallow copy),
 * but it isn't pipeable. This helper makes it composable inside `pipe(...)`
 * chains alongside the rest of the codebase's Effect-style utilities.
 *
 * @example
 * ```ts
 * import { pipe } from "effect"
 * import { ArrayX } from "@nunofyobiz/effect-extras"
 *
 * const guests = ["Amira", "Ben", "Chloe", "Diego"]
 * // Select the middle two guests without changing the invitation list.
 * assert.deepStrictEqual(ArrayX.slice(guests, 1, 3), ["Ben", "Chloe"])
 *
 * assert.deepStrictEqual(pipe(guests, ArrayX.slice(1, 3)), ["Ben", "Chloe"])
 * ```
 *
 * @category getters
 * @since 0.0.0
 */
export const slice = dual<
  <A>(start: number, end: number) => (array: readonly A[]) => A[],
  <A>(array: readonly A[], start: number, end: number) => A[]
>(3, <A>(array: readonly A[], start: number, end: number): A[] =>
  array.slice(start, end),
);

/**
 * Inserts or moves an item before another item, removing existing copies of the
 * item first. Use it to reorder a list of string or number identifiers without
 * mutating the original array.
 *
 * The item is inserted before the first matching destination remaining after
 * removal. A null or missing destination appends it to the end. When the
 * destination equals the item, removal leaves no destination, so it also appends.
 * Comparisons use strict equality (`===`): strings and numbers are distinct,
 * signed zeros are equal, and `NaN` never matches or gets removed.
 *
 * @param array - The input array to modify
 * @param config - Configuration object containing:
 *   - `item`: The item to insert or update (must be a string or number)
 *   - `insertToBeLeftOf`: The item to position the new/updated item before,
 *                         or null to insert at the end
 *
 * @returns A new array with the item inserted or moved to the specified position
 *
 * @example
 * ```ts
 * import { ArrayX } from "@nunofyobiz/effect-extras"
 *
 * const shopping = ["bread", "milk", "apples", "coffee"]
 * // Move bread just before apples; the original shopping list stays unchanged.
 * assert.deepStrictEqual(
 *   ArrayX.insertUniq(shopping, { item: "bread", insertToBeLeftOf: "apples" }),
 *   ["milk", "bread", "apples", "coffee"],
 * )
 *
 * // Add eggs at the end when no destination is requested.
 * assert.deepStrictEqual(
 *   ArrayX.insertUniq(shopping, { item: "eggs", insertToBeLeftOf: null }),
 *   ["bread", "milk", "apples", "coffee", "eggs"],
 * )
 * ```
 *
 * @category combinators
 * @since 0.0.0
 */
export const insertUniq = dual<
  <A extends string | number>(config: {
    item: A;
    insertToBeLeftOf: A | null;
  }) => (array: readonly A[] | A[]) => A[],
  <A extends string | number>(
    array: readonly A[] | A[],
    config: {
      item: A;
      insertToBeLeftOf: A | null;
    },
  ) => A[]
>(
  2,
  <A extends string | number>(
    array: readonly A[] | A[],
    { item, insertToBeLeftOf }: { item: A; insertToBeLeftOf: A | null },
  ): A[] => {
    // Always deduplicate first so there is exactly one copy of the item,
    // regardless of destination
    const arrayWithoutItem = Array.filter(
      array,
      (existingItem) => existingItem !== item,
    );

    return pipe(
      Option.fromNullOr(insertToBeLeftOf),
      Option.flatMap((destination) =>
        Array.findFirstIndex(
          arrayWithoutItem,
          (existingItem) => existingItem === destination,
        ),
      ),
      Option.flatMap((index) => Array.insertAt(arrayWithoutItem, index, item)),
      Option.getOrElse(() => Array.append(arrayWithoutItem, item)),
    );
  },
);

/**
 * Maps over `array` while threading an accumulator, iterating from right to
 * left instead of left to right.
 *
 * Identical to `Array.mapAccum`, except the traversal order is reversed: `f` is
 * called on the last element first, and the resulting array is returned in the
 * original (left-to-right) order. Use it when each element's mapped value
 * depends on state accumulated from the elements that follow it.
 * Callback indices count traversal steps: the last input element receives index
 * zero, the next-to-last receives one, and so on.
 *
 * @example
 * ```ts
 * import { ArrayX } from "@nunofyobiz/effect-extras"
 *
 * const playlist = [
 *   { title: "Morning Walk", minutes: 3 },
 *   { title: "Sea Breeze", minutes: 4 },
 *   { title: "Home Again", minutes: 2 },
 * ]
 * // Each track shows the minutes left from its start through the end of the playlist.
 * assert.deepStrictEqual(
 *   ArrayX.mapRightAccum(playlist, 0, (remaining, track) => [
 *     remaining + track.minutes,
 *     { title: track.title, remaining: remaining + track.minutes },
 *   ]),
 *   [9, [
 *     { title: "Morning Walk", remaining: 9 },
 *     { title: "Sea Breeze", remaining: 6 },
 *     { title: "Home Again", remaining: 2 },
 *   ]],
 * )
 * ```
 *
 * @category folding
 * @since 0.0.0
 */
export const mapRightAccum = dual<
  <A, B, C>(
    initialAccumulator: C,
    f: (accumulator: C, a: A, index: number) => [C, B],
  ) => (array: A[]) => [C, B[]],
  <A, B, C>(
    array: A[],
    initialAccumulator: C,
    f: (accumulator: C, a: A, index: number) => [C, B],
  ) => [C, B[]]
>(
  3,
  <A, B, C>(
    array: A[],
    initialAccumulator: C,
    f: (accumulator: C, a: A, index: number) => [C, B],
  ): [C, B[]] => {
    const [accumulator, result] = pipe(
      array,
      Array.reverse,
      Array.mapAccum(initialAccumulator, f),
    );
    return [accumulator, Array.reverse(result)];
  },
);

/**
 * Returns the maximum element of `array` according to `order`, wrapped in an
 * `Option` so that empty arrays are handled safely.
 *
 * Effect's `Array.max` throws on an empty array; this returns `Option.none()`
 * instead, and `Option.some(max)` otherwise. Reach for it whenever the input
 * array might be empty.
 *
 * @example
 * ```ts
 * import { Option, Order } from "effect"
 * import { ArrayX } from "@nunofyobiz/effect-extras"
 *
 * const cart = [{ name: "Tea", price: 4 }, { name: "Coffee", price: 9 }]
 * const byPrice = Order.mapInput(Order.Number, (product: { price: number }) => product.price)
 * // Pick the most expensive product; an empty cart has no maximum.
 * assert.deepStrictEqual(ArrayX.maxOption(cart, byPrice), Option.some(cart[1]))
 * assert.deepStrictEqual(
 *   ArrayX.maxOption([], byPrice),
 *   Option.none(),
 * )
 * ```
 *
 * @category getters
 * @since 0.0.0
 */
export const maxOption = dual<
  <A>(order: Order.Order<A>) => (array: A[]) => Option.Option<A>,
  <A>(array: A[], order: Order.Order<A>) => Option.Option<A>
>(
  2,
  <A>(array: A[], order: Order.Order<A>): Option.Option<A> =>
    pipe(
      // If the array is empty, there is no max
      array,
      Option.liftPredicate(Array.isArrayNonEmpty),

      // If it is non-empty, get the max
      Option.map(Array.max(order)),
    ),
);

const takeFirstOrLastWhere = dual<
  <A, B extends A>(
    predicate: Predicate.Refinement<A, B>,
    takeOne: (array: Array.NonEmptyReadonlyArray<B>) => B,
  ) => (array: A[]) => Option.Option<B>,
  <A, B extends A>(
    array: A[],
    predicate: Predicate.Refinement<A, B>,
    takeOne: (array: Array.NonEmptyReadonlyArray<B>) => B,
  ) => Option.Option<B>
>(
  3,
  <A, B extends A>(
    array: A[],
    predicate: Predicate.Refinement<A, B>,
    takeOne: (array: Array.NonEmptyReadonlyArray<B>) => B,
  ): Option.Option<B> =>
    pipe(
      // Keep only the items that match
      array,
      Array.filter(predicate),

      // If there is anything left, take one
      Option.liftPredicate(Array.isArrayNonEmpty),
      Option.map(takeOne),
    ),
);

/**
 * Picks the smallest matching element according to `order`, or returns
 * `Option.none()` if nothing matches. Use it to find the lowest-ranked eligible
 * item, regardless of its position in the list.
 *
 * Combines a refinement filter with `Array.min`: only elements satisfying
 * `predicate` are considered, and the minimum of those (by `order`) is
 * returned. The refinement narrows the element type, so the resulting `Option`
 * carries the more specific `B`.
 *
 * @example
 * ```ts
 * import { Option, Order } from "effect"
 * import { ArrayX } from "@nunofyobiz/effect-extras"
 *
 * type Product = { name: string; price: number; available: boolean }
 * const cart: Product[] = [
 *   { name: "Tea", price: 4, available: false },
 *   { name: "Coffee", price: 9, available: true },
 *   { name: "Bread", price: 5, available: true },
 * ]
 * const isAvailable = (product: Product): product is Product => product.available
 * const byPrice = Order.mapInput(Order.Number, (product: Product) => product.price)
 * // Ignore unavailable tea and choose the cheapest available product.
 *
 * assert.deepStrictEqual(
 *   ArrayX.takeFirstWhere(cart, isAvailable, byPrice),
 *   Option.some({ name: "Bread", price: 5, available: true }),
 * )
 * assert.deepStrictEqual(
 *   ArrayX.takeFirstWhere([], isAvailable, byPrice),
 *   Option.none(),
 * )
 * ```
 *
 * @category getters
 * @since 0.0.0
 */
export const takeFirstWhere = dual<
  <A, B extends A>(
    predicate: Predicate.Refinement<A, B>,
    order: Order.Order<B>,
  ) => (array: A[]) => Option.Option<B>,
  <A, B extends A>(
    array: A[],
    predicate: Predicate.Refinement<A, B>,
    order: Order.Order<B>,
  ) => Option.Option<B>
>(
  3,
  <A, B extends A>(
    array: A[],
    predicate: Predicate.Refinement<A, B>,
    order: Order.Order<B>,
  ): Option.Option<B> =>
    takeFirstOrLastWhere(array, predicate, Array.min(order)),
);

/**
 * Picks the largest matching element according to `order`, or returns
 * `Option.none()` if nothing matches. Use it to find the highest-ranked eligible
 * item, regardless of its position in the list.
 *
 * The mirror of {@link takeFirstWhere}: only elements satisfying `predicate`
 * are considered, and the maximum of those (by `order`) is returned. The
 * refinement narrows the element type, so the resulting `Option` carries the
 * more specific `B`.
 *
 * @example
 * ```ts
 * import { Option, Order } from "effect"
 * import { ArrayX } from "@nunofyobiz/effect-extras"
 *
 * type Product = { name: string; price: number; available: boolean }
 * const cart: Product[] = [
 *   { name: "Tea", price: 4, available: true },
 *   { name: "Coffee", price: 9, available: false },
 *   { name: "Bread", price: 5, available: true },
 * ]
 * const isAvailable = (product: Product): product is Product => product.available
 * const byPrice = Order.mapInput(Order.Number, (product: Product) => product.price)
 * // Ignore unavailable coffee and choose the most expensive available product.
 *
 * assert.deepStrictEqual(
 *   ArrayX.takeLastWhere(cart, isAvailable, byPrice),
 *   Option.some({ name: "Bread", price: 5, available: true }),
 * )
 * assert.deepStrictEqual(
 *   ArrayX.takeLastWhere([], isAvailable, byPrice),
 *   Option.none(),
 * )
 * ```
 *
 * @category getters
 * @since 0.0.0
 */
export const takeLastWhere = dual<
  <A, B extends A>(
    predicate: Predicate.Refinement<A, B>,
    order: Order.Order<B>,
  ) => (array: A[]) => Option.Option<B>,
  <A, B extends A>(
    array: A[],
    predicate: Predicate.Refinement<A, B>,
    order: Order.Order<B>,
  ) => Option.Option<B>
>(
  3,
  <A, B extends A>(
    array: A[],
    predicate: Predicate.Refinement<A, B>,
    order: Order.Order<B>,
  ): Option.Option<B> =>
    takeFirstOrLastWhere(array, predicate, Array.max(order)),
);

/**
 * Collects items into arrays under their category names, preserving their order
 * within each category. Use Effect's `Array.groupBy` for new category-based
 * grouping code.
 *
 * Each item is appended to the array under its category, preserving input
 * order. The result is `Partial<Record<C, A[]>>` because not every possible
 * category `C` is guaranteed to appear — only categories that received at least
 * one item are present.
 *
 * @example
 * ```ts
 * import { Array } from "effect"
 *
 * const parity = (n: number) => (n % 2 === 0 ? "even" : "odd")
 *
 * assert.deepStrictEqual(Array.groupBy([1, 2, 3, 4], parity), {
 *   odd: [1, 3],
 *   even: [2, 4],
 * })
 * ```
 *
 * @deprecated Use `Array.groupBy` instead.
 * @category folding
 * @since 0.0.0
 */
export function categorize<A, C extends string>(
  items: Iterable<A>,
  categorize: (a: A) => C,
): Partial<Record<C, A[]>>;
export function categorize<A>(
  items: Iterable<A>,
  categorize: (a: A) => string,
): Partial<Record<string, A[]>> {
  return Array.groupBy(items, categorize);
}

/**
 * Removes all `null` and `undefined` elements from a list. Use it to turn a list
 * of optional values into a list of present values, with type `NonNullable<A>`.
 *
 * Falsy-but-present values such as `0` and `""` are kept — only nullish values
 * are dropped. Use it to clean up an array of optionals into a dense array of
 * known-present values.
 *
 * @example
 * ```ts
 * import { ArrayX } from "@nunofyobiz/effect-extras"
 *
 * const invitees = ["Amira", null, "Ben", undefined, "Chloe"]
 * // Remove missing names before printing the invitation list.
 * assert.deepStrictEqual(ArrayX.compactNullable(invitees), ["Amira", "Ben", "Chloe"])
 * ```
 *
 * @category filtering
 * @since 0.0.0
 */
export const compactNullable = <A>(array: A[]): NonNullable<A>[] =>
  Array.filter(array, Predicate.isNotNullish);

/**
 * Drops the leading elements of `array` until `predicate` first holds, keeping
 * everything from the first match onward.
 * Use it to trim an unusable prefix while preserving the rest of a list.
 *
 * The first matching element and all subsequent elements are retained
 * regardless of whether they match — only the prefix *before* the first match
 * is trimmed. If nothing matches, returns an empty array.
 *
 * @example
 * ```ts
 * import { ArrayX } from "@nunofyobiz/effect-extras"
 *
 * const readingList = [
 *   { title: "Dune", available: false },
 *   { title: "The Hobbit", available: true },
 *   { title: "Foundation", available: false },
 * ]
 * // Start at the first available book, retaining later books even if unavailable.
 * assert.deepStrictEqual(
 *   ArrayX.filterHead(readingList, (book) => book.available),
 *   [
 *     { title: "The Hobbit", available: true },
 *     { title: "Foundation", available: false },
 *   ],
 * )
 * ```
 *
 * @category filtering
 * @since 0.0.0
 */
export const filterHead = dual<
  <A>(predicate: Predicate.Predicate<A>) => (array: A[]) => A[],
  <A>(array: A[], predicate: Predicate.Predicate<A>) => A[]
>(2, <A>(array: A[], predicate: Predicate.Predicate<A>): A[] =>
  Array.dropWhile(array, Predicate.not(predicate)),
);

/**
 * Drops the trailing elements of `array` after `predicate` last holds, keeping
 * everything up to and including the last match.
 * Use it to trim an unusable suffix while preserving the earlier list.
 *
 * The mirror of {@link filterHead}: the last matching element and all preceding
 * elements are retained regardless of whether they match — only the suffix
 * *after* the last match is trimmed. If nothing matches, returns an empty
 * array.
 *
 * @example
 * ```ts
 * import { ArrayX } from "@nunofyobiz/effect-extras"
 *
 * const readingList = [
 *   { title: "Dune", available: false },
 *   { title: "The Hobbit", available: true },
 *   { title: "Foundation", available: false },
 * ]
 * // End at the last available book, retaining earlier books even if unavailable.
 * assert.deepStrictEqual(
 *   ArrayX.filterTail(readingList, (book) => book.available),
 *   [
 *     { title: "Dune", available: false },
 *     { title: "The Hobbit", available: true },
 *   ],
 * )
 * ```
 *
 * @category filtering
 * @since 0.0.0
 */
export const filterTail = dual<
  <A>(predicate: Predicate.Predicate<A>) => (array: A[]) => A[],
  <A>(array: A[], predicate: Predicate.Predicate<A>) => A[]
>(2, <A>(array: A[], predicate: Predicate.Predicate<A>): A[] =>
  // Effect 4.0.2 has no `dropRightWhile`, so this reverses twice instead of
  // slicing once. That's a deliberate trade for staying on Effect `Array`
  // with no manual index slicing.
  Array.reverse(
    Array.dropWhile(Array.reverse(array), Predicate.not(predicate)),
  ),
);

/**
 * Transforms each element and drops results that are `null` or `undefined`.
 * Use Effect's `Array.flatMapNullishOr` for new code that maps optional results;
 * the result type is narrowed to `NonNullable<B>`.
 *
 * A nullable-friendly `Array.filterMap`: where `filterMap` expects `f` to
 * return an `Option`, this accepts a function returning `B | null` (or
 * `undefined`) and treats nullish results as "skip this element". Falsy-but-
 * present values such as `0` and `""` are kept.
 *
 * @example
 * ```ts
 * import { Array } from "effect"
 *
 * // Keep only the even numbers, mapped to their halves
 * assert.deepStrictEqual(
 *   Array.flatMapNullishOr([1, 2, 3, 4], (n) => (n % 2 === 0 ? n / 2 : null)),
 *   [1, 2],
 * )
 * ```
 *
 * @deprecated Use `Array.flatMapNullishOr` instead.
 * @category filtering
 * @since 0.0.0
 */
export const filterMapNullable = dual<
  <A, B>(f: (a: A) => B | null) => (array: A[]) => NonNullable<B>[],
  <A, B>(array: A[], f: (a: A) => B | null) => NonNullable<B>[]
>(2, <A, B>(array: A[], f: (a: A) => B | null): NonNullable<B>[] =>
  Array.flatMapNullishOr(array, f),
);

/**
 * Finds the first element of a 2-dimensional array (row-major order) matching
 * `predicate`, returning it alongside its row and column indices.
 * Use it to locate a value in nested lists without flattening away its position.
 *
 * Scans rows top-to-bottom and, within each row, left-to-right. On a match
 * returns `Option.some([value, rowIndex, columnIndex])`; if no element matches
 * (or the grid is empty), returns `Option.none()`.
 *
 * @example
 * ```ts
 * import { Option } from "effect"
 * import { ArrayX } from "@nunofyobiz/effect-extras"
 *
 * const shelves = [
 *   ["Dune", "Foundation"],
 *   ["The Hobbit", "Piranesi", "Earthsea"],
 * ]
 *
 * // Piranesi is on the second shelf in the second slot (indices start at zero).
 * assert.deepStrictEqual(
 *   ArrayX.findFirstWithIndex2d(shelves, (book) => book === "Piranesi"),
 *   Option.some(["Piranesi", 1, 1]),
 * )
 * ```
 *
 * @category getters
 * @since 0.0.0
 */
export const findFirstWithIndex2d = dual<
  <A>(
    predicate: Predicate.Predicate<A>,
  ) => (array: A[][]) => Option.Option<[A, number, number]>,
  <A>(
    array: A[][],
    predicate: Predicate.Predicate<A>,
  ) => Option.Option<[A, number, number]>
>(
  2,
  <A>(
    array: A[][],
    predicate: Predicate.Predicate<A>,
  ): Option.Option<[A, number, number]> =>
    Array.findFirstWithIndex(array, (row) =>
      Array.findFirstWithIndex(row, predicate),
    ).pipe(
      Option.map(([[value, secondIndex], firstIndex]) => [
        value,
        firstIndex,
        secondIndex,
      ]),
    ),
);

/**
 * Splits `array` into runs of consecutive elements that share the same group
 * value. Use it to segment a list while keeping separate runs with the same key
 * separate. The group is derived by `chunk` and compared with the provided
 * `Equivalence`.
 *
 * Only *adjacent* elements are grouped: a new run starts every time the group
 * value differs from the first group value of the current run. The comparator
 * receives `(firstGroup, currentGroup)`, and `chunk` is called once per element
 * in input order. Each entry in the result carries the
 * `group` value and the non-empty array of `values` that produced it, preserving
 * input order. An empty input yields an empty array. Use it for run-length-style
 * segmentation; reach for `Array.groupBy` instead when you want all elements
 * with the same key collapsed regardless of position.
 *
 * @example
 * ```ts
 * import { Equivalence } from "effect"
 * import { ArrayX } from "@nunofyobiz/effect-extras"
 *
 * const calendar = [
 *   { day: "Monday", title: "Dentist" },
 *   { day: "Monday", title: "Lunch" },
 *   { day: "Tuesday", title: "Book club" },
 *   { day: "Monday", title: "Call Mum" },
 * ]
 * // Group consecutive entries by day; the later Monday entry starts a separate run.
 * assert.deepStrictEqual(
 *   ArrayX.chunkBy(calendar, (entry) => entry.day, Equivalence.String),
 *   [
 *     { group: "Monday", values: [
 *       { day: "Monday", title: "Dentist" },
 *       { day: "Monday", title: "Lunch" },
 *     ] },
 *     { group: "Tuesday", values: [{ day: "Tuesday", title: "Book club" }] },
 *     { group: "Monday", values: [{ day: "Monday", title: "Call Mum" }] },
 *   ],
 * )
 * ```
 *
 * @category folding
 * @since 0.0.0
 */
export const chunkBy = dual<
  <A, B>(
    chunk: (a: A) => B,
    GroupEquivalence: Equivalence.Equivalence<B>,
  ) => (array: A[]) => { group: B; values: Array.NonEmptyArray<A> }[],
  <A, B>(
    array: A[],
    chunk: (a: A) => B,
    GroupEquivalence: Equivalence.Equivalence<B>,
  ) => { group: B; values: Array.NonEmptyArray<A> }[]
>(
  3,
  <A, B>(
    array: A[],
    chunk: (a: A) => B,
    chunkEquals: Equivalence.Equivalence<B>,
  ): { group: B; values: Array.NonEmptyArray<A> }[] => {
    const pairs = Array.map(array, (item) => ({ group: chunk(item), item }));

    if (!Array.isArrayNonEmpty(pairs)) {
      return [];
    }

    return Array.map(
      Array.groupWith(pairs, (current, headOfRun) =>
        chunkEquals(headOfRun.group, current.group),
      ),
      (run) => ({
        group: run[0].group,
        values: Array.map(run, ({ item }) => item),
      }),
    );
  },
);
