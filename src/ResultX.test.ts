import { Option, Result } from "effect";
import { describe, expect, test } from "@effect/vitest";
import { fromOption } from "./ResultX.js";

describe("Result utils", () => {
  describe("fromOption", () => {
    test("some(value) → Result.succeed(value)", () => {
      expect(fromOption(Option.some(42))).toStrictEqual(Result.succeed(42));
    });

    test("none → Result.failVoid", () => {
      expect(fromOption(Option.none())).toStrictEqual(Result.failVoid);
    });

    test("some(0) → Result.succeed(0) (falsy values preserved)", () => {
      expect(fromOption(Option.some(0))).toStrictEqual(Result.succeed(0));
    });

    test("some(empty string) → Result.succeed('')", () => {
      expect(fromOption(Option.some(""))).toStrictEqual(Result.succeed(""));
    });

    test("some(false) → Result.succeed(false)", () => {
      expect(fromOption(Option.some(false))).toStrictEqual(
        Result.succeed(false),
      );
    });

    test("some(null) → Result.succeed(null) (None ≠ null)", () => {
      expect(fromOption(Option.some<string | null>(null))).toStrictEqual(
        Result.succeed(null),
      );
    });

    test("some(undefined) succeeds while none fails with undefined", () => {
      const present = fromOption(Option.some(undefined));
      const absent = fromOption(Option.none());

      expect(Result.isSuccess(present)).toBe(true);
      expect(present).toStrictEqual(Result.succeed(undefined));
      expect(Result.isFailure(absent)).toBe(true);
      expect(absent).toStrictEqual(Result.failVoid);
    });

    test("bare null throws synchronously", () => {
      expect(() => {
        // @ts-expect-error - bare null is not an Option container
        fromOption(null);
      }).toThrow(TypeError);
    });

    test("bare undefined throws synchronously", () => {
      expect(() => {
        // @ts-expect-error - bare undefined is not an Option container
        fromOption(undefined);
      }).toThrow(TypeError);
    });

    test("some(object) → preserves reference identity", () => {
      const value = { id: 1 };
      const result = fromOption(Option.some(value));
      // Use Option.getOrThrowWith for the type-narrowed access without a
      // conditional expect (linted against).
      const successValue = Result.getSuccess(result).pipe(
        Option.getOrThrowWith(() => new Error("expected Success")),
      );
      expect(successValue).toBe(value);
    });

    test("some → not isFailure", () => {
      expect(Result.isFailure(fromOption(Option.some(1)))).toBe(false);
    });

    test("none → not isSuccess", () => {
      expect(Result.isSuccess(fromOption(Option.none()))).toBe(false);
    });

    test("none → fails with undefined", () => {
      const result = fromOption(Option.none());

      expect(Result.isFailure(result)).toBe(true);
      expect(
        Result.getFailure(result).pipe(
          Option.getOrThrowWith(() => new Error("expected Failure")),
        ),
      ).toBe(undefined);
    });
  });
});
