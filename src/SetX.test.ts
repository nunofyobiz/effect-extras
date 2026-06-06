import { pipe } from "effect";
import { describe, expect, test, vi } from "vitest";
import { add, remove, safelyMutate, toggle } from "./SetX.js";

describe("Set utils", () => {
  describe("safelyMutate", () => {
    test("mutations do not mutate the original set", () => {
      const inputSet = new Set<string>(["a", "b"]);

      const mutate = vi.fn<(set: Set<string>) => Set<string>>((set) => {
        set.delete("a");
        return set.add("c");
      });

      const outputSet = safelyMutate(inputSet, mutate);

      // Output set is modified
      expect(outputSet).toStrictEqual(new Set<string>(["b", "c"]));

      // Input set is not affected
      expect(inputSet).toStrictEqual(new Set<string>(["a", "b"]));
      expect(mutate).not.toHaveBeenCalledWith(inputSet);
    });

    test("data-last (piped)", () => {
      const inputSet = new Set<string>(["a", "b"]);

      const outputSet = pipe(
        inputSet,
        safelyMutate((set) => {
          set.delete("a");
          return set.add("c");
        }),
      );

      expect(outputSet).toStrictEqual(new Set<string>(["b", "c"]));
      expect(inputSet).toStrictEqual(new Set<string>(["a", "b"]));
    });
  });

  describe("add", () => {
    test("adding a new element", () => {
      const set = new Set<string>(["a", "b"]);

      expect(add(set, "c")).toStrictEqual(new Set<string>(["a", "b", "c"]));
    });

    test("adding an existing element", () => {
      const set = new Set<string>(["a", "b", "c"]);

      expect(add(set, "c")).toStrictEqual(new Set<string>(["a", "b", "c"]));
    });

    test("adding an existing element returns the same reference (no copy)", () => {
      const set = new Set<string>(["a", "b", "c"]);

      expect(add(set, "c")).toBe(set);
    });

    test("data-last (piped)", () => {
      expect(pipe(new Set<string>(["a", "b"]), add("c"))).toStrictEqual(
        new Set<string>(["a", "b", "c"]),
      );
    });
  });

  describe("remove", () => {
    test("deleting a non-existent element", () => {
      const set = new Set<string>(["a", "b"]);

      expect(remove(set, "c")).toStrictEqual(new Set<string>(["a", "b"]));
    });

    test("deleting an existing element", () => {
      const set = new Set<string>(["a", "b", "c"]);

      expect(remove(set, "c")).toStrictEqual(new Set<string>(["a", "b"]));
    });

    test("deleting a non-existent element returns the same reference (no copy)", () => {
      const set = new Set<string>(["a", "b"]);

      expect(remove(set, "c")).toBe(set);
    });

    test("data-last (piped)", () => {
      expect(pipe(new Set<string>(["a", "b", "c"]), remove("c"))).toStrictEqual(
        new Set<string>(["a", "b"]),
      );
    });
  });

  describe("toggle", () => {
    test("adding element", () => {
      const set = new Set<string>(["a", "b"]);

      expect(toggle(set, "c")).toStrictEqual(new Set<string>(["a", "b", "c"]));
    });

    test("removing element", () => {
      const set = new Set<string>(["a", "b", "c"]);

      expect(toggle(set, "b")).toStrictEqual(new Set<string>(["a", "c"]));
    });

    test("data-last (piped) adds absent element", () => {
      expect(pipe(new Set<string>(["a", "b"]), toggle("c"))).toStrictEqual(
        new Set<string>(["a", "b", "c"]),
      );
    });

    test("data-last (piped) removes present element", () => {
      expect(pipe(new Set<string>(["a", "b", "c"]), toggle("b"))).toStrictEqual(
        new Set<string>(["a", "c"]),
      );
    });
  });
});
