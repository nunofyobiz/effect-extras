import { Array } from "effect";
import { describe, expect, test } from "vitest";
import { rankedEnum } from "./OrderX";

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
  });
});
