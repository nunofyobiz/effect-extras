import { describe, expect, test } from "vitest";
import { BigInt as EffectBigInt, pipe } from "effect";
import { toNumberOrThrow } from "./BigIntX.js";

describe("BigInt utils", () => {
  describe("toNumberOrThrow", () => {
    test("bigint within safe integer range", () => {
      expect(toNumberOrThrow(0n)).toBe(0);
      expect(toNumberOrThrow(1n)).toBe(1);
      expect(toNumberOrThrow(10_000_000_000_000n)).toBe(10_000_000_000_000);
    });

    test("negative bigint within safe integer range", () => {
      expect(toNumberOrThrow(-1n)).toBe(-1);
      expect(toNumberOrThrow(BigInt(Number.MIN_SAFE_INTEGER))).toBe(
        Number.MIN_SAFE_INTEGER,
      );
    });

    test("exactly MAX_SAFE_INTEGER", () => {
      expect(toNumberOrThrow(BigInt(Number.MAX_SAFE_INTEGER))).toBe(
        Number.MAX_SAFE_INTEGER,
      );
    });

    test("bigint outside safe integer range", () => {
      expect(() =>
        pipe(
          EffectBigInt.sum(BigInt(Number.MAX_SAFE_INTEGER), 1n),
          toNumberOrThrow,
        ),
      ).toThrow("Value 9007199254740992 is outside safe integer range");
    });
  });
});
