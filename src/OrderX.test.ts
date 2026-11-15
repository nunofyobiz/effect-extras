import { describe, expect, expectTypeOf, test, vi } from "@effect/vitest";
import { Array, Data, Equal, Order } from "effect";
import { byPriority, rankedEnum } from "./OrderX.js";

describe("Order utils", () => {
  describe("byPriority", () => {
    test("empty priority makes every value tie", () => {
      const order = byPriority([], (value: string) => value);

      expect(order("apple", "banana")).toBe(0);
      expect(order("banana", "apple")).toBe(0);
      expect(order("apple", "apple")).toBe(0);
      expect(Array.sort(["banana", "apple"], order)).toStrictEqual([
        "banana",
        "apple",
      ]);
    });

    test("single listed key precedes unlisted keys, which tie", () => {
      const order = byPriority(["urgent"], (value: string) => value);

      expect(order("urgent", "routine")).toBe(-1);
      expect(order("routine", "urgent")).toBe(1);
      expect(order("urgent", "urgent")).toBe(0);
      expect(order("routine", "later")).toBe(0);
      expect(order("later", "routine")).toBe(0);
    });

    test("listed keys sort by position with normalized comparisons", () => {
      const order = byPriority(["z", "m", "a"], (value: string) => value);

      expect(order("z", "a")).toBe(-1);
      expect(order("a", "z")).toBe(1);
      expect(order("m", "a")).toBe(-1);
      expect(order("m", "z")).toBe(1);
      expect(order("a", "a")).toBe(0);
      expect(order("a", "unlisted")).toBe(-1);
      expect(order("unlisted", "a")).toBe(1);
      expect(Array.sort(["a", "m", "z"], order)).toStrictEqual(["z", "m", "a"]);
    });

    test("duplicate keys keep their first position", () => {
      const order = byPriority(
        ["first", "second", "first"],
        (value: string) => value,
      );

      expect(order("first", "second")).toBe(-1);
      expect(Array.sort(["second", "first"], order)).toStrictEqual([
        "first",
        "second",
      ]);
    });

    test("projects keys and composes a fallback for shared and unlisted keys", () => {
      const urgentZ = { name: "Z", urgency: "urgent" };
      const urgentA = { name: "A", urgency: "urgent" };
      const routineB = { name: "B", urgency: "routine" };
      const laterC = { name: "C", urgency: "later" };
      const order = byPriority(
        ["urgent"],
        (task: { name: string; urgency: string }) => task.urgency,
      );

      expect(order(urgentZ, urgentA)).toBe(0);
      expect(order(routineB, laterC)).toBe(0);
      expect(
        Array.sort([routineB, urgentZ, laterC, urgentA], order),
      ).toStrictEqual([urgentZ, urgentA, routineB, laterC]);
      const withFallback = Order.combine(
        order,
        Order.mapInput(Order.String, (task) => task.name),
      );
      expect(withFallback(urgentZ, routineB)).toBe(-1);
      expect(withFallback(urgentZ, urgentA)).toBe(1);
      expect(withFallback(laterC, routineB)).toBe(1);
      expect(
        Array.sort([laterC, urgentZ, routineB, urgentA], withFallback),
      ).toStrictEqual([urgentA, urgentZ, routineB, laterC]);
    });

    test("consumes a one-shot iterator only during construction", () => {
      const visit = vi.fn<(key: string) => void>();
      const iterate = vi.fn(function* () {
        visit("first");
        yield "first";
        visit("last");
        yield "last";
      });
      const iterator = iterate();
      const priority = { [Symbol.iterator]: vi.fn(() => iterator) };
      const keyOf = vi.fn((value: string) => value);
      const order = byPriority(priority, keyOf);

      expect(priority[Symbol.iterator]).toHaveBeenCalledTimes(1);
      expect(iterate).toHaveBeenCalledTimes(1);
      expect(visit.mock.calls).toStrictEqual([["first"], ["last"]]);
      expect(keyOf).not.toHaveBeenCalled();
      expect(order("first", "last")).toBe(-1);
      expect(order("last", "first")).toBe(1);
      expect(order("first", "first")).toBe(0);
      expect(keyOf.mock.calls).toStrictEqual([
        ["first"],
        ["last"],
        ["last"],
        ["first"],
        ["first"],
        ["first"],
      ]);
      expect(Array.sort(["last", "missing", "first"], order)).toStrictEqual([
        "first",
        "last",
        "missing",
      ]);
      expect(Array.sort(["last", "first"], order)).toStrictEqual([
        "first",
        "last",
      ]);
      expect(priority[Symbol.iterator]).toHaveBeenCalledTimes(1);
      expect(visit).toHaveBeenCalledTimes(2);
    });

    test("snapshots priority and leaves the sorting input unchanged", () => {
      const priority = ["first", "last"];
      const order = byPriority(priority, (value: string) => value);

      expect(order("first", "last")).toBe(-1);
      // Construction leaves the original priority array unchanged.
      expect(priority).toStrictEqual(["first", "last"]);
      priority.reverse();
      priority.push("missing");
      const input = ["missing", "last", "first"];

      expect(Array.sort(input, order)).toStrictEqual([
        "first",
        "last",
        "missing",
      ]);
      // Sorting leaves the original input array unchanged.
      expect(input).toStrictEqual(["missing", "last", "first"]);
      expect(order("missing", "other")).toBe(0);
    });

    test("uses SameValueZero for NaN and signed zero", () => {
      const order = byPriority(
        [Number.NaN, -0, 1, 0],
        (value: number) => value,
      );

      expect(order(Number.NaN, Number.NaN)).toBe(0);
      expect(order(Number.NaN, 0)).toBe(-1);
      expect(order(0, -0)).toBe(0);
      expect(order(0, 1)).toBe(-1);
      expect(order(2, Number.NaN)).toBe(1);
    });

    test("matches nullish keys and symbols by native Map rules", () => {
      const listed = Symbol("priority");
      const separate = Symbol("priority");
      const order = byPriority(
        [undefined, null, listed],
        (value: undefined | null | symbol) => value,
      );

      expect(order(undefined, null)).toBe(-1);
      expect(order(null, listed)).toBe(-1);
      expect(order(listed, separate)).toBe(-1);
      expect(order(listed, listed)).toBe(0);
      expect(order(separate, Symbol("other"))).toBe(0);
    });

    test("uses object identity rather than structural or Effect equality", () => {
      const listed = { key: "first" };
      const separate = { key: "first" };
      class Key extends Data.Class<{ key: string }> {}
      const effectListed = new Key({ key: "second" });
      const effectSeparate = new Key({ key: "second" });
      const order = byPriority(
        [listed, effectListed],
        (value: { key: string }) => value,
      );

      expect(Equal.equals(effectListed, effectSeparate)).toBe(true);
      expect(order(listed, listed)).toBe(0);
      expect(order(listed, effectListed)).toBe(-1);
      expect(order(listed, separate)).toBe(-1);
      expect(order(effectListed, effectSeparate)).toBe(-1);
      expect(order(separate, effectSeparate)).toBe(0);
    });

    test("infers the value order and rejects incompatible projected keys", () => {
      const order = byPriority([1, 2], (value: { id: number }) => value.id);

      expectTypeOf(order).toEqualTypeOf<Order.Order<{ id: number }>>();
      expect(order({ id: 1 }, { id: 2 })).toBe(-1);
      // @ts-expect-error - string projection is incompatible with numeric priority keys.
      const incompatible = byPriority([1, 2], (value: string) => value);
      expect(incompatible("first", "last")).toBe(0);
      // @ts-expect-error - an out-of-domain key from untyped code is treated as unlisted.
      const outside = byPriority<string, "urgent">(["urgent"], () => "routine");
      expect(outside("first", "last")).toBe(0);
    });
  });

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
