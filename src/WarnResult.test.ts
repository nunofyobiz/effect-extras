import { Array, Effect, Option, Result, pipe } from "effect";
import { describe, expect, test, vi } from "vitest";
import { it } from "@effect/vitest";
import {
  SuccessOnly,
  SuccessWithWarnings,
  WarningsOnly,
  WithSuccess,
  WithWarnings,
  flatMapSuccess,
  flatMapSuccessEffect,
  flatMapWarnings,
  flatMapWarningsEffect,
  fromNullables,
  is,
  mapBoth,
  mapBothEffect,
  mapSuccess,
  mapSuccessEffect,
  mapWarnings,
  mapWarningsEffect,
  match,
  matchSuccess,
  matchWarnings,
  optionFromNullables,
  orElse,
  orUndefined,
  successOption,
  successOrElse,
  successOrUndefined,
  warningsOption,
  warningsOrElse,
  warningsOrUndefined,
  zip,
} from "./WarnResult.js";
import type { WarnResult } from "./WarnResult.js";

describe("WarnResult", () => {
  describe("WarningsOnly", () => {
    test("constructs a WarningsOnly", () => {
      expect(WarningsOnly({ warnings: "skipped 2 rows" })).toStrictEqual({
        _tag: "WarningsOnly",
        warnings: "skipped 2 rows",
      });
    });
  });

  describe("SuccessOnly", () => {
    test("constructs a SuccessOnly", () => {
      expect(SuccessOnly({ success: 1 })).toStrictEqual({
        _tag: "SuccessOnly",
        success: 1,
      });
    });
  });

  describe("SuccessWithWarnings", () => {
    test("constructs a SuccessWithWarnings", () => {
      expect(
        SuccessWithWarnings({ warnings: "rounded down", success: 1 }),
      ).toStrictEqual({
        _tag: "SuccessWithWarnings",
        warnings: "rounded down",
        success: 1,
      });
    });
  });

  describe("is", () => {
    test("matches the given tag", () => {
      expect(is("WarningsOnly")(WarningsOnly({ warnings: "w" }))).toBe(true);
      expect(is("SuccessOnly")(SuccessOnly({ success: 1 }))).toBe(true);
      expect(
        is("SuccessWithWarnings")(
          SuccessWithWarnings({ warnings: "w", success: 1 }),
        ),
      ).toBe(true);
    });

    test("rejects a different tag", () => {
      expect(is("WarningsOnly")(SuccessOnly({ success: 1 }))).toBe(false);
      expect(is("SuccessOnly")(WarningsOnly({ warnings: "w" }))).toBe(false);
      expect(is("SuccessWithWarnings")(WarningsOnly({ warnings: "w" }))).toBe(
        false,
      );
    });

    test("narrows the type when true", () => {
      const value: WarnResult<number, string> = SuccessWithWarnings({
        warnings: "w",
        success: 1,
      });

      // `is` narrows `value` so `.warnings`/`.success` are accessible without a
      // cast inside the truthy branch of the ternary.
      const narrowed = is("SuccessWithWarnings")(value) ? value : null;

      expect(narrowed).not.toBeNull();
      expect(narrowed?.warnings).toBe("w");
      expect(narrowed?.success).toBe(1);
    });
  });

  describe("match", () => {
    const describeIt = (warnResult: WarnResult<number, string>) =>
      match(warnResult, {
        WarningsOnly: ({ warnings }) => `warnings ${warnings}`,
        SuccessOnly: ({ success }) => `success ${success}`,
        SuccessWithWarnings: ({ warnings, success }) =>
          `both ${warnings}/${success}`,
      });

    test("warningsOnly", () => {
      expect(describeIt(WarningsOnly({ warnings: "w" }))).toBe("warnings w");
    });

    test("successOnly", () => {
      expect(describeIt(SuccessOnly({ success: 1 }))).toBe("success 1");
    });

    test("successWithWarnings", () => {
      expect(
        describeIt(SuccessWithWarnings({ warnings: "w", success: 1 })),
      ).toBe("both w/1");
    });
  });

  describe("WithWarnings", () => {
    test("present success → SuccessWithWarnings", () => {
      expect(WithWarnings({ warnings: "w", success: 1 })).toStrictEqual(
        SuccessWithWarnings({ warnings: "w", success: 1 }),
      );
    });

    test("omitted success → WarningsOnly", () => {
      expect(WithWarnings({ warnings: "w" })).toStrictEqual(
        WarningsOnly({ warnings: "w" }),
      );
    });

    test("undefined success → WarningsOnly", () => {
      expect(
        WithWarnings<number, string>({ warnings: "w", success: undefined }),
      ).toStrictEqual(WarningsOnly({ warnings: "w" }));
    });

    test("falsy-but-present success → SuccessWithWarnings", () => {
      expect(WithWarnings({ warnings: "w", success: 0 })).toStrictEqual(
        SuccessWithWarnings({ warnings: "w", success: 0 }),
      );
      expect(WithWarnings({ warnings: "w", success: "" })).toStrictEqual(
        SuccessWithWarnings({ warnings: "w", success: "" }),
      );
      expect(WithWarnings({ warnings: "w", success: false })).toStrictEqual(
        SuccessWithWarnings({ warnings: "w", success: false }),
      );
    });
  });

  describe("WithSuccess", () => {
    test("present warnings → SuccessWithWarnings", () => {
      expect(WithSuccess({ warnings: "w", success: 1 })).toStrictEqual(
        SuccessWithWarnings({ warnings: "w", success: 1 }),
      );
    });

    test("omitted warnings → SuccessOnly", () => {
      expect(WithSuccess({ success: 1 })).toStrictEqual(
        SuccessOnly({ success: 1 }),
      );
    });

    test("undefined warnings → SuccessOnly", () => {
      expect(
        WithSuccess<number, string>({ warnings: undefined, success: 1 }),
      ).toStrictEqual(SuccessOnly({ success: 1 }));
    });

    test("falsy-but-present warnings → SuccessWithWarnings", () => {
      expect(WithSuccess({ warnings: 0, success: 1 })).toStrictEqual(
        SuccessWithWarnings({ warnings: 0, success: 1 }),
      );
      expect(WithSuccess({ warnings: "", success: 1 })).toStrictEqual(
        SuccessWithWarnings({ warnings: "", success: 1 }),
      );
      expect(WithSuccess({ warnings: false, success: 1 })).toStrictEqual(
        SuccessWithWarnings({ warnings: false, success: 1 }),
      );
    });
  });

  describe("optionFromNullables", () => {
    test("both present → some(SuccessWithWarnings)", () => {
      expect(optionFromNullables({ warnings: "w", success: 1 })).toStrictEqual(
        Option.some(SuccessWithWarnings({ warnings: "w", success: 1 })),
      );
    });

    test("only warnings → some(WarningsOnly)", () => {
      expect(
        optionFromNullables({ warnings: "w", success: null }),
      ).toStrictEqual(Option.some(WarningsOnly({ warnings: "w" })));
    });

    test("only success → some(SuccessOnly)", () => {
      expect(
        optionFromNullables({ warnings: undefined, success: 1 }),
      ).toStrictEqual(Option.some(SuccessOnly({ success: 1 })));
    });

    test("both nullish → none", () => {
      expect(
        optionFromNullables({ warnings: null, success: undefined }),
      ).toStrictEqual(Option.none());
      expect(optionFromNullables({})).toStrictEqual(Option.none());
    });

    test("falsy-but-present values count as present", () => {
      expect(optionFromNullables({ warnings: 0, success: 0 })).toStrictEqual(
        Option.some(SuccessWithWarnings({ warnings: 0, success: 0 })),
      );
      expect(
        optionFromNullables({ warnings: "", success: null }),
      ).toStrictEqual(Option.some(WarningsOnly({ warnings: "" })));
    });
  });

  describe("fromNullables", () => {
    test("both present → SuccessWithWarnings", () => {
      expect(fromNullables({ warnings: "w", success: 1 })).toStrictEqual(
        SuccessWithWarnings({ warnings: "w", success: 1 }),
      );
    });

    test("only warnings → WarningsOnly", () => {
      expect(fromNullables({ warnings: "w", success: null })).toStrictEqual(
        WarningsOnly({ warnings: "w" }),
      );
    });

    test("only success → SuccessOnly", () => {
      expect(fromNullables({ warnings: null, success: 1 })).toStrictEqual(
        SuccessOnly({ success: 1 }),
      );
    });

    test("both nullish → custom orElse", () => {
      expect(
        fromNullables({
          warnings: null,
          success: null,
          orElse: () => WarningsOnly({ warnings: "none" }),
        }),
      ).toStrictEqual(WarningsOnly({ warnings: "none" }));
    });

    test("both nullish without orElse → throws default error", () => {
      expect(() =>
        fromNullables({ warnings: null, success: undefined }),
      ).toThrow("Both warnings and success are nullish");
    });

    test("orElse is not called when a side is present", () => {
      const orElseFunction = vi.fn(() => WarningsOnly({ warnings: "none" }));
      fromNullables({ warnings: "w", success: 1, orElse: orElseFunction });
      expect(orElseFunction).not.toHaveBeenCalled();
    });
  });

  describe("matchWarnings", () => {
    const onWarnings = matchWarnings({
      Warnings: (warnings: string) => `warnings ${warnings}`,
      SuccessOnly: (success: number) => `success ${success}`,
    });

    test("warningsOnly → Warnings handler", () => {
      expect(onWarnings(WarningsOnly({ warnings: "w" }))).toBe("warnings w");
    });

    test("successWithWarnings → Warnings handler (ignores success)", () => {
      expect(
        onWarnings(SuccessWithWarnings({ warnings: "w", success: 1 })),
      ).toBe("warnings w");
    });

    test("successOnly → SuccessOnly handler", () => {
      expect(onWarnings(SuccessOnly({ success: 1 }))).toBe("success 1");
    });
  });

  describe("matchSuccess", () => {
    const onSuccess = matchSuccess({
      WarningsOnly: (warnings: string) => `warnings ${warnings}`,
      Success: (success: number) => `success ${success}`,
    });

    test("successOnly → Success handler", () => {
      expect(onSuccess(SuccessOnly({ success: 1 }))).toBe("success 1");
    });

    test("successWithWarnings → Success handler (ignores warnings)", () => {
      expect(
        onSuccess(SuccessWithWarnings({ warnings: "w", success: 1 })),
      ).toBe("success 1");
    });

    test("warningsOnly → WarningsOnly handler", () => {
      expect(onSuccess(WarningsOnly({ warnings: "w" }))).toBe("warnings w");
    });
  });

  describe("orElse", () => {
    const fill = orElse({
      orElseWarnings: () => "no warnings",
      orElseSuccess: () => 0,
    });

    test("warningsOnly → fills success", () => {
      expect(fill(WarningsOnly({ warnings: "w" }))).toStrictEqual(
        SuccessWithWarnings({ warnings: "w", success: 0 }),
      );
    });

    test("successOnly → fills warnings", () => {
      expect(fill(SuccessOnly({ success: 1 }))).toStrictEqual(
        SuccessWithWarnings({ warnings: "no warnings", success: 1 }),
      );
    });

    test("successWithWarnings → passes through unchanged", () => {
      expect(
        fill(SuccessWithWarnings({ warnings: "w", success: 1 })),
      ).toStrictEqual(SuccessWithWarnings({ warnings: "w", success: 1 }));
    });

    test("only the missing side's thunk runs", () => {
      const orElseWarnings = vi.fn(() => "no warnings");
      const orElseSuccess = vi.fn(() => 0);
      const fillSpied = orElse({ orElseWarnings, orElseSuccess });

      fillSpied(WarningsOnly({ warnings: "w" }));
      expect(orElseSuccess).toHaveBeenCalledTimes(1);
      expect(orElseWarnings).not.toHaveBeenCalled();
    });
  });

  describe("orUndefined", () => {
    test("warningsOnly → success undefined", () => {
      expect(orUndefined(WarningsOnly({ warnings: "w" }))).toStrictEqual(
        SuccessWithWarnings({ warnings: "w", success: undefined }),
      );
    });

    test("successOnly → warnings undefined", () => {
      expect(orUndefined(SuccessOnly({ success: 1 }))).toStrictEqual(
        SuccessWithWarnings({ warnings: undefined, success: 1 }),
      );
    });

    test("successWithWarnings → passes through unchanged", () => {
      expect(
        orUndefined(SuccessWithWarnings({ warnings: "w", success: 1 })),
      ).toStrictEqual(SuccessWithWarnings({ warnings: "w", success: 1 }));
    });
  });

  describe("warningsOrElse", () => {
    const warningsOrNone = warningsOrElse(() => "no warnings");

    test("warningsOnly → warnings", () => {
      expect(warningsOrNone(WarningsOnly({ warnings: "w" }))).toBe("w");
    });

    test("successWithWarnings → warnings", () => {
      expect(
        warningsOrNone(SuccessWithWarnings({ warnings: "w", success: 1 })),
      ).toBe("w");
    });

    test("successOnly → fallback", () => {
      expect(warningsOrNone(SuccessOnly({ success: 1 }))).toBe("no warnings");
    });
  });

  describe("warningsOrUndefined", () => {
    test("warningsOnly → warnings", () => {
      expect(warningsOrUndefined(WarningsOnly({ warnings: "w" }))).toBe("w");
    });

    test("successWithWarnings → warnings", () => {
      expect(
        warningsOrUndefined(SuccessWithWarnings({ warnings: "w", success: 1 })),
      ).toBe("w");
    });

    test("successOnly → undefined", () => {
      expect(warningsOrUndefined(SuccessOnly({ success: 1 }))).toBeUndefined();
    });
  });

  describe("successOrElse", () => {
    const successOrZero = successOrElse(() => 0);

    test("successOnly → success", () => {
      expect(successOrZero(SuccessOnly({ success: 1 }))).toBe(1);
    });

    test("successWithWarnings → success", () => {
      expect(
        successOrZero(SuccessWithWarnings({ warnings: "w", success: 1 })),
      ).toBe(1);
    });

    test("warningsOnly → fallback", () => {
      expect(successOrZero(WarningsOnly({ warnings: "w" }))).toBe(0);
    });
  });

  describe("successOrUndefined", () => {
    test("successOnly → success", () => {
      expect(successOrUndefined(SuccessOnly({ success: 1 }))).toBe(1);
    });

    test("successWithWarnings → success", () => {
      expect(
        successOrUndefined(SuccessWithWarnings({ warnings: "w", success: 1 })),
      ).toBe(1);
    });

    test("warningsOnly → undefined", () => {
      expect(
        successOrUndefined(WarningsOnly({ warnings: "w" })),
      ).toBeUndefined();
    });
  });

  describe("successOption", () => {
    test("successOnly → some", () => {
      expect(successOption(SuccessOnly({ success: 1 }))).toStrictEqual(
        Option.some(1),
      );
    });

    test("successWithWarnings → some", () => {
      expect(
        successOption(SuccessWithWarnings({ warnings: "w", success: 1 })),
      ).toStrictEqual(Option.some(1));
    });

    test("warningsOnly → none", () => {
      expect(successOption(WarningsOnly({ warnings: "w" }))).toStrictEqual(
        Option.none(),
      );
    });

    test("falsy success → some", () => {
      expect(successOption(SuccessOnly({ success: 0 }))).toStrictEqual(
        Option.some(0),
      );
    });
  });

  describe("warningsOption", () => {
    test("warningsOnly → some", () => {
      expect(warningsOption(WarningsOnly({ warnings: "w" }))).toStrictEqual(
        Option.some("w"),
      );
    });

    test("successWithWarnings → some", () => {
      expect(
        warningsOption(SuccessWithWarnings({ warnings: "w", success: 1 })),
      ).toStrictEqual(Option.some("w"));
    });

    test("successOnly → none", () => {
      expect(warningsOption(SuccessOnly({ success: 1 }))).toStrictEqual(
        Option.none(),
      );
    });
  });

  describe("mapBoth", () => {
    const both = mapBoth({
      mapWarnings: (warnings: string) => warnings.toUpperCase(),
      mapSuccess: (success: number) => success + 1,
    });

    test("warningsOnly → maps warnings only", () => {
      expect(both(WarningsOnly({ warnings: "w" }))).toStrictEqual(
        WarningsOnly({ warnings: "W" }),
      );
    });

    test("successOnly → maps success only", () => {
      expect(both(SuccessOnly({ success: 1 }))).toStrictEqual(
        SuccessOnly({ success: 2 }),
      );
    });

    test("successWithWarnings → maps both", () => {
      expect(
        both(SuccessWithWarnings({ warnings: "w", success: 1 })),
      ).toStrictEqual(SuccessWithWarnings({ warnings: "W", success: 2 }));
    });
  });

  describe("mapWarnings", () => {
    const shout = mapWarnings((warnings: string) => warnings.toUpperCase());

    test("warningsOnly → maps warnings", () => {
      expect(shout(WarningsOnly({ warnings: "w" }))).toStrictEqual(
        WarningsOnly({ warnings: "W" }),
      );
    });

    test("successWithWarnings → maps warnings, preserves success", () => {
      expect(
        shout(SuccessWithWarnings({ warnings: "w", success: 1 })),
      ).toStrictEqual(SuccessWithWarnings({ warnings: "W", success: 1 }));
    });

    test("successOnly → passes through unchanged", () => {
      expect(shout(SuccessOnly({ success: 1 }))).toStrictEqual(
        SuccessOnly({ success: 1 }),
      );
    });
  });

  describe("flatMapWarnings", () => {
    const chain = flatMapWarnings((warnings: string) =>
      warnings.length > 0
        ? WarningsOnly({ warnings: warnings.toUpperCase() })
        : SuccessOnly({ success: 0 }),
    );

    test("warningsOnly → flattens mapper result", () => {
      expect(chain(WarningsOnly({ warnings: "w" }))).toStrictEqual(
        WarningsOnly({ warnings: "W" }),
      );
    });

    test("successWithWarnings → flattens mapper result (can change tag)", () => {
      expect(
        chain(SuccessWithWarnings({ warnings: "", success: 5 })),
      ).toStrictEqual(SuccessOnly({ success: 0 }));
    });

    test("successOnly → passes through unchanged", () => {
      expect(chain(SuccessOnly({ success: 1 }))).toStrictEqual(
        SuccessOnly({ success: 1 }),
      );
    });
  });

  describe("mapSuccess", () => {
    const inc = mapSuccess((success: number) => success + 1);

    test("successOnly → maps success", () => {
      expect(inc(SuccessOnly({ success: 1 }))).toStrictEqual(
        SuccessOnly({ success: 2 }),
      );
    });

    test("successWithWarnings → maps success, preserves warnings", () => {
      expect(
        inc(SuccessWithWarnings({ warnings: "w", success: 1 })),
      ).toStrictEqual(SuccessWithWarnings({ warnings: "w", success: 2 }));
    });

    test("warningsOnly → passes through unchanged", () => {
      expect(inc(WarningsOnly({ warnings: "w" }))).toStrictEqual(
        WarningsOnly({ warnings: "w" }),
      );
    });
  });

  describe("flatMapSuccess", () => {
    const chain = flatMapSuccess((success: number) =>
      success > 0
        ? SuccessOnly({ success: success + 1 })
        : WarningsOnly({ warnings: "non-positive" }),
    );

    test("successOnly → flattens mapper result", () => {
      expect(chain(SuccessOnly({ success: 1 }))).toStrictEqual(
        SuccessOnly({ success: 2 }),
      );
    });

    test("successWithWarnings → flattens mapper result (can change tag)", () => {
      expect(
        chain(SuccessWithWarnings({ warnings: "w", success: 0 })),
      ).toStrictEqual(WarningsOnly({ warnings: "non-positive" }));
    });

    test("warningsOnly → passes through unchanged", () => {
      expect(chain(WarningsOnly({ warnings: "w" }))).toStrictEqual(
        WarningsOnly({ warnings: "w" }),
      );
    });
  });

  describe("mapBothEffect", () => {
    const both = mapBothEffect({
      mapWarnings: (warnings: string) => Effect.succeed(warnings.toUpperCase()),
      mapSuccess: (success: number) => Effect.succeed(success + 1),
    });

    it.effect("WarningsOnly → runs only the warnings effect", () =>
      Effect.gen(function* () {
        const result = yield* both(WarningsOnly({ warnings: "w" }));
        expect(result).toStrictEqual(WarningsOnly({ warnings: "W" }));
      }),
    );

    it.effect("SuccessOnly → runs only the success effect", () =>
      Effect.gen(function* () {
        const result = yield* both(SuccessOnly({ success: 1 }));
        expect(result).toStrictEqual(SuccessOnly({ success: 2 }));
      }),
    );

    it.effect("SuccessWithWarnings → runs both effects", () =>
      Effect.gen(function* () {
        const result = yield* both(
          SuccessWithWarnings({ warnings: "w", success: 1 }),
        );
        expect(result).toStrictEqual(
          SuccessWithWarnings({ warnings: "W", success: 2 }),
        );
      }),
    );

    it.effect("failure in the warnings effect short-circuits", () =>
      Effect.gen(function* () {
        const failing = mapBothEffect({
          mapWarnings: () => Effect.fail("boom"),
          mapSuccess: (success: number) => Effect.succeed(success + 1),
        });
        const result = yield* failing(
          SuccessWithWarnings({ warnings: "w", success: 1 }),
        ).pipe(Effect.result);
        expect(result).toStrictEqual(Result.fail("boom"));
      }),
    );

    it.effect("failure in the success effect short-circuits", () =>
      Effect.gen(function* () {
        const failing = mapBothEffect({
          mapWarnings: (warnings: string) => Effect.succeed(warnings),
          mapSuccess: () => Effect.fail("boom"),
        });
        const result = yield* failing(SuccessOnly({ success: 1 })).pipe(
          Effect.result,
        );
        expect(result).toStrictEqual(Result.fail("boom"));
      }),
    );
  });

  describe("mapWarningsEffect", () => {
    const shout = mapWarningsEffect((warnings: string) =>
      Effect.succeed(warnings.toUpperCase()),
    );

    it.effect("WarningsOnly → maps warnings", () =>
      Effect.gen(function* () {
        const result = yield* shout(WarningsOnly({ warnings: "w" }));
        expect(result).toStrictEqual(WarningsOnly({ warnings: "W" }));
      }),
    );

    it.effect("SuccessWithWarnings → maps warnings, preserves success", () =>
      Effect.gen(function* () {
        const result = yield* shout(
          SuccessWithWarnings({ warnings: "w", success: 1 }),
        );
        expect(result).toStrictEqual(
          SuccessWithWarnings({ warnings: "W", success: 1 }),
        );
      }),
    );

    it.effect("SuccessOnly → carries success through unchanged", () =>
      Effect.gen(function* () {
        const result = yield* shout(SuccessOnly({ success: 1 }));
        expect(result).toStrictEqual(SuccessOnly({ success: 1 }));
      }),
    );

    it.effect("failure propagates", () =>
      Effect.gen(function* () {
        const failing = mapWarningsEffect(() => Effect.fail("boom"));
        const result = yield* failing(WarningsOnly({ warnings: "w" })).pipe(
          Effect.result,
        );
        expect(result).toStrictEqual(Result.fail("boom"));
      }),
    );
  });

  describe("flatMapWarningsEffect", () => {
    const chain = flatMapWarningsEffect((warnings: string) =>
      Effect.succeed(WarningsOnly({ warnings: warnings.toUpperCase() })),
    );

    it.effect("WarningsOnly → flattens mapper result", () =>
      Effect.gen(function* () {
        const result = yield* chain(WarningsOnly({ warnings: "w" }));
        expect(result).toStrictEqual(WarningsOnly({ warnings: "W" }));
      }),
    );

    it.effect("SuccessWithWarnings → flattens mapper result", () =>
      Effect.gen(function* () {
        const result = yield* chain(
          SuccessWithWarnings({ warnings: "w", success: 1 }),
        );
        expect(result).toStrictEqual(WarningsOnly({ warnings: "W" }));
      }),
    );

    it.effect("SuccessOnly → lifted unchanged", () =>
      Effect.gen(function* () {
        const result = yield* chain(SuccessOnly({ success: 1 }));
        expect(result).toStrictEqual(SuccessOnly({ success: 1 }));
      }),
    );

    it.effect("failure propagates", () =>
      Effect.gen(function* () {
        const failing = flatMapWarningsEffect(() => Effect.fail("boom"));
        const result = yield* failing(WarningsOnly({ warnings: "w" })).pipe(
          Effect.result,
        );
        expect(result).toStrictEqual(Result.fail("boom"));
      }),
    );
  });

  describe("mapSuccessEffect", () => {
    const inc = mapSuccessEffect((success: number) =>
      Effect.succeed(success + 1),
    );

    it.effect("SuccessOnly → maps success", () =>
      Effect.gen(function* () {
        const result = yield* inc(SuccessOnly({ success: 1 }));
        expect(result).toStrictEqual(SuccessOnly({ success: 2 }));
      }),
    );

    it.effect("SuccessWithWarnings → maps success, preserves warnings", () =>
      Effect.gen(function* () {
        const result = yield* inc(
          SuccessWithWarnings({ warnings: "w", success: 1 }),
        );
        expect(result).toStrictEqual(
          SuccessWithWarnings({ warnings: "w", success: 2 }),
        );
      }),
    );

    it.effect("WarningsOnly → carries warnings through unchanged", () =>
      Effect.gen(function* () {
        const result = yield* inc(WarningsOnly({ warnings: "w" }));
        expect(result).toStrictEqual(WarningsOnly({ warnings: "w" }));
      }),
    );

    it.effect("failure propagates", () =>
      Effect.gen(function* () {
        const failing = mapSuccessEffect(() => Effect.fail("boom"));
        const result = yield* failing(SuccessOnly({ success: 1 })).pipe(
          Effect.result,
        );
        expect(result).toStrictEqual(Result.fail("boom"));
      }),
    );
  });

  describe("flatMapSuccessEffect", () => {
    const chain = flatMapSuccessEffect((success: number) =>
      Effect.succeed(SuccessOnly({ success: success + 1 })),
    );

    it.effect("SuccessOnly → flattens mapper result", () =>
      Effect.gen(function* () {
        const result = yield* chain(SuccessOnly({ success: 1 }));
        expect(result).toStrictEqual(SuccessOnly({ success: 2 }));
      }),
    );

    it.effect("SuccessWithWarnings → flattens mapper result", () =>
      Effect.gen(function* () {
        const result = yield* chain(
          SuccessWithWarnings({ warnings: "w", success: 1 }),
        );
        expect(result).toStrictEqual(SuccessOnly({ success: 2 }));
      }),
    );

    it.effect("WarningsOnly → lifted unchanged", () =>
      Effect.gen(function* () {
        const result = yield* chain(WarningsOnly({ warnings: "w" }));
        expect(result).toStrictEqual(WarningsOnly({ warnings: "w" }));
      }),
    );

    it.effect("failure propagates", () =>
      Effect.gen(function* () {
        const failing = flatMapSuccessEffect(() => Effect.fail("boom"));
        const result = yield* failing(SuccessOnly({ success: 1 })).pipe(
          Effect.result,
        );
        expect(result).toStrictEqual(Result.fail("boom"));
      }),
    );
  });

  describe("zip", () => {
    const describeWarnResult = (
      warnResult: WarnResult<number, number>,
    ): string =>
      match(warnResult, {
        WarningsOnly: ({ warnings }) => `Warnings ${warnings}`,
        SuccessOnly: ({ success }) => `Success ${success}`,
        SuccessWithWarnings: ({ warnings, success }) =>
          `Warnings ${warnings} and Success ${success}`,
      });

    test("same length", () => {
      expect(zip([1, 2, 3], [4, 5, 6], describeWarnResult)).toStrictEqual([
        "Warnings 1 and Success 4",
        "Warnings 2 and Success 5",
        "Warnings 3 and Success 6",
      ]);
    });

    test("longer first array", () => {
      expect(zip([1, 2, 3, 4], [4, 5, 6], describeWarnResult)).toStrictEqual([
        "Warnings 1 and Success 4",
        "Warnings 2 and Success 5",
        "Warnings 3 and Success 6",
        "Warnings 4",
      ]);
    });

    test("longer second array", () => {
      expect(zip([1, 2, 3], [4, 5, 6, 7], describeWarnResult)).toStrictEqual([
        "Warnings 1 and Success 4",
        "Warnings 2 and Success 5",
        "Warnings 3 and Success 6",
        "Success 7",
      ]);
    });

    test("empty first array", () => {
      expect(
        zip(Array.empty<number>(), [4, 5, 6], describeWarnResult),
      ).toStrictEqual(["Success 4", "Success 5", "Success 6"]);
    });

    test("empty second array", () => {
      expect(
        zip([1, 2, 3], Array.empty<number>(), describeWarnResult),
      ).toStrictEqual(["Warnings 1", "Warnings 2", "Warnings 3"]);
    });

    test("empty both arrays", () => {
      expect(
        zip(Array.empty<number>(), Array.empty<number>(), describeWarnResult),
      ).toStrictEqual([]);
    });

    test("data-last (pipeable)", () => {
      expect(
        pipe([1, 2, 3, 4], zip([4, 5, 6], describeWarnResult)),
      ).toStrictEqual([
        "Warnings 1 and Success 4",
        "Warnings 2 and Success 5",
        "Warnings 3 and Success 6",
        "Warnings 4",
      ]);
    });
  });
});
