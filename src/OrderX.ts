/**
 * Generic, framework-agnostic extensions to Effect's `Order` module.
 *
 * @since 0.0.0
 */
import { Number as EffectNumber, Order } from "effect";

/**
 * Builds an `Order.Order` for an enum-like set of values from an explicit rank
 * table, sorting each value by its assigned numeric rank.
 *
 * Use it when a union of string (or other `PropertyKey`) literals has a natural
 * priority that isn't its alphabetical order — pass a record mapping every
 * member to a rank and the resulting order sorts ascending by that rank.
 *
 * @example
 * ```ts
 * import { OrderX } from "@nunofyobiz/effect-extras"
 * import { Array } from "effect"
 *
 * const byAge = OrderX.rankedEnum({ child: 0, parent: 1, grandparent: 2 })
 *
 * assert.deepStrictEqual(
 *   Array.sort(["parent", "grandparent", "child"], byAge),
 *   ["child", "parent", "grandparent"]
 * )
 * ```
 *
 * @category ordering
 * @since 0.0.0
 */
export const rankedEnum =
  <const A extends PropertyKey>(ranks: Record<A, number>): Order.Order<A> =>
  (self, that) =>
    EffectNumber.sign(ranks[self] - ranks[that]);

/**
 * Builds an order that sorts values by their key's position in `priority`,
 * with every unlisted key sorting after all listed keys.
 *
 * Reads `priority` once at construction, so one-shot iterators work and later
 * changes to the iterable do not affect the order. Duplicate keys keep their
 * first position. Keys match using native `Map` equality (SameValueZero),
 * including object identity rather than Effect structural equality.
 *
 * Values sharing a key and all unlisted values compare as `0`. Compose with
 * `Order.combine(byPriority(priority, keyOf), fallback)` to break those ties.
 * Each comparison projects each value once and performs two map lookups,
 * returning only `-1`, `0`, or `1`.
 *
 * @example
 * ```ts
 * import { OrderX } from "@nunofyobiz/effect-extras"
 * import { Array } from "effect"
 *
 * const tasks = [
 *   { name: "Water plants", urgency: "routine" },
 *   { name: "Fix leak", urgency: "urgent" },
 *   { name: "Buy groceries", urgency: "soon" }
 * ]
 * const byUrgency = OrderX.byPriority(
 *   ["urgent", "soon"],
 *   (task: { name: string; urgency: string }) => task.urgency
 * )
 *
 * // Urgent tasks come first; unlisted routine tasks come last.
 * assert.deepStrictEqual(Array.sort(tasks, byUrgency), [tasks[1], tasks[2], tasks[0]])
 * ```
 *
 * @category ordering
 * @since 4.2.0
 */
export const byPriority = <A, K>(
  priority: Iterable<K>,
  keyOf: (value: A) => K,
): Order.Order<A> => {
  const ranks = new Map<K, number>();
  let position = 0;
  for (const key of priority) {
    if (!ranks.has(key)) {
      ranks.set(key, position);
    }
    position++;
  }

  return (self, that) => {
    const selfRank = ranks.get(keyOf(self)) ?? Number.POSITIVE_INFINITY;
    const thatRank = ranks.get(keyOf(that)) ?? Number.POSITIVE_INFINITY;
    return selfRank < thatRank ? -1 : selfRank > thatRank ? 1 : 0;
  };
};
