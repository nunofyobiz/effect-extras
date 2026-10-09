import { Array } from "effect";
import { describe, expect, test } from "vitest";
import { rankedEnum } from "./OrderX.js";

describe("Order utils", () => {
  describe("orderRankedEnum", () => {
    const OrderRolesByAge = rankedEnum({
      child: 0,
      parent: 1,
      grandparent: 2,
    });

    test("sorting", () => {
      expect(
        Array.sort(
          [
            "parent",
            "grandparent",
            "child",
            "parent",
            "grandparent",
            "child",
            "parent",
          ],
          OrderRolesByAge,
        ),
      ).toStrictEqual([
        "child",
        "child",
        "parent",
        "parent",
        "parent",
        "grandparent",
        "grandparent",
      ]);
    });

    test("equal ranks compare as 0", () => {
      expect(OrderRolesByAge("parent", "parent")).toBe(0);
    });

    test("orders by rank, not value, including negative and non-contiguous ranks", () => {
      const order = rankedEnum({ low: -10, mid: 0, high: 5, top: 100 });

      expect(order("low", "mid")).toBe(-1);
      expect(order("top", "high")).toBe(1);
      expect(Array.sort(["high", "low", "top", "mid"], order)).toStrictEqual([
        "low",
        "mid",
        "high",
        "top",
      ]);
    });

    test("pins today's NaN-rank and equal-infinite-rank results, which differ from Order.mapInput(Order.Number, ...)", () => {
      const order = rankedEnum({
        nanA: Number.NaN,
        nanB: Number.NaN,
        finite: 1,
        pos: Number.POSITIVE_INFINITY,
        neg: Number.NEGATIVE_INFINITY,
      });

      // A NaN rank on either side gives -1, not the +1 that Order.mapInput(Order.Number, ...) gives for (finite, nan).
      expect(order("nanA", "finite")).toBe(-1);
      expect(order("finite", "nanA")).toBe(-1);

      // Two NaN ranks, and a NaN-ranked value compared with itself, give -1, not the 0 that Order.mapInput(Order.Number, ...) gives.
      expect(order("nanA", "nanB")).toBe(-1);
      expect(order("nanA", "nanA")).toBe(-1);

      // Equal infinite ranks give -1, not the 0 that Order.mapInput(Order.Number, ...) gives.
      expect(order("pos", "pos")).toBe(-1);
      expect(order("neg", "neg")).toBe(-1);

      // Unequal infinite and finite ranks give the ordinary sign.
      expect(order("pos", "finite")).toBe(1);
      expect(order("finite", "pos")).toBe(-1);
      expect(order("neg", "finite")).toBe(-1);
      expect(order("pos", "neg")).toBe(1);
    });
  });
});
