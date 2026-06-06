import { Option, pipe } from "effect";
import { describe, expect, test, vi } from "vitest";
import {
  fromNullableOption,
  ifSome,
  inspectSome,
  mapSomeOrNull,
  mapSomeOrUndefined,
  tupleOf,
} from "./OptionX.js";

describe("Option utils", () => {
  describe("tupleOf", () => {
    test("both Some → Some([a, b])", () => {
      expect(tupleOf(Option.some(1), Option.some("a"))).toStrictEqual(
        Option.some([1, "a"]),
      );
    });

    test("first None → None", () => {
      expect(tupleOf(Option.none<number>(), Option.some("a"))).toStrictEqual(
        Option.none(),
      );
    });

    test("second None → None", () => {
      expect(tupleOf(Option.some(1), Option.none<string>())).toStrictEqual(
        Option.none(),
      );
    });

    test("both None → None", () => {
      expect(
        tupleOf(Option.none<number>(), Option.none<string>()),
      ).toStrictEqual(Option.none());
    });

    test("data-last (piped) keeps the piped value first", () => {
      expect(pipe(Option.some(1), tupleOf(Option.some("a")))).toStrictEqual(
        Option.some([1, "a"]),
      );
    });

    test("data-last (piped) short-circuits on None", () => {
      expect(
        pipe(Option.none<number>(), tupleOf(Option.some("a"))),
      ).toStrictEqual(Option.none());
    });
  });

  describe("ifSome", () => {
    test("some", () => {
      const mockIfSome = vi.fn<() => void>();

      const result = ifSome(Option.some("value"), mockIfSome);

      expect(result).toBe(undefined);
      expect(mockIfSome).toHaveBeenCalledTimes(1);
      expect(mockIfSome).toHaveBeenNthCalledWith(1, "value");
    });

    test("none", () => {
      const mockIfSome = vi.fn<() => void>();

      const result = ifSome(Option.none(), mockIfSome);

      expect(result).toBe(undefined);
      expect(mockIfSome).not.toHaveBeenCalled();
    });

    test("data-last (piped)", () => {
      const mockIfSome = vi.fn<() => void>();

      const result = pipe(Option.some("value"), ifSome(mockIfSome));

      expect(result).toBe(undefined);
      expect(mockIfSome).toHaveBeenCalledTimes(1);
      expect(mockIfSome).toHaveBeenNthCalledWith(1, "value");
    });

    test("some with function that tries to return a value", () => {
      const mockIfSome = vi
        .fn<() => string>()
        .mockReturnValue("some return value");

      const result = ifSome(Option.some("value"), mockIfSome);

      expect(result).toBe(undefined);
      expect(mockIfSome).toHaveBeenCalledTimes(1);
      expect(mockIfSome).toHaveBeenNthCalledWith(1, "value");
    });
  });

  describe("inspectSome", () => {
    test("some", () => {
      const mockInspectSome = vi.fn<() => void>();

      const result = inspectSome(Option.some("value"), mockInspectSome);

      expect(result).toStrictEqual(Option.some("value"));
    });

    test("none", () => {
      const mockInspectSome = vi.fn<() => void>();

      const result = inspectSome(Option.none(), mockInspectSome);

      expect(result).toStrictEqual(Option.none());
      expect(mockInspectSome).not.toHaveBeenCalled();
    });

    test("some with function that tries to return a value", () => {
      const mockInspectSome = vi
        .fn<() => string>()
        .mockReturnValue("some return value");

      const result = inspectSome(Option.some("value"), mockInspectSome);

      expect(result).toStrictEqual(Option.some("value"));
    });

    test("data-last (piped) taps without breaking the chain", () => {
      const log: number[] = [];

      const result = pipe(
        Option.some(1),
        inspectSome((value) => log.push(value)),
        Option.map((value) => value + 1),
      );

      expect(result).toStrictEqual(Option.some(2));
      expect(log).toStrictEqual([1]);
    });
  });

  describe("fromNullableOption", () => {
    test("some", () => {
      expect(fromNullableOption(Option.some(1))).toStrictEqual(Option.some(1));
    });

    test("null", () => {
      expect(fromNullableOption(null)).toStrictEqual(Option.none());
    });

    test("undefined", () => {
      expect(fromNullableOption(undefined)).toStrictEqual(Option.none());
    });
  });

  describe("mapSomeOrNull", () => {
    test("some", () => {
      expect(
        pipe(
          Option.some(1),
          mapSomeOrNull((v) => v + 1),
        ),
      ).toBe(2);
    });

    test("none", () => {
      expect(
        pipe(
          Option.none(),
          mapSomeOrNull((v) => v + 1),
        ),
      ).toBeNull();
    });

    test("works data-first or data-last", () => {
      // Data-first
      expect(mapSomeOrNull(Option.some(1), (v) => v + 1)).toBe(2);

      // Data-last
      expect(
        pipe(
          Option.some(1),
          mapSomeOrNull((v) => v + 1),
        ),
      ).toBe(2);
    });
  });

  describe("mapSomeOrUndefined", () => {
    test("some → mapped value", () => {
      expect(mapSomeOrUndefined(Option.some(1), (v) => v + 1)).toBe(2);
    });

    test("none → undefined", () => {
      expect(
        mapSomeOrUndefined(Option.none<number>(), (v) => v + 1),
      ).toBeUndefined();
    });

    test("works data-first or data-last", () => {
      // Data-first
      expect(mapSomeOrUndefined(Option.some(1), (v) => v + 1)).toBe(2);

      // Data-last
      expect(
        pipe(
          Option.some(1),
          mapSomeOrUndefined((v) => v + 1),
        ),
      ).toBe(2);
    });
  });
});
