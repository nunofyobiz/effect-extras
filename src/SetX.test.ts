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
      // The original reference retains its members after the piped update.
      expect(inputSet).toStrictEqual(new Set<string>(["a", "b"]));
    });

    test.each([
      { members: [], expected: ["c"] },
      { members: ["a"], expected: ["c"] },
      { members: ["a", "b"], expected: ["b", "c"] },
    ])(
      "both forms mutate a fresh copy of $members exactly once",
      ({ members, expected }) => {
        const input = new Set<string>(members);
        const mutation = (copy: Set<string>) => {
          expect(copy).toStrictEqual(input);
          expect(copy).not.toBe(input);
          copy.delete("a");
          return copy.add("c");
        };
        const direct = vi.fn(mutation);
        const piped = vi.fn(mutation);
        const dataFirst = safelyMutate(input, direct);
        const dataLast = pipe(input, safelyMutate(piped));
        expect([...dataFirst]).toStrictEqual(expected);
        expect([...dataLast]).toStrictEqual(expected);
        expect(dataLast).toStrictEqual(dataFirst);
        expect(direct).toHaveBeenCalledTimes(1);
        expect(piped).toHaveBeenCalledTimes(1);
        expect(dataFirst).toBe(direct.mock.calls[0]?.[0]);
        expect(dataLast).toBe(piped.mock.calls[0]?.[0]);
        expect(dataFirst).not.toBe(input);
        expect(dataLast).not.toBe(input);
        // Mutations affect only the callback copies, not the original reference.
        expect([...input]).toStrictEqual(members);
      },
    );

    test.each([{ members: [] }, { members: [{ id: "a" }] }])(
      "both forms return a fresh shallow copy of $members for a no-op callback",
      ({ members }) => {
        const input = new Set(members);
        const mutation = (copy: Set<{ id: string }>) => {
          expect(copy).toStrictEqual(input);
          expect(copy).not.toBe(input);
          return copy;
        };
        const direct = vi.fn(mutation);
        const piped = vi.fn(mutation);
        const dataFirst = safelyMutate(input, direct);
        const dataLast = pipe(input, safelyMutate(piped));
        expect(dataFirst).toStrictEqual(new Set(members));
        expect(dataLast).toStrictEqual(new Set(members));
        expect(dataLast).toStrictEqual(dataFirst);
        expect(dataFirst).not.toBe(input);
        expect(dataLast).not.toBe(input);
        expect([...dataFirst][0]).toBe(members[0]);
        expect([...dataLast][0]).toBe(members[0]);
        expect(direct).toHaveBeenCalledTimes(1);
        expect(piped).toHaveBeenCalledTimes(1);
        expect(dataFirst).toBe(direct.mock.calls[0]?.[0]);
        expect(dataLast).toBe(piped.mock.calls[0]?.[0]);
        // Only the container is copied; the original retains the same member object.
        expect([...input]).toStrictEqual(members);
        expect([...input][0]).toBe(members[0]);
      },
    );

    test.each([{ members: [] }, { members: ["a"] }])(
      "both forms return the callback's separate set for $members",
      ({ members }) => {
        const input = new Set<string>(members);
        const returned = new Set(["c"]);
        const mutation = (copy: Set<string>) => {
          expect(copy).toStrictEqual(input);
          expect(copy).not.toBe(input);
          copy.clear();
          return returned;
        };
        const direct = vi.fn(mutation);
        const piped = vi.fn(mutation);
        const dataFirst = safelyMutate(input, direct);
        const dataLast = pipe(input, safelyMutate(piped));
        expect(dataFirst).toStrictEqual(new Set(["c"]));
        expect(dataLast).toStrictEqual(new Set(["c"]));
        expect(dataFirst).toBe(returned);
        expect(dataLast).toBe(dataFirst);
        expect(direct).toHaveBeenCalledTimes(1);
        expect(piped).toHaveBeenCalledTimes(1);
        expect(direct.mock.calls[0]?.[0]).not.toBe(input);
        expect(piped.mock.calls[0]?.[0]).not.toBe(input);
        expect(dataFirst).not.toBe(direct.mock.calls[0]?.[0]);
        expect(dataLast).not.toBe(piped.mock.calls[0]?.[0]);
        // Even clearing the callback copies leaves the original reference intact.
        expect([...input]).toStrictEqual(members);
      },
    );

    test("both forms copy null as an empty set through the native constructor", () => {
      const returned = new Set(["a"]);
      const mutation = (copy: Set<string>) => {
        expect(copy).toStrictEqual(new Set());
        return returned;
      };
      const direct = vi.fn(mutation);
      const piped = vi.fn(mutation);
      // @ts-expect-error - null is not a Set, but the native Set constructor accepts it
      const dataFirst = safelyMutate(null, direct);
      // @ts-expect-error - the piped signature also rejects null even though Set accepts it
      const dataLast = pipe(null, safelyMutate(piped));
      expect(dataFirst).toStrictEqual(new Set(["a"]));
      expect(dataLast).toStrictEqual(new Set(["a"]));
      expect(dataFirst).toBe(returned);
      expect(dataLast).toBe(dataFirst);
      expect(direct).toHaveBeenCalledTimes(1);
      expect(piped).toHaveBeenCalledTimes(1);
      expect(direct.mock.calls[0]?.[0]).toBeInstanceOf(Set);
      expect(piped.mock.calls[0]?.[0]).toBeInstanceOf(Set);
      expect(direct.mock.calls[0]?.[0]).not.toBe(piped.mock.calls[0]?.[0]);
    });
  });

  describe("add", () => {
    test.each([
      { members: [], expected: ["c"] },
      { members: ["a"], expected: ["a", "c"] },
      { members: ["a", "b"], expected: ["a", "b", "c"] },
    ])("both forms add to $members in a fresh set", ({ members, expected }) => {
      const input = new Set<string>(members);
      const dataFirst = add(input, "c");
      const dataLast = pipe(input, add("c"));
      expect([...dataFirst]).toStrictEqual(expected);
      expect([...dataLast]).toStrictEqual(expected);
      expect(dataLast).toStrictEqual(dataFirst);
      expect(dataFirst).not.toBe(input);
      expect(dataLast).not.toBe(input);
      // The original reference retains its members and their order.
      expect([...input]).toStrictEqual(members);
    });

    test.each([{ members: ["a"] }, { members: ["a", "b"] }])(
      "both forms reuse $members when adding an existing member",
      ({ members }) => {
        const input = new Set(members);
        const dataFirst = add(input, "a");
        const dataLast = pipe(input, add("a"));
        expect([...dataFirst]).toStrictEqual(members);
        expect([...dataLast]).toStrictEqual(members);
        expect(dataFirst).toBe(input);
        expect(dataLast).toBe(dataFirst);
        // Repeated selection leaves the original reference and order unchanged.
        expect([...input]).toStrictEqual(members);
      },
    );

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
    test.each([
      { members: ["a"], expected: [] },
      { members: ["a", "b", "c"], expected: ["b", "c"] },
    ])(
      "both forms remove from $members in a fresh set",
      ({ members, expected }) => {
        const input = new Set(members);
        const dataFirst = remove(input, "a");
        const dataLast = pipe(input, remove("a"));
        expect([...dataFirst]).toStrictEqual(expected);
        expect([...dataLast]).toStrictEqual(expected);
        expect(dataLast).toStrictEqual(dataFirst);
        expect(dataFirst).not.toBe(input);
        expect(dataLast).not.toBe(input);
        // The original reference still includes the removed member in its original order.
        expect([...input]).toStrictEqual(members);
      },
    );

    test.each([{ members: [] }, { members: ["a"] }, { members: ["a", "b"] }])(
      "both forms reuse $members when removing an absent member",
      ({ members }) => {
        const input = new Set<string>(members);
        const dataFirst = remove(input, "c");
        const dataLast = pipe(input, remove("c"));
        expect([...dataFirst]).toStrictEqual(members);
        expect([...dataLast]).toStrictEqual(members);
        expect(dataFirst).toBe(input);
        expect(dataLast).toBe(dataFirst);
        // Removing an absent value leaves the original reference and order unchanged.
        expect([...input]).toStrictEqual(members);
      },
    );

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
    test.each([
      { members: [], expected: ["a"] },
      { members: ["a"], expected: [] },
      { members: ["b"], expected: ["b", "a"] },
      { members: ["b", "c"], expected: ["b", "c", "a"] },
      { members: ["b", "a", "c"], expected: ["b", "c"] },
    ])(
      "both forms toggle in $members in a fresh set",
      ({ members, expected }) => {
        const input = new Set<string>(members);
        const dataFirst = toggle(input, "a");
        const dataLast = pipe(input, toggle("a"));
        expect([...dataFirst]).toStrictEqual(expected);
        expect([...dataLast]).toStrictEqual(expected);
        expect(dataLast).toStrictEqual(dataFirst);
        expect(dataFirst).not.toBe(input);
        expect(dataLast).not.toBe(input);
        // Toggling preserves the original reference and its iteration order.
        expect([...input]).toStrictEqual(members);
      },
    );

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

  describe.each([
    { name: "add", update: add, retains: true, inserts: true },
    { name: "remove", update: remove, retains: false, inserts: false },
    { name: "toggle", update: toggle, retains: false, inserts: true },
  ])("$name native membership", ({ update, retains, inserts }) => {
    test.each([
      { member: Number.NaN, value: Number.NaN },
      { member: 0, value: -0 },
      { member: -0, value: 0 },
    ])("both forms match $member with $value", ({ member, value }) => {
      const input = new Set([member]);
      const expected = retains ? new Set([member]) : new Set<number>();
      const dataFirst = update(input, value);
      const dataLast = pipe(input, update(value));
      expect(dataFirst).toStrictEqual(expected);
      expect(dataLast).toStrictEqual(expected);
      expect(dataLast).toStrictEqual(dataFirst);
      expect(dataFirst.size).toBe(retains ? 1 : 0);
      expect(dataLast.size).toBe(retains ? 1 : 0);
      expect(dataFirst.has(value)).toBe(retains);
      expect(dataLast.has(value)).toBe(retains);
      expect(dataFirst === input).toBe(retains);
      expect(dataLast === input).toBe(retains);
      // Native equality does not change the original member or singleton size.
      expect(input).toStrictEqual(new Set([member]));
      expect(input.size).toBe(1);
      expect(input.has(value)).toBe(true);
    });

    test.each([Number.NaN, -0])("both forms handle absent %s", (value) => {
      const input = new Set<number>();
      const expected = inserts ? new Set([value]) : new Set<number>();
      const dataFirst = update(input, value);
      const dataLast = pipe(input, update(value));
      expect(dataFirst).toStrictEqual(expected);
      expect(dataLast).toStrictEqual(expected);
      expect(dataLast).toStrictEqual(dataFirst);
      expect(dataFirst.size).toBe(inserts ? 1 : 0);
      expect(dataLast.size).toBe(inserts ? 1 : 0);
      expect(dataFirst.has(value)).toBe(inserts);
      expect(dataLast.has(value)).toBe(inserts);
      expect(dataFirst === input).toBe(!inserts);
      expect(dataLast === input).toBe(!inserts);
      // The original reference remains empty after the membership update.
      expect(input.size).toBe(0);
    });

    test("both forms distinguish equal-looking objects from the same reference", () => {
      const member = { id: "a" };
      const other = { id: "a" };
      const input = new Set([member]);
      const expected = inserts ? [member, other] : [member];
      const dataFirst = update(input, other);
      const dataLast = pipe(input, update(other));
      expect([...dataFirst]).toStrictEqual(expected);
      expect([...dataLast]).toStrictEqual(expected);
      expect(dataLast).toStrictEqual(dataFirst);
      expect(dataFirst.size).toBe(expected.length);
      expect(dataLast.size).toBe(expected.length);
      expect([...dataFirst][0]).toBe(member);
      expect([...dataLast][0]).toBe(member);
      expect(dataFirst.has(other)).toBe(inserts);
      expect(dataLast.has(other)).toBe(inserts);
      expect(dataFirst === input).toBe(!inserts);
      expect(dataLast === input).toBe(!inserts);

      const sameFirst = update(input, member);
      const sameLast = pipe(input, update(member));
      const sameExpected = retains ? [member] : [];
      expect([...sameFirst]).toStrictEqual(sameExpected);
      expect([...sameLast]).toStrictEqual(sameExpected);
      expect(sameLast).toStrictEqual(sameFirst);
      expect(sameFirst.has(member)).toBe(retains);
      expect(sameLast.has(member)).toBe(retains);
      expect(sameFirst === input).toBe(retains);
      expect(sameLast === input).toBe(retains);
      // Neither update replaces or mutates the original member object.
      expect([...input]).toStrictEqual([member]);
      expect([...input][0]).toBe(member);
      expect(input.has(other)).toBe(false);
    });

    test("both forms reject null with TypeError", () => {
      expect(() => {
        // @ts-expect-error - null is not a Set and has no native membership method
        update(null, "a");
      }).toThrow(TypeError);
      expect(() => {
        // @ts-expect-error - the piped signature also rejects null as the input Set
        pipe(null, update("a"));
      }).toThrow(TypeError);
    });
  });

  test("removed then readded members appear last in both forms", () => {
    const input = new Set(["a", "b", "c"]);
    const dataFirst = add(remove(input, "b"), "b");
    const dataLast = pipe(input, remove("b"), add("b"));
    expect([...dataFirst]).toStrictEqual(["a", "c", "b"]);
    expect([...dataLast]).toStrictEqual(["a", "c", "b"]);
    expect(dataLast).toStrictEqual(dataFirst);
    expect(dataFirst).not.toBe(input);
    expect(dataLast).not.toBe(input);
    // The original reference keeps its initial insertion order.
    expect([...input]).toStrictEqual(["a", "b", "c"]);
  });
});
