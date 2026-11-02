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
    test("data-first and data-last agree", () => {
      const dataFirst = pipe("report.csv", (value) =>
        prepend(value, "backup-"),
      );
      const dataLast = pipe("report.csv", prepend("backup-"));
      expect(dataFirst).toBe("backup-report.csv");
      expect(dataFirst).toBe(dataLast);
    });

    test("preserves empty and whitespace-only inputs and prefixes", () => {
      expect(prepend("", "")).toBe("");
      expect(prepend("", "start")).toBe("start");
      expect(prepend("  ", "\t")).toBe("\t  ");
    });
  });

  describe("surround", () => {
    test("data-first and data-last agree", () => {
      const dataFirst = pipe("Paris, France", (value) =>
        surround(value, '"', '"'),
      );
      const dataLast = pipe("Paris, France", surround('"', '"'));
      expect(dataFirst).toBe('"Paris, France"');
      expect(dataFirst).toBe(dataLast);
    });

    test("preserves empty and whitespace-only inputs and boundaries", () => {
      expect(surround("", "", "")).toBe("");
      expect(surround("", "[", "]")).toBe("[]");
      expect(surround("  ", "\t", " ")).toBe("\t   ");
      expect(surround("value", "", "")).toBe("value");
    });
  });

  describe("ensurePrepend", () => {
    test.each(["settings/profile", "/settings/profile"])(
      "data-first and data-last agree for %s",
      (path) => {
        const dataFirst = pipe(path, (value) => ensurePrepend(value, "/"));
        const dataLast = pipe(path, ensurePrepend("/"));
        expect(dataFirst).toBe("/settings/profile");
        expect(dataFirst).toBe(dataLast);
      },
    );

    test("an empty string with an empty prefix stays empty", () => {
      expect(ensurePrepend("", "")).toBe("");
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

    test("data-first and data-last agree", () => {
      const dataFirst = pipe("a\nb\nc", (value) =>
        replaceLineRange(value, 1, 1, ["X", "Y"]),
      );
      const dataLast = pipe("a\nb\nc", replaceLineRange(1, 1, ["X", "Y"]));
      expect(dataFirst).toBe("a\nX\nY\nc");
      expect(dataFirst).toBe(dataLast);
    });

    test.each([
      { start: -2, end: 1, expected: "X\nc" },
      { start: -0.5, end: 1, expected: "X\nc" },
      { start: 1.5, end: 1, expected: "a\nX\nc" },
      { start: Number.NaN, end: 1, expected: "X\nc" },
      { start: Infinity, end: 1, expected: "a\nb\nc\nX\nc" },
      { start: -Infinity, end: 1, expected: "X\nc" },
      { start: 1, end: -2, expected: "a\nX\na\nb\nc" },
      { start: 1, end: -0.5, expected: "a\nX\na\nb\nc" },
      { start: 1, end: 0.5, expected: "a\nX\nb\nc" },
      { start: 1, end: 1.5, expected: "a\nX\nc" },
      { start: 1, end: Number.NaN, expected: "a\nX\na\nb\nc" },
      { start: 1, end: Infinity, expected: "a\nX" },
      { start: 1, end: -Infinity, expected: "a\nX\na\nb\nc" },
      { start: Number.NaN, end: Number.NaN, expected: "X\na\nb\nc" },
    ])("handles start=$start and end=$end", ({ start, end, expected }) => {
      expect(replaceLineRange("a\nb\nc", start, end, ["X"])).toBe(expected);
    });

    test("preserves the current repeated lines for an inverted range", () => {
      // Pin current behavior pending a separate decision about inverted ranges.
      expect(replaceLineRange("a\nb\nc", 2, 0, ["X"])).toBe("a\nb\nX\nb\nc");
    });

    test("rejects a null replacement list at runtime", () => {
      expect(() =>
        // @ts-expect-error - null is not a replacement line array
        replaceLineRange("a\nb\nc", 1, 1, null),
      ).toThrow(TypeError);
    });

    test("preserves empty lines and naturally clamps out-of-range indices", () => {
      expect(replaceLineRange("", 0, 0, ["X"])).toBe("X");
      expect(replaceLineRange("\n", 0, 0, ["X"])).toBe("X\n");
      expect(replaceLineRange("a\n", 1, 1, ["X"])).toBe("a\nX");
      expect(replaceLineRange("a\nb", 1, 1, ["X"])).toBe("a\nX");
      expect(replaceLineRange("a\nb", 2, 2, ["X"])).toBe("a\nb\nX");
      expect(replaceLineRange("a\nb", 5, 5, ["X"])).toBe("a\nb\nX");
      expect(replaceLineRange("  \n\t", 0, 0, ["X"])).toBe("X\n\t");
    });
  });

  describe("insertBeforeLine", () => {
    test("data-first and data-last agree, preserving the anchor line", () => {
      const dataFirst = pipe("a\nb\nc", (value) =>
        insertBeforeLine(value, 1, ["X"]),
      );
      const dataLast = pipe("a\nb\nc", insertBeforeLine(1, ["X"]));
      expect(dataFirst).toBe("a\nX\nb\nc");
      expect(dataFirst).toBe(dataLast);
    });

    test("appends when the anchor is at or past the end", () => {
      expect(insertBeforeLine("a\nb", 2, ["X"])).toBe("a\nb\nX");
      expect(insertBeforeLine("a\nb", 5, ["X"])).toBe("a\nb\nX");
    });

    test.each([
      { anchor: -2, expected: "X\na\nb\nc" },
      { anchor: -0.5, expected: "X\na\nb\nc" },
      { anchor: 1.5, expected: "a\nX\nb\nc" },
      { anchor: Number.NaN, expected: "X\na\nb\nc" },
      { anchor: Infinity, expected: "a\nb\nc\nX" },
      { anchor: -Infinity, expected: "X\na\nb\nc" },
    ])("handles anchor=$anchor", ({ anchor, expected }) => {
      expect(insertBeforeLine("a\nb\nc", anchor, ["X"])).toBe(expected);
    });

    test.each([0, 1, 3])(
      "an empty insertion at %i leaves content unchanged",
      (anchor) => {
        expect(insertBeforeLine("a\nb\nc", anchor, [])).toBe("a\nb\nc");
      },
    );

    test("rejects a null insertion list at runtime", () => {
      expect(() =>
        // @ts-expect-error - null is not an insertion line array
        insertBeforeLine("a\nb\nc", 1, null),
      ).toThrow(TypeError);
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
      expect(insertBeforeLine("  \n\t", 1, ["X"])).toBe("  \nX\n\t");
    });
  });
});
