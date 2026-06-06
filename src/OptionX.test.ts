import { Option, pipe } from "effect";
import { describe, expect, test, vi } from "vitest";
import {
  fromNullableOption,
  ifSome,
  inspectSome,
  mapSomeOrNull,
} from "./OptionX.js";

describe("Option utils", () => {
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
});
