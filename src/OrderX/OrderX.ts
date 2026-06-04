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
