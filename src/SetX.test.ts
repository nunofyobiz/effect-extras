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
  });
});
