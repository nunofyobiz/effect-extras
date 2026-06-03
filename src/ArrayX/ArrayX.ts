import {
  Array,
  Equivalence,
  Option,
  Order,
  Predicate,
  Record,
  pipe,
} from "effect";
import { dual, identity } from "effect/Function";
import { RecordX } from "../RecordX";
import { These } from "../These";
import { ResultX } from "../ResultX";

/**
 * Pipeable, dual-form alias for `Array.prototype.slice(start, end)`.
 *
 * `Array.prototype.slice` is already non-mutating (it returns a shallow copy),
 * but it isn't pipeable. This helper makes it composable inside `pipe(...)`
 * chains alongside the rest of the codebase's Effect-style utilities.
 */
export const slice = dual<
  <A>(start: number, end: number) => (array: readonly A[]) => A[],
  <A>(array: readonly A[], start: number, end: number) => A[]
>(3, <A>(array: readonly A[], start: number, end: number): A[] =>
  array.slice(start, end),
);

export const zipWithThese = dual<
  <A, B, C>(
    f: (ab: These.These<A, B>) => C,
  ) => (array1: readonly A[], array2: readonly B[]) => C[],
  <A, B, C>(
    array1: readonly A[],
    array2: readonly B[],
    f: (ab: These.These<A, B>) => C,
  ) => C[]
>(
  3,
  <A, B, C>(
    array1: readonly A[],
    array2: readonly B[],
    f: (ab: These.These<A, B>) => C,
  ): C[] => {
    const newLength = Math.max(array1.length, array2.length);

    if (newLength === 0) {
      return [];
    }

    return Array.makeBy(newLength, (index) => {
      if (index < array1.length && index < array2.length) {
        return f(
          These.LeftAndRight({
            left: array1[index],
            right: array2[index],
          }),
        );
      }

      if (index < array1.length) {
        return f(
          These.LeftOnly({
            left: array1[index],
          }),
        );
      }

      if (index < array2.length) {
        return f(
          These.RightOnly({
            right: array2[index],
          }),
        );
      }

      throw new Error(`Index ${index} is out of bounds for array1 and array2`);
    });
  },
);

/**
 * Moves a unique item within an array to a new position, using a custom identification function.
 *
 * **Assumption**: Items should be unique in the array based on the identification function.
 *
 * **Happy case**: If the source item is found exactly once and the destination reference item is found (or null, to move to the end):
 * The source item is moved from its current position to the new position
 *
 * **Source item not found**: The array is returned unchanged, regardless of whether the destination reference item exists.
 *
 * **Source item found but duplicated**:
 * - If destination reference item is found: All copies of the source item are removed, then a single copy is inserted before the destination reference item
 * - If destination reference item is not found: The array is returned completely unchanged (no items are moved or removed)
 *
 * Used internally by {@link insertUniq}; not exported as the codebase has no
 * direct callers.
 */
const moveUniqWith = dual<
  <A, I extends string | number>(config: {
    identify: (item: A) => I;
    sourceId: I;
    moveToBeLeftOfId: I | null;
  }) => (array: readonly A[] | A[]) => A[],
  <A, I extends string | number>(
    array: readonly A[] | A[],
    config: {
      identify: (item: A) => I;
      sourceId: I;
      moveToBeLeftOfId: I | null;
    },
  ) => A[]
>(
  2,
  <A, I extends string | number>(
    inputArray: readonly A[] | A[],
    {
      identify,
      sourceId,
      moveToBeLeftOfId,
    }: {
      identify: (item: A) => I;
      sourceId: I;
      moveToBeLeftOfId: I | null;
    },
  ): A[] => {
    const array: A[] = [...inputArray];

    // Find the source item and its index
    const sourceIndex = array.findIndex((item) => identify(item) === sourceId);
    if (sourceIndex < 0) {
      return array;
    }

    const sourceItem = array[sourceIndex];

    // Remove ALL occurrences of the source item from the array
    const arrayWithoutSource = array.filter(
      (item) => identify(item) !== sourceId,
    );

    // If moveToBeLeftOfId is null, move to end
    if (moveToBeLeftOfId === null) {
      return [...arrayWithoutSource, sourceItem];
    }

    // Find the destination index in the array without the source item
    const destinationIndex = arrayWithoutSource.findIndex(
      (item) => identify(item) === moveToBeLeftOfId,
    );
    if (destinationIndex < 0) {
      // If destination not found, leave array completely unchanged
      return array;
    }

    // Insert the source item before the destination index
    return [
      ...slice(arrayWithoutSource, 0, destinationIndex),
      sourceItem,
      ...slice(arrayWithoutSource, destinationIndex, arrayWithoutSource.length),
    ];
  },
);

/**
 * Inserts or moves a unique item in an array at a specified position.
 *
 * **Assumption**: Items should be unique in the array based on standard equality.
 *
 * **Happy case**: If the item doesn't exist in the array and the destination reference item is found:
 * The new item is inserted before the destination reference item
 *
 * **Item not found in array**:
 * - If destination reference item is found: The new item is inserted before the destination reference item
 * - If destination reference item is not found: The new item is inserted at the end of the array
 *
 * **Item found but duplicated**:
 * - If destination reference item is found: All existing copies are removed, then a single copy is inserted before the destination reference item
 * - If destination reference item is not found: All existing copies are removed, then a single copy is inserted at the end of the array
 *
 * @param array - The input array to modify
 * @param config - Configuration object containing:
 *   - `item`: The item to insert or update (must be a string or number)
 *   - `insertToBeLeftOf`: The item to position the new/updated item before,
 *                         or null to insert at the end
 *
 * @returns A new array with the item inserted or moved to the specified position
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
    // Always deduplicate and append the item to the end for insertUniq
    // This ensures we always have exactly one copy of the item, regardless of destination
    const arrayWithNewItem = pipe(
      array,
      Array.filter((existingItem) => existingItem !== item),
      Array.append(item),
    );

    // Now move that new item to the desired position
    return moveUniqWith(arrayWithNewItem, {
      identify: identity,
      sourceId: item,
      moveToBeLeftOfId: insertToBeLeftOf,
    });
  },
);

/**
 * Same as Array.mapAccum, but iterates over the array from right to left
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
 * Basically the same as Effect's Array.max() function, but works on potentially empty arrays
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

export const categorize = <A, C extends string>(
  items: Iterable<A>,
  categorize: (a: A) => C,
): Partial<Record<C, A[]>> =>
  Array.reduce(
    items,

    // Start with an empty record of categorized items. `Record.empty()`
    // returns a `NonLiteralKey<C>`-keyed record, which is structurally
    // equivalent to `Partial<Record<C, A[]>>`; the cast tells TypeScript
    // we'll be writing typed keys back via the reducer below.
    Record.empty<C, A[]>() as Record<C, A[]>,

    // For each item, add it to the appropriate category
    (categorizedItems, item: A) =>
      RecordX.upsert(
        categorizedItems,
        categorize(item), // This is the next item's category
        Option.match({
          // This is the first item in this category, so create a new array
          onNone: () => Array.of(item),

          // Append the item to the existing array
          onSome: Array.append(item),
        }),
      ),
  );

export const compactNullable = <A>(array: A[]): NonNullable<A>[] =>
  Array.filter(array, Predicate.isNotNullish);

export const filterHead = dual<
  <A>(predicate: Predicate.Predicate<A>) => (array: A[]) => A[],
  <A>(array: A[], predicate: Predicate.Predicate<A>) => A[]
>(2, <A>(array: A[], predicate: Predicate.Predicate<A>): A[] => {
  const firstMatchingIndex = Array.findFirstIndex(array, predicate);
  return Option.match(firstMatchingIndex, {
    onSome: (index) => slice(array, index, array.length),
    onNone: () => [],
  });
});

export const filterTail = dual<
  <A>(predicate: Predicate.Predicate<A>) => (array: A[]) => A[],
  <A>(array: A[], predicate: Predicate.Predicate<A>) => A[]
>(2, <A>(array: A[], predicate: Predicate.Predicate<A>): A[] => {
  const lastMatchingIndex = Array.findLastIndex(array, predicate);
  return Option.match(lastMatchingIndex, {
    onSome: (index) => slice(array, 0, index + 1),
    onNone: () => [],
  });
});

export const filterMapNullable = dual<
  <A, B>(f: (a: A) => B | null) => (array: A[]) => NonNullable<B>[],
  <A, B>(array: A[], f: (a: A) => B | null) => NonNullable<B>[]
>(2, <A, B>(array: A[], f: (a: A) => B | null): NonNullable<B>[] =>
  pipe(
    array,
    Array.filterMap((value) =>
      pipe(f(value), Option.fromNullishOr, ResultX.fromOption),
    ),
  ),
);

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
    if (array.length === 0) {
      return [];
    }

    const result: { group: B; values: Array.NonEmptyArray<A> }[] = [];

    for (const item of array) {
      const groupValue = chunk(item);

      if (result.length > 0) {
        const lastGroup = result.at(-1);
        if (lastGroup && chunkEquals(lastGroup.group, groupValue)) {
          // Add to current group
          lastGroup.values.push(item);
          continue;
        }
      }

      // Start a new group
      result.push({ group: groupValue, values: Array.of(item) });
    }

    return result;
  },
);
