import { Number as EffectNumber, Order } from "effect";

export const rankedEnum =
  <const A extends PropertyKey>(ranks: Record<A, number>): Order.Order<A> =>
  (self, that) =>
    EffectNumber.sign(ranks[self] - ranks[that]);
