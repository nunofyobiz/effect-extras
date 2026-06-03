import { describe, expect, test } from "vitest";
import { toBinary } from "./BooleanX";

describe("Boolean utils", () => {
  describe("toBinary", () => {
    test("true", () => {
      expect(toBinary(true)).toBe(1);
    });

    test("false", () => {
      expect(toBinary(false)).toBe(0);
    });
  });
});
