import { pipe } from "effect";
import { describe, expect, test } from "vitest";
import { getOrElseSetGet } from "./MapX.js";

describe("Map utils", () => {
  describe("getOrElseSetGet", () => {
    test("when value exists already, it returns the existing value", () => {
      const map = new Map<string, string>([["a", "1"]]);

      expect(getOrElseSetGet(map, "a", () => "2")).toBe("1");

      // And now the value should be untouched
      expect(map.get("a")).toBe("1");
    });

    test("when value does not exist, it sets the value and returns the fallback value", () => {
      const map = new Map<string, string>();

      expect(getOrElseSetGet(map, "b", () => "2")).toBe("2");

      // And now the value should be set
      expect(map.get("b")).toBe("2");
    });

    test("data-last (piped)", () => {
      const map = new Map<string, string>();

      // Miss: stores and returns the fallback
      expect(
        pipe(
          map,
          getOrElseSetGet("b", () => "2"),
        ),
      ).toBe("2");
      expect(map.get("b")).toBe("2");

      // Hit: returns the existing value, fallback ignored
      expect(
        pipe(
          map,
          getOrElseSetGet("b", () => "99"),
        ),
      ).toBe("2");
    });

    test("throws when the stored value is nullish", () => {
      const map = new Map<string, string | null>([["a", null]]);

      expect(() => getOrElseSetGet(map, "a", () => "fallback")).toThrow(
        "Value is nullable: a",
      );
    });
  });
});
