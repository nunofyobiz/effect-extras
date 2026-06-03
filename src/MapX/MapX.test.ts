import { describe, expect, test } from "vitest";
import { getOrElseSetGet } from "./MapX";

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
  });
});
