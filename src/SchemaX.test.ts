import { Effect, Result, Schema } from "effect";
import { describe, expect, expectTypeOf, test } from "vitest";
import { it } from "@effect/vitest";
import {
  IntFromString,
  TrimmedNonEmptyString,
  URLSafeFilePath,
  clamp,
  nonNegativeBigInt,
  omit,
  partial,
  pick,
  pickPartial,
} from "./SchemaX.js";

describe("Schema utils", () => {
  describe("TrimmedNonEmptyString", () => {
    it.effect("decoding non-whitespace string", () =>
      Effect.gen(function* () {
        const result = yield* Schema.decodeEffect(TrimmedNonEmptyString)("foo");

        expect(result).toBe("foo");
      }),
    );

    it.effect("encoding non-whitespace string", () =>
      Effect.gen(function* () {
        const result = yield* Schema.encodeEffect(TrimmedNonEmptyString)("foo");

        expect(result).toBe("foo");
      }),
    );

    it.effect("decoding whitespace string", () =>
      Effect.gen(function* () {
        const result = yield* Schema.decodeEffect(TrimmedNonEmptyString)(
          "    foo\n  ",
        );

        expect(result).toBe("foo");
      }),
    );

    it.effect("encoding whitespace string", () =>
      Effect.gen(function* () {
        const result = yield* Schema.encodeEffect(TrimmedNonEmptyString)(
          "    foo\n  ",
        );

        expect(result).toBe("foo");
      }),
    );

    it.effect("decoding whitespace-only string", () =>
      Effect.gen(function* () {
        const result = yield* Effect.result(
          Schema.decodeEffect(TrimmedNonEmptyString)("    \n  "),
        );

        expect(Result.isFailure(result)).toBe(true);
      }),
    );

    it.effect("encoding whitespace-only string", () =>
      Effect.gen(function* () {
        const result = yield* Effect.result(
          Schema.encodeEffect(TrimmedNonEmptyString)("    \n  "),
        );

        expect(Result.isFailure(result)).toBe(true);
      }),
    );

    it.effect("decoding empty string", () =>
      Effect.gen(function* () {
        const result = yield* Effect.result(
          Schema.decodeEffect(TrimmedNonEmptyString)(""),
        );

        expect(Result.isFailure(result)).toBe(true);
      }),
    );

    it.effect("encoding empty string", () =>
      Effect.gen(function* () {
        const result = yield* Effect.result(
          Schema.encodeEffect(TrimmedNonEmptyString)(""),
        );

        expect(Result.isFailure(result)).toBe(true);
      }),
    );
  });

  describe("URLSafeFilePath", () => {
    it.effect("decoding expands percent-escapes", () =>
      Effect.gen(function* () {
        const result = yield* Schema.decodeEffect(URLSafeFilePath)("a%2Fb.txt");
        expect(result).toBe("a/b.txt");
      }),
    );

    it.effect("encoding produces the URL-safe form", () =>
      Effect.gen(function* () {
        const result = yield* Schema.encodeEffect(URLSafeFilePath)("a/b.txt");
        expect(result).toBe("a%2Fb.txt");
      }),
    );

    it.effect("decode then encode round-trips", () =>
      Effect.gen(function* () {
        const decoded = yield* Schema.decodeEffect(URLSafeFilePath)(
          "dir%2Ffile%20name.txt",
        );
        expect(decoded).toBe("dir/file name.txt");

        const reEncoded = yield* Schema.encodeEffect(URLSafeFilePath)(decoded);
        expect(reEncoded).toBe("dir%2Ffile%20name.txt");
      }),
    );

    it.effect("encodes special characters", () =>
      Effect.gen(function* () {
        const result = yield* Schema.encodeEffect(URLSafeFilePath)("a&b#c?d");
        expect(result).toBe(encodeURIComponent("a&b#c?d"));
      }),
    );

    it.effect("trims surrounding whitespace before decoding", () =>
      Effect.gen(function* () {
        const result =
          yield* Schema.decodeEffect(URLSafeFilePath)("  a%2Fb.txt  ");
        expect(result).toBe("a/b.txt");
      }),
    );

    it.effect("whitespace-only input fails the non-empty refinement", () =>
      Effect.gen(function* () {
        const result = yield* Effect.result(
          Schema.decodeEffect(URLSafeFilePath)("    "),
        );
        expect(Result.isFailure(result)).toBe(true);
      }),
    );

    it.effect("empty input fails the non-empty refinement", () =>
      Effect.gen(function* () {
        const result = yield* Effect.result(
          Schema.decodeEffect(URLSafeFilePath)(""),
        );
        expect(Result.isFailure(result)).toBe(true);
      }),
    );
  });

  describe("IntFromString", () => {
    it.effect("decodes a safe integer string to a number", () =>
      Effect.gen(function* () {
        const result = yield* Schema.decodeEffect(IntFromString)("42");
        expect(result).toBe(42);
      }),
    );

    it.effect("encodes a number back to a decimal string", () =>
      Effect.gen(function* () {
        const result = yield* Schema.encodeEffect(IntFromString)(42);
        expect(result).toBe("42");
      }),
    );

    // The safe-integer guard is bidirectional (it's a `Schema.check`), so encode
    // rejects an unsafe `number` too — not just decode. Pins that direction so a
    // regression that made the codec decode-only would be caught.
    it.effect("fails to encode an unsafe integer", () =>
      Effect.gen(function* () {
        const result = yield* Effect.result(
          Schema.encodeEffect(IntFromString)(Number.MAX_SAFE_INTEGER + 1),
        );
        expect(Result.isFailure(result)).toBe(true);
      }),
    );

    it.effect("fails to encode a fractional number", () =>
      Effect.gen(function* () {
        const result = yield* Effect.result(
          Schema.encodeEffect(IntFromString)(3.14),
        );
        expect(Result.isFailure(result)).toBe(true);
      }),
    );

    it.effect("round-trips a safe integer", () =>
      Effect.gen(function* () {
        const decoded = yield* Schema.decodeEffect(IntFromString)("-100");
        expect(decoded).toBe(-100);
        const encoded = yield* Schema.encodeEffect(IntFromString)(decoded);
        expect(encoded).toBe("-100");
      }),
    );

    it.effect("decodes negative safe integers", () =>
      Effect.gen(function* () {
        const result =
          yield* Schema.decodeEffect(IntFromString)("-9007199254740991");
        expect(result).toBe(-Number.MAX_SAFE_INTEGER);
      }),
    );

    it.effect("decodes Number.MAX_SAFE_INTEGER at the boundary", () =>
      Effect.gen(function* () {
        const result = yield* Schema.decodeEffect(IntFromString)(
          String(Number.MAX_SAFE_INTEGER),
        );
        expect(result).toBe(Number.MAX_SAFE_INTEGER);
      }),
    );

    it.effect(
      "fails on MAX_SAFE_INTEGER + 1 rather than silently rounding",
      () =>
        Effect.gen(function* () {
          const result = yield* Effect.result(
            // "9007199254740992" === String(Number.MAX_SAFE_INTEGER + 1)
            Schema.decodeEffect(IntFromString)("9007199254740992"),
          );
          expect(Result.isFailure(result)).toBe(true);
        }),
    );

    it.effect("fails loudly on int8 overflow (would silently round)", () =>
      Effect.gen(function* () {
        // Number("9223372036854775807") === 9223372036854776000 (rounded)
        const result = yield* Effect.result(
          Schema.decodeEffect(IntFromString)("9223372036854775807"),
        );
        expect(Result.isFailure(result)).toBe(true);
      }),
    );

    it.effect("rejects fractional strings", () =>
      Effect.gen(function* () {
        const result = yield* Effect.result(
          Schema.decodeEffect(IntFromString)("3.14"),
        );
        expect(Result.isFailure(result)).toBe(true);
      }),
    );

    it.effect("rejects non-numeric strings", () =>
      Effect.gen(function* () {
        const result = yield* Effect.result(
          Schema.decodeEffect(IntFromString)("abc"),
        );
        expect(Result.isFailure(result)).toBe(true);
      }),
    );

    test("the failure message names the overflow contract", () => {
      expect(() =>
        Schema.decodeUnknownSync(IntFromString)("9223372036854775807"),
      ).toThrow(/safe integer/u);
    });

    // Inherited from NumberFromString's lenient Number(...) coercion — pinned so
    // the behavior is part of the spec, not an accident. The guard catches
    // unsafe-integer overflow, not non-canonical numeric strings; callers needing
    // strict input compose an upstream check (see the JSDoc caveat).
    it.effect('decodes an empty string to 0 (Number("") === 0)', () =>
      Effect.gen(function* () {
        const result = yield* Schema.decodeEffect(IntFromString)("");
        expect(result).toBe(0);
      }),
    );

    it.effect("decodes a whitespace-only string to 0", () =>
      Effect.gen(function* () {
        const result = yield* Schema.decodeEffect(IntFromString)("   ");
        expect(result).toBe(0);
      }),
    );

    it.effect("decodes exponential notation to its safe-integer value", () =>
      Effect.gen(function* () {
        const result = yield* Schema.decodeEffect(IntFromString)("1e3");
        expect(result).toBe(1000);
      }),
    );

    it.effect("decodes hex notation to its safe-integer value", () =>
      Effect.gen(function* () {
        const result = yield* Schema.decodeEffect(IntFromString)("0x10");
        expect(result).toBe(16);
      }),
    );
  });

  describe("nonNegativeBigInt", () => {
    const NonNegative = nonNegativeBigInt(Schema.BigInt);

    it.effect("clamps negative values up to 0n on decode", () =>
      Effect.gen(function* () {
        const result = yield* Schema.decodeEffect(NonNegative)(-5n);
        expect(result).toBe(0n);
      }),
    );

    it.effect("clamps negative values up to 0n on encode", () =>
      Effect.gen(function* () {
        const result = yield* Schema.encodeEffect(NonNegative)(-5n);
        expect(result).toBe(0n);
      }),
    );

    it.effect("passes zero through unchanged", () =>
      Effect.gen(function* () {
        const result = yield* Schema.decodeEffect(NonNegative)(0n);
        expect(result).toBe(0n);
      }),
    );

    it.effect("passes positive values through unchanged", () =>
      Effect.gen(function* () {
        const result = yield* Schema.decodeEffect(NonNegative)(7n);
        expect(result).toBe(7n);
      }),
    );

    it.effect("handles large bigints", () =>
      Effect.gen(function* () {
        const big = BigInt(Number.MAX_SAFE_INTEGER) * 1000n;
        const result = yield* Schema.decodeEffect(NonNegative)(big);
        expect(result).toBe(big);
      }),
    );
  });

  describe("clamp", () => {
    it.effect("clamps lower-only ranges on decode and encode", () =>
      Effect.gen(function* () {
        const NonNegative = clamp({ min: 0 })(Schema.Number);

        expect(yield* Schema.decodeEffect(NonNegative)(-5)).toBe(0);
        expect(yield* Schema.decodeEffect(NonNegative)(7)).toBe(7);
        expect(yield* Schema.encodeEffect(NonNegative)(-5)).toBe(0);
        expect(yield* Schema.encodeEffect(NonNegative)(0)).toBe(0);
      }),
    );

    it.effect("clamps upper-only ranges on decode and encode", () =>
      Effect.gen(function* () {
        const AtMostTen = clamp({ max: 10 })(Schema.Number);

        expect(yield* Schema.decodeEffect(AtMostTen)(15)).toBe(10);
        expect(yield* Schema.decodeEffect(AtMostTen)(7)).toBe(7);
        expect(yield* Schema.encodeEffect(AtMostTen)(15)).toBe(10);
        expect(yield* Schema.encodeEffect(AtMostTen)(10)).toBe(10);
      }),
    );

    it.effect("clamps two-sided ranges on decode and encode", () =>
      Effect.gen(function* () {
        const Percent = clamp({ min: 0, max: 100 })(Schema.Number);

        expect(yield* Schema.decodeEffect(Percent)(-5)).toBe(0);
        expect(yield* Schema.decodeEffect(Percent)(125)).toBe(100);
        expect(yield* Schema.decodeEffect(Percent)(50)).toBe(50);
        expect(yield* Schema.encodeEffect(Percent)(-5)).toBe(0);
        expect(yield* Schema.encodeEffect(Percent)(125)).toBe(100);
      }),
    );

    it.effect("leaves values unchanged without bounds", () =>
      Effect.gen(function* () {
        const Identity = clamp({})(Schema.Number);

        expect(yield* Schema.decodeEffect(Identity)(-5)).toBe(-5);
        expect(yield* Schema.encodeEffect(Identity)(5)).toBe(5);
      }),
    );

    it.effect("pins values when bounds are equal", () =>
      Effect.gen(function* () {
        const Pinned = clamp({ min: 5, max: 5 })(Schema.Number);

        expect(yield* Schema.decodeEffect(Pinned)(0)).toBe(5);
        expect(yield* Schema.encodeEffect(Pinned)(10)).toBe(5);
      }),
    );

    test("rejects a reversed range synchronously", () => {
      expect(() => clamp({ min: 10, max: 0 })).toThrow(
        /min to be less than or equal to max/u,
      );
    });

    it.effect(
      "preserves an IntFromString schema's encoded representation",
      () =>
        Effect.gen(function* () {
          const NonNegativeIntFromString = clamp({ min: 0 })(IntFromString);

          expect(
            yield* Schema.decodeEffect(NonNegativeIntFromString)("-5"),
          ).toBe(0);
          expect(yield* Schema.encodeEffect(NonNegativeIntFromString)(-5)).toBe(
            "0",
          );
        }),
    );
  });

  describe("pick", () => {
    const Source = Schema.Struct({
      a: Schema.String,
      b: Schema.Number,
      c: Schema.Boolean,
    });

    it.effect("picks a single field", () =>
      Effect.gen(function* () {
        const Picked = pick(Source, "a");
        const result = yield* Schema.decodeEffect(Picked)({
          a: "hello",
        });
        expect(result).toStrictEqual({ a: "hello" });
      }),
    );

    it.effect("picks multiple fields", () =>
      Effect.gen(function* () {
        const Picked = pick(Source, "a", "b");
        const result = yield* Schema.decodeEffect(Picked)({
          a: "hello",
          b: 42,
        });
        expect(result).toStrictEqual({ a: "hello", b: 42 });
      }),
    );

    it.effect("picks all fields", () =>
      Effect.gen(function* () {
        const Picked = pick(Source, "a", "b", "c");
        const result = yield* Schema.decodeEffect(Picked)({
          a: "hello",
          b: 42,
          c: true,
        });
        expect(result).toStrictEqual({ a: "hello", b: 42, c: true });
      }),
    );

    it.effect("picks no fields into an empty struct", () =>
      Effect.gen(function* () {
        const Picked = pick(Source);
        expect(yield* Schema.decodeEffect(Picked)({})).toStrictEqual({});
      }),
    );

    it.effect("drops unpicked fields from the decoded type", () =>
      Effect.gen(function* () {
        const Picked = pick(Source, "a");
        // Pass extra fields — the picked schema only knows about `a`,
        // so `b` and `c` are dropped by the decoder.
        const result = yield* Schema.decodeUnknownEffect(Picked)({
          a: "hello",
          b: 42,
          c: true,
        });
        expect(result).toStrictEqual({ a: "hello" });
        expect("b" in result).toBe(false);
        expect("c" in result).toBe(false);
      }),
    );

    it.effect("preserves field schema (including refinements)", () =>
      Effect.gen(function* () {
        const RefinedSource = Schema.Struct({
          name: Schema.NonEmptyString,
          count: Schema.Number,
        });
        const Picked = pick(RefinedSource, "name");

        // Empty name should fail the NonEmptyString refinement
        const result = yield* Schema.decodeUnknownEffect(Picked)({
          name: "",
        }).pipe(Effect.result);

        expect(Result.isFailure(result)).toBe(true);
      }),
    );

    test("type narrows correctly on the picked schema", () => {
      const Picked = pick(Source, "a", "b");
      expectTypeOf(Picked).toEqualTypeOf<
        Schema.Struct<{
          readonly a: typeof Schema.String;
          readonly b: typeof Schema.Number;
        }>
      >();
      // Compile-time assertion: Picked should be Schema.Struct<{a, b}>
      // Runtime assertion via .fields:
      expect(Object.keys(Picked.fields).sort()).toStrictEqual(["a", "b"]);
    });
  });

  describe("omit", () => {
    const Source = Schema.Struct({
      a: Schema.String,
      b: Schema.Number,
      c: Schema.Boolean,
    });

    it.effect("omits a single field", () =>
      Effect.gen(function* () {
        const Omitted = omit(Source, "c");
        const result = yield* Schema.decodeEffect(Omitted)({
          a: "hello",
          b: 42,
        });
        expect(result).toStrictEqual({ a: "hello", b: 42 });
      }),
    );

    it.effect("omits multiple fields", () =>
      Effect.gen(function* () {
        const Omitted = omit(Source, "b", "c");
        const result = yield* Schema.decodeEffect(Omitted)({
          a: "hello",
        });
        expect(result).toStrictEqual({ a: "hello" });
      }),
    );

    it.effect("omits no fields", () =>
      Effect.gen(function* () {
        const Omitted = omit(Source);
        expect(
          yield* Schema.decodeEffect(Omitted)({ a: "hello", b: 42, c: true }),
        ).toStrictEqual({ a: "hello", b: 42, c: true });
      }),
    );

    it.effect("drops omitted fields from the decoded type", () =>
      Effect.gen(function* () {
        const Omitted = omit(Source, "c");
        // Pass extra omitted field — should be stripped from the decoded value.
        const result = yield* Schema.decodeUnknownEffect(Omitted)({
          a: "hello",
          b: 42,
          c: true,
        });
        expect(result).toStrictEqual({ a: "hello", b: 42 });
        expect("c" in result).toBe(false);
      }),
    );

    it.effect("preserves field schema (including refinements)", () =>
      Effect.gen(function* () {
        const RefinedSource = Schema.Struct({
          name: Schema.NonEmptyString,
          count: Schema.Number,
        });
        const Omitted = omit(RefinedSource, "count");

        // Empty name should fail the NonEmptyString refinement
        const result = yield* Schema.decodeUnknownEffect(Omitted)({
          name: "",
        }).pipe(Effect.result);

        expect(Result.isFailure(result)).toBe(true);
      }),
    );

    test("type narrows correctly on the omitted schema", () => {
      const Omitted = omit(Source, "c");
      expectTypeOf(Omitted).toEqualTypeOf<
        Schema.Struct<{
          readonly a: typeof Schema.String;
          readonly b: typeof Schema.Number;
        }>
      >();
      expect(Object.keys(Omitted.fields).sort()).toStrictEqual(["a", "b"]);
    });

    test("pick and omit are inverses", () => {
      const Picked = pick(Source, "a", "b");
      const Omitted = omit(Source, "c");
      expect(Object.keys(Picked.fields).sort()).toStrictEqual(
        Object.keys(Omitted.fields).sort(),
      );
    });
  });

  describe("partial", () => {
    const Source = Schema.Struct({
      a: Schema.String,
      b: Schema.Number,
      c: Schema.Boolean,
    });

    it.effect("allows all fields to be absent during decoding", () =>
      Effect.gen(function* () {
        const Partial = partial(Source);
        const result = yield* Schema.decodeEffect(Partial)({});
        expect(result).toStrictEqual({});
      }),
    );

    it.effect("allows subset of fields to be present", () =>
      Effect.gen(function* () {
        const Partial = partial(Source);
        const result = yield* Schema.decodeEffect(Partial)({ a: "hello" });
        expect(result).toStrictEqual({ a: "hello" });
      }),
    );

    it.effect("allows all fields to be present", () =>
      Effect.gen(function* () {
        const Partial = partial(Source);
        const result = yield* Schema.decodeEffect(Partial)({
          a: "hello",
          b: 42,
          c: true,
        });
        expect(result).toStrictEqual({ a: "hello", b: 42, c: true });
      }),
    );

    it.effect("accepts explicit undefined and existing optional fields", () =>
      Effect.gen(function* () {
        const OptionalSource = Schema.Struct({
          optional: Schema.optional(Schema.String),
          optionalKey: Schema.optionalKey(Schema.Number),
        });
        const Partial = partial(OptionalSource);
        expect(
          yield* Schema.decodeEffect(Partial)({ optional: undefined }),
        ).toStrictEqual({
          optional: undefined,
        });
        expect(yield* Schema.decodeEffect(Partial)({})).toStrictEqual({});
      }),
    );

    it.effect("preserves field schema (including refinements)", () =>
      Effect.gen(function* () {
        const RefinedSource = Schema.Struct({
          name: Schema.NonEmptyString,
        });
        const Partial = partial(RefinedSource);

        // Field omitted → ok
        const ok = yield* Schema.decodeUnknownEffect(Partial)({});
        expect(ok).toStrictEqual({});

        // Field present but invalid → fails the refinement
        const bad = yield* Schema.decodeUnknownEffect(Partial)({
          name: "",
        }).pipe(Effect.result);
        expect(Result.isFailure(bad)).toBe(true);
      }),
    );

    test("type-level: all keys are present in fields", () => {
      const Partial = partial(Source);
      expectTypeOf(Partial).toEqualTypeOf<
        Schema.Struct<{
          readonly a: Schema.optional<typeof Schema.String>;
          readonly b: Schema.optional<typeof Schema.Number>;
          readonly c: Schema.optional<typeof Schema.Boolean>;
        }>
      >();
      expect(Object.keys(Partial.fields).sort()).toStrictEqual(["a", "b", "c"]);
    });

    test("empty struct → empty partial", () => {
      const Empty = Schema.Struct({});
      const Partial = partial(Empty);
      expect(Object.keys(Partial.fields)).toStrictEqual([]);
    });

    test("keeps symbol-keyed fields through pick, omit and partial", () => {
      const key = Symbol("field");
      const WithSymbol = Schema.Struct({
        text: Schema.String,
        [key]: Schema.Number,
      });

      expect(Reflect.ownKeys(pick(WithSymbol, "text").fields)).toStrictEqual([
        "text",
      ]);
      expect(Reflect.ownKeys(omit(WithSymbol).fields)).toStrictEqual([
        "text",
        key,
      ]);
      expect(Reflect.ownKeys(partial(WithSymbol).fields)).toStrictEqual([
        "text",
        key,
      ]);
    });

    it.effect("makes a symbol-keyed field optional", () => {
      const key = Symbol("field");
      const WithSymbol = Schema.Struct({
        text: Schema.String,
        [key]: Schema.Number,
      });
      const Partial = partial(WithSymbol);

      return Effect.gen(function* () {
        const decoded = yield* Schema.decodeEffect(Partial)({ text: "hi" });
        expect(decoded).toStrictEqual({ text: "hi" });

        const withSymbol = yield* Schema.decodeEffect(Partial)({
          text: "hi",
          [key]: 1,
        });
        expect(withSymbol).toStrictEqual({ text: "hi", [key]: 1 });
      });
    });
  });

  describe("pickPartial", () => {
    const Source = Schema.Struct({
      a: Schema.String,
      b: Schema.Number,
      c: Schema.Boolean,
    });

    it.effect("allows the picked subset to be partial", () =>
      Effect.gen(function* () {
        const Picked = pickPartial(Source, "a", "b");
        // Both picked fields absent → ok
        const empty = yield* Schema.decodeEffect(Picked)({});
        expect(empty).toStrictEqual({});

        // One picked field present → ok
        const partialSubset = yield* Schema.decodeEffect(Picked)({ a: "hi" });
        expect(partialSubset).toStrictEqual({ a: "hi" });

        // Both picked fields present → ok
        const allSubset = yield* Schema.decodeEffect(Picked)({
          a: "hi",
          b: 7,
        });
        expect(allSubset).toStrictEqual({ a: "hi", b: 7 });
      }),
    );

    it.effect("rejects fields that weren't picked", () =>
      Effect.gen(function* () {
        const Picked = pickPartial(Source, "a", "b");
        // `c` was not picked — passing it should be ignored or rejected
        // (Schema.Struct's default mode is to ignore unknown keys, so this
        // verifies the shape contains only picked fields, not the broader
        // unknown-key policy.)
        const decoded = yield* Schema.decodeUnknownEffect(Picked)({
          a: "hi",
          b: 7,
          c: true, // Ignored
        });
        expect(decoded).toStrictEqual({ a: "hi", b: 7 });
      }),
    );

    test("type-level: only the picked keys are present in fields", () => {
      const Picked = pickPartial(Source, "a", "c");
      expectTypeOf(Picked).toEqualTypeOf<
        Schema.Struct<{
          a: Schema.optional<typeof Schema.String>;
          c: Schema.optional<typeof Schema.Boolean>;
        }>
      >();
      expect(Object.keys(Picked.fields).sort()).toStrictEqual(["a", "c"]);
    });

    test("zero keys → empty struct", () => {
      const Picked = pickPartial(Source);
      expect(Object.keys(Picked.fields)).toStrictEqual([]);
    });

    test("identical to partial(pick(...))", () => {
      const ViaCombo = partial(pick(Source, "a", "b"));
      const ViaHelper = pickPartial(Source, "a", "b");
      expect(Object.keys(ViaHelper.fields).sort()).toStrictEqual(
        Object.keys(ViaCombo.fields).sort(),
      );
    });
  });
});
