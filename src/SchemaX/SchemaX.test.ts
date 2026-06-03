import { Effect, Result, Schema } from "effect";
import { describe, expect, test } from "vitest";
import { it } from "@effect/vitest";
import {
  TrimmedNonEmptyString,
  omit,
  partial,
  pick,
  pickPartial,
} from "./SchemaX";

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
    test.todo("this works to encode+dedde safely");
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
      expect(Object.keys(Partial.fields).sort()).toStrictEqual(["a", "b", "c"]);
    });

    test("empty struct → empty partial", () => {
      const Empty = Schema.Struct({});
      const Partial = partial(Empty);
      expect(Object.keys(Partial.fields)).toStrictEqual([]);
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
