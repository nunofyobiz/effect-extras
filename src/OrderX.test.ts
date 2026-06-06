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
  });
});
