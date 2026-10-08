import { pipe } from "effect";
import { describe, expect, test } from "vitest";
import {
  ensurePrepend,
  insertBeforeLine,
  prepend,
  replaceLineRange,
  surround,
} from "./StringX.js";

describe("String utils", () => {
  describe("prepend", () => {
    test("works", () => {
      expect(pipe("pray", prepend("eat"))).toBe("eatpray");
    });

    test("data-first form", () => {
      expect(prepend("pray", "eat")).toBe("eatpray");
    });

    test("preserves empty and whitespace-only inputs and prefixes", () => {
      expect(prepend("", "")).toBe("");
      expect(prepend("", "start")).toBe("start");
      expect(prepend("  ", "\t")).toBe("\t  ");
    });
  });

  describe("surround", () => {
    test("works", () => {
      expect(pipe("pray", surround("eat", "love"))).toBe("eatpraylove");
    });

    test("data-first form", () => {
      expect(surround("pray", "eat", "love")).toBe("eatpraylove");
    });

    test("preserves empty and whitespace-only inputs and boundaries", () => {
      expect(surround("", "", "")).toBe("");
      expect(surround("", "[", "]")).toBe("[]");
      expect(surround("  ", "\t", " ")).toBe("\t   ");
      expect(surround("value", "", "")).toBe("value");
    });
  });

  describe("ensurePrepend", () => {
    test("does not already start with", () => {
      expect(pipe("pray", ensurePrepend("eat"))).toBe("eatpray");
    });

    test("already starts with", () => {
      expect(pipe("eatpray", ensurePrepend("eat"))).toBe("eatpray");
    });

    test("data-first form", () => {
      expect(ensurePrepend("pray", "eat")).toBe("eatpray");
      expect(ensurePrepend("eatpray", "eat")).toBe("eatpray");
    });

    test("handles empty, whitespace-only, and non-leading prefixes", () => {
      expect(ensurePrepend("value", "")).toBe("value");
      expect(ensurePrepend("", "start")).toBe("start");
      expect(ensurePrepend("  ", "\t")).toBe("\t  ");
      expect(ensurePrepend("\tvalue", "\t")).toBe("\tvalue");
      expect(ensurePrepend("start", "start")).toBe("start");
      expect(ensurePrepend("value-start", "start")).toBe("startvalue-start");
    });
  });

  describe("replaceLineRange", () => {
    test("replaces an inclusive line range", () => {
      expect(replaceLineRange("a\nb\nc\nd", 1, 2, ["X"])).toBe("a\nX\nd");
    });

    test("deletes the range when replacement is empty", () => {
      expect(replaceLineRange("a\nb\nc\nd", 1, 2, [])).toBe("a\nd");
    });

    test("can replace a single line with several", () => {
      expect(replaceLineRange("a\nb\nc", 1, 1, ["X", "Y"])).toBe("a\nX\nY\nc");
    });

    test("replaces the first and last lines (boundaries)", () => {
      expect(replaceLineRange("a\nb\nc", 0, 0, ["X"])).toBe("X\nb\nc");
      expect(replaceLineRange("a\nb\nc", 2, 2, ["Z"])).toBe("a\nb\nZ");
    });

    test("data-last (piped) form", () => {
      expect(pipe("a\nb\nc", replaceLineRange(1, 1, ["X", "Y"]))).toBe(
        "a\nX\nY\nc",
      );
    });

    test("preserves empty lines and naturally clamps out-of-range indices", () => {
      expect(replaceLineRange("", 0, 0, ["X"])).toBe("X");
      expect(replaceLineRange("\n", 0, 0, ["X"])).toBe("X\n");
      expect(replaceLineRange("a\n", 1, 1, ["X"])).toBe("a\nX");
      expect(replaceLineRange("a\nb", 1, 1, ["X"])).toBe("a\nX");
      expect(replaceLineRange("a\nb", 2, 2, ["X"])).toBe("a\nb\nX");
    });
  });

  describe("insertBeforeLine", () => {
    test("inserts before the anchor, preserving the anchor line", () => {
      expect(insertBeforeLine("a\nb\nc", 1, ["X"])).toBe("a\nX\nb\nc");
    });

    test("appends when the anchor is at or past the end", () => {
      expect(insertBeforeLine("a\nb", 2, ["X"])).toBe("a\nb\nX");
    });

    test("prepends when the anchor is 0 (data-last)", () => {
      expect(pipe("a\nb", insertBeforeLine(0, ["X"]))).toBe("X\na\nb");
    });

    test("inserts multiple lines", () => {
      expect(insertBeforeLine("a\nb", 1, ["X", "Y"])).toBe("a\nX\nY\nb");
    });

    test("preserves empty lines and naturally clamps out-of-range indices", () => {
      expect(insertBeforeLine("", 0, ["X"])).toBe("X\n");
      expect(insertBeforeLine("\n", 1, ["X"])).toBe("\nX\n");
      expect(insertBeforeLine("a\n", 1, ["X"])).toBe("a\nX\n");
      expect(insertBeforeLine("a\nb", 1, ["X"])).toBe("a\nX\nb");
      expect(insertBeforeLine("a\nb", 2, ["X"])).toBe("a\nb\nX");
    });
  });
});
