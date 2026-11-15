/**
 * Generic, framework-agnostic extensions to Effect's `Order` module.
 *
 * @since 0.0.0
 */
import { Number as EffectNumber, Order } from "effect";

/**
 * Orders a set of values by their assigned numeric ranks, lowest rank first.
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
 * const OrderTicketPriorities = OrderX.rankedEnum({ urgent: 0, normal: 1, low: 2 })
 *
 * // Show urgent support tickets before normal and low-priority tickets.
 * assert.deepStrictEqual(
 *   Array.sort(["low", "urgent", "normal"], OrderTicketPriorities),
 *   ["urgent", "normal", "low"]
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
