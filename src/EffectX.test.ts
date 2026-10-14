import {
  Cause,
  Data,
  Duration,
  Effect,
  Exit,
  Fiber,
  Option,
  Predicate,
  Result,
  pipe,
} from "effect";
import * as TestClock from "effect/testing/TestClock";
import { describe, expect, expectTypeOf, test, vi } from "vitest";
import { it } from "@effect/vitest";
import { flattenOption, fromOptionOrElse, tryUntil } from "./EffectX.js";

describe("Effect utils", () => {
  describe("flattenOption", () => {
    it.effect("some", () =>
      Effect.gen(function* () {
        const result = yield* flattenOption(
          Effect.succeed(Option.some(1)),
          () => "No way",
        ).pipe(Effect.result);

        expect(result).toStrictEqual(Result.succeed(1));
      }),
    );

    it.effect("none", () =>
      Effect.gen(function* () {
        const result = yield* flattenOption(
          Effect.succeed(Option.none()),
          () => "No way",
        ).pipe(Effect.result);

        expect(result).toStrictEqual(Result.fail("No way"));
      }),
    );

    it.effect("failing effect", () =>
      Effect.gen(function* () {
        const result = yield* flattenOption(
          Effect.fail("Error"),
          () => "No way",
        ).pipe(Effect.result);

        expect(result).toStrictEqual(Result.fail("Error"));
      }),
    );

    it.effect("evaluates onNone only for each executed None", () =>
      Effect.gen(function* () {
        const error = new Error("missing");
        const sourceError = new Error("source error");
        const directOnNone = vi.fn(() => error);
        const pipedOnNone = vi.fn(() => error);
        const some = Effect.succeed(Option.some(1));
        const failed = Effect.fail(sourceError);
        const none = Effect.succeed(Option.none<number>());
        const directSome = flattenOption(some, directOnNone);
        const pipedSome = pipe(some, flattenOption(pipedOnNone));
        const directFailed = flattenOption(failed, directOnNone);
        const pipedFailed = pipe(failed, flattenOption(pipedOnNone));
        const directNone = flattenOption(none, directOnNone);
        const pipedNone = pipe(none, flattenOption(pipedOnNone));

        expect(directOnNone).not.toHaveBeenCalled();
        expect(pipedOnNone).not.toHaveBeenCalled();
        const directSuccess = yield* Effect.result(directSome);
        const pipedSuccess = yield* Effect.result(pipedSome);
        expect(directSuccess).toStrictEqual(Result.succeed(1));
        expect(pipedSuccess).toStrictEqual(directSuccess);
        const directFailure = yield* Effect.result(directFailed);
        const pipedFailure = yield* Effect.result(pipedFailed);
        expect(directFailure).toStrictEqual(Result.fail(sourceError));
        expect(pipedFailure).toStrictEqual(directFailure);
        expect(Option.getOrThrow(Result.getFailure(directFailure))).toBe(
          sourceError,
        );
        expect(Option.getOrThrow(Result.getFailure(pipedFailure))).toBe(
          sourceError,
        );
        expect(directOnNone).not.toHaveBeenCalled();
        expect(pipedOnNone).not.toHaveBeenCalled();

        for (let execution = 1; execution <= 2; execution = execution + 1) {
          const directResult = yield* Effect.result(directNone);
          const pipedResult = yield* Effect.result(pipedNone);
          expect(directResult).toStrictEqual(Result.fail(error));
          expect(pipedResult).toStrictEqual(directResult);
          expect(Option.getOrThrow(Result.getFailure(directResult))).toBe(
            error,
          );
          expect(Option.getOrThrow(Result.getFailure(pipedResult))).toBe(error);
          expect(directOnNone).toHaveBeenCalledTimes(execution);
          expect(pipedOnNone.mock.calls).toStrictEqual(directOnNone.mock.calls);
          expect(directOnNone).toHaveBeenNthCalledWith(execution);
        }
      }),
    );

    it.effect("Some preserves falsy and nullish values in both forms", () =>
      Effect.gen(function* () {
        for (const value of [0, false, "", null, undefined]) {
          const onNone = vi.fn(() => "missing");
          const source = Effect.succeed(Option.some(value));
          expect(yield* flattenOption(source, onNone)).toBe(value);
          expect(yield* pipe(source, flattenOption(onNone))).toBe(value);
          expect(onNone).not.toHaveBeenCalled();
        }
      }),
    );

    it.effect("Some preserves object identity in both forms", () =>
      Effect.gen(function* () {
        const value = { theme: "dark" };
        const source = Effect.succeed(Option.some(value));
        expect(yield* flattenOption(source, () => "missing")).toBe(value);
        expect(
          yield* pipe(
            source,
            flattenOption(() => "missing"),
          ),
        ).toBe(value);
      }),
    );

    it.effect(
      "throwing onNone defects on each None execution in both forms",
      () =>
        Effect.gen(function* () {
          const error = new Error("fallback threw");
          const sourceError = new Error("source failed");
          const directOnNone = vi.fn(() => {
            throw error;
          });
          const pipedOnNone = vi.fn(() => {
            throw error;
          });
          const directNone = flattenOption(
            Effect.succeed(Option.none<number>()),
            directOnNone,
          );
          const pipedNone = pipe(
            Effect.succeed(Option.none<number>()),
            flattenOption(pipedOnNone),
          );
          expect(directOnNone).not.toHaveBeenCalled();
          expect(pipedOnNone).not.toHaveBeenCalled();

          expect(
            yield* flattenOption(Effect.succeed(Option.some(1)), directOnNone),
          ).toBe(1);
          expect(
            yield* pipe(
              Effect.succeed(Option.some(1)),
              flattenOption(pipedOnNone),
            ),
          ).toBe(1);
          expect(
            yield* Effect.result(
              flattenOption(Effect.fail(sourceError), directOnNone),
            ),
          ).toStrictEqual(Result.fail(sourceError));
          expect(
            yield* pipe(
              Effect.fail(sourceError),
              flattenOption(pipedOnNone),
              Effect.result,
            ),
          ).toStrictEqual(Result.fail(sourceError));
          expect(directOnNone).not.toHaveBeenCalled();
          expect(pipedOnNone).not.toHaveBeenCalled();

          for (const execution of [1, 2]) {
            for (const effect of [directNone, pipedNone]) {
              const exit = yield* Effect.exit(effect);
              expect(Exit.isFailure(exit)).toBe(true);
              if (Exit.isFailure(exit)) {
                expect(exit.cause.reasons).toHaveLength(1);
                expect(exit.cause.reasons.find(Cause.isDieReason)?.defect).toBe(
                  error,
                );
              }
            }
            expect(directOnNone).toHaveBeenCalledTimes(execution);
            expect(pipedOnNone.mock.calls).toStrictEqual(
              directOnNone.mock.calls,
            );
            expect(directOnNone).toHaveBeenNthCalledWith(execution);
          }
        }),
    );

    it.effect("a null lookup result defects during execution", () =>
      Effect.gen(function* () {
        const onNone = vi.fn(() => "missing");
        // @ts-expect-error - null is not an Option returned by the source effect
        const effect = flattenOption(Effect.succeed(null), onNone);
        expect(onNone).not.toHaveBeenCalled();
        const exit = yield* Effect.exit(effect);
        expect(Exit.isFailure(exit)).toBe(true);
        if (Exit.isFailure(exit)) {
          expect(exit.cause.reasons).toHaveLength(1);
          expect(
            exit.cause.reasons.find(Cause.isDieReason)?.defect,
          ).toBeInstanceOf(TypeError);
        }
        expect(onNone).not.toHaveBeenCalled();
      }),
    );
  });

  describe("fromOptionOrElse", () => {
    class CustomError extends Data.TaggedError("CustomError")<{
      readonly reason: string;
    }> {}

    it.effect(
      "both forms agree on outcomes and construction-time callbacks",
      () =>
        Effect.gen(function* () {
          const value = { theme: "dark" };
          const error = new CustomError({ reason: "missing" });
          const directOnNone = vi.fn(() => error);
          const pipedOnNone = vi.fn(() => error);
          const convert = fromOptionOrElse(pipedOnNone);
          expect(pipedOnNone).not.toHaveBeenCalled();

          const directSome = fromOptionOrElse(Option.some(value), directOnNone);
          const pipedSome = pipe(Option.some(value), convert);
          const directSuccess = yield* Effect.result(directSome);
          const pipedSuccess = yield* Effect.result(pipedSome);
          expect(directSuccess).toStrictEqual(Result.succeed(value));
          expect(pipedSuccess).toStrictEqual(directSuccess);
          for (const effect of [directSome, pipedSome]) {
            expect(yield* effect).toBe(value);
          }
          expect(directOnNone).not.toHaveBeenCalled();
          expect(pipedOnNone).not.toHaveBeenCalled();

          const directNone = fromOptionOrElse(
            Option.none<string>(),
            directOnNone,
          );
          const pipedNone = pipe(Option.none<string>(), convert);
          expect(directOnNone).toHaveBeenCalledTimes(1);
          expect(pipedOnNone.mock.calls).toStrictEqual(directOnNone.mock.calls);
          expect(directOnNone).toHaveBeenNthCalledWith(1);
          for (let execution = 1; execution <= 2; execution = execution + 1) {
            const directResult = yield* Effect.result(directNone);
            const pipedResult = yield* Effect.result(pipedNone);
            expect(directResult).toStrictEqual(Result.fail(error));
            expect(pipedResult).toStrictEqual(directResult);
            expect(Option.getOrThrow(Result.getFailure(directResult))).toBe(
              error,
            );
            expect(Option.getOrThrow(Result.getFailure(pipedResult))).toBe(
              error,
            );
            expect(directOnNone).toHaveBeenCalledTimes(1);
            expect(pipedOnNone.mock.calls).toStrictEqual(
              directOnNone.mock.calls,
            );
          }
        }),
    );

    it.effect("Some bypasses a throwing fallback in both forms", () =>
      Effect.gen(function* () {
        const error = new Error("fallback threw");
        const directOnNone = vi.fn(() => {
          throw error;
        });
        const pipedOnNone = vi.fn(() => {
          throw error;
        });
        expect(
          yield* fromOptionOrElse(Option.some("saved"), directOnNone),
        ).toBe("saved");
        expect(
          yield* pipe(Option.some("saved"), fromOptionOrElse(pipedOnNone)),
        ).toBe("saved");
        expect(directOnNone).not.toHaveBeenCalled();
        expect(pipedOnNone).not.toHaveBeenCalled();
      }),
    );

    test("throwing onNone escapes synchronously when None is applied in both forms", () => {
      const error = new Error("fallback threw");
      const directOnNone = vi.fn(() => {
        throw error;
      });
      const pipedOnNone = vi.fn(() => {
        throw error;
      });
      const convert = fromOptionOrElse(pipedOnNone);
      expect(pipedOnNone).not.toHaveBeenCalled();
      const direct = vi.fn(() => fromOptionOrElse(Option.none(), directOnNone));
      const piped = vi.fn(() => pipe(Option.none(), convert));

      expect(direct).toThrow(error);
      expect(piped).toThrow(error);
      expect(direct.mock.results[0]?.value).toBe(error);
      expect(piped.mock.results[0]?.value).toBe(error);
      expect(directOnNone).toHaveBeenCalledTimes(1);
      expect(pipedOnNone.mock.calls).toStrictEqual(directOnNone.mock.calls);
      expect(directOnNone).toHaveBeenNthCalledWith(1);
    });

    test("a null Option throws synchronously without evaluating onNone", () => {
      const onNone = vi.fn(() => "missing");
      expect(() => {
        // @ts-expect-error - null is not an Option, unlike the valid Some(null)
        fromOptionOrElse(null, onNone);
      }).toThrow(TypeError);
      expect(onNone).not.toHaveBeenCalled();
    });

    describe("data-first form", () => {
      it.effect("None evaluates onNone once when the effect is built", () =>
        Effect.gen(function* () {
          const onNone = vi.fn(() => "missing");
          const effect = fromOptionOrElse(Option.none<string>(), onNone);

          expect(onNone).toHaveBeenCalledTimes(1);
          expect(yield* effect.pipe(Effect.result)).toStrictEqual(
            Result.fail("missing"),
          );
          expect(yield* effect.pipe(Effect.result)).toStrictEqual(
            Result.fail("missing"),
          );
          expect(onNone).toHaveBeenCalledTimes(1);
          expect(onNone).toHaveBeenNthCalledWith(1);
        }),
      );

      it.effect("Some(value) → succeeds with the value", () =>
        Effect.gen(function* () {
          const result = yield* fromOptionOrElse(
            Option.some(42),
            () => "missing",
          ).pipe(Effect.result);

          expect(result).toStrictEqual(Result.succeed(42));
        }),
      );

      it.effect("None → fails with onNone()", () =>
        Effect.gen(function* () {
          const result = yield* fromOptionOrElse(
            Option.none<number>(),
            () => "missing",
          ).pipe(Effect.result);

          expect(result).toStrictEqual(Result.fail("missing"));
        }),
      );

      it.effect("None → onNone is only called when needed", () =>
        Effect.gen(function* () {
          const onNone = vi.fn(() => "missing");

          // Some case: onNone should NOT be called
          yield* fromOptionOrElse(Option.some("hello"), onNone).pipe(
            Effect.result,
          );
          expect(onNone).not.toHaveBeenCalled();

          // None case: onNone should be called exactly once
          yield* fromOptionOrElse(Option.none<string>(), onNone).pipe(
            Effect.result,
          );
          expect(onNone).toHaveBeenCalledTimes(1);
          expect(onNone).toHaveBeenNthCalledWith(1);
        }),
      );

      it.effect("None → preserves the domain error type", () =>
        Effect.gen(function* () {
          const result = yield* fromOptionOrElse(
            Option.none<number>(),
            () => new CustomError({ reason: "not found" }),
          ).pipe(Effect.result);

          expect(Result.isFailure(result)).toBe(true);
          if (Result.isFailure(result)) {
            expect(result.failure).toBeInstanceOf(CustomError);
            expect(result.failure._tag).toBe("CustomError");
            expect(result.failure.reason).toBe("not found");
          }
        }),
      );

      it.effect("Some(falsy value) → still succeeds (0)", () =>
        Effect.gen(function* () {
          const result = yield* fromOptionOrElse(
            Option.some(0),
            () => "missing",
          ).pipe(Effect.result);

          expect(result).toStrictEqual(Result.succeed(0));
        }),
      );

      it.effect("Some(falsy value) → still succeeds (empty string)", () =>
        Effect.gen(function* () {
          const result = yield* fromOptionOrElse(
            Option.some(""),
            () => "missing",
          ).pipe(Effect.result);

          expect(result).toStrictEqual(Result.succeed(""));
        }),
      );

      it.effect("Some(falsy value) → still succeeds (false)", () =>
        Effect.gen(function* () {
          const result = yield* fromOptionOrElse(
            Option.some(false),
            () => "missing",
          ).pipe(Effect.result);

          expect(result).toStrictEqual(Result.succeed(false));
        }),
      );

      it.effect("Some(null) → still succeeds (None ≠ null)", () =>
        Effect.gen(function* () {
          const result = yield* fromOptionOrElse(
            Option.some<string | null>(null),
            () => "missing",
          ).pipe(Effect.result);

          expect(result).toStrictEqual(Result.succeed(null));
        }),
      );

      it.effect("Some(undefined) → still succeeds (None ≠ undefined)", () =>
        Effect.gen(function* () {
          const result = yield* fromOptionOrElse(
            Option.some<string | undefined>(undefined),
            () => "missing",
          ).pipe(Effect.result);

          expect(result).toStrictEqual(Result.succeed(undefined));
        }),
      );

      it.effect("Some(object) → succeeds with the same reference", () =>
        Effect.gen(function* () {
          const value = { id: 1, name: "foo" };
          const result = yield* fromOptionOrElse(
            Option.some(value),
            () => "missing",
          ).pipe(Effect.result);

          expect(result).toStrictEqual(Result.succeed(value));
          if (Result.isSuccess(result)) {
            expect(result.success).toBe(value); // Reference equality
          }
        }),
      );
    });

    describe("data-last form (for pipe)", () => {
      it.effect("Some(value) → succeeds with the value", () =>
        Effect.gen(function* () {
          const result = yield* pipe(
            Option.some(42),
            fromOptionOrElse(() => "missing"),
            Effect.result,
          );

          expect(result).toStrictEqual(Result.succeed(42));
        }),
      );

      it.effect("None → fails with onNone()", () =>
        Effect.gen(function* () {
          const result = yield* pipe(
            Option.none<number>(),
            fromOptionOrElse(() => "missing"),
            Effect.result,
          );

          expect(result).toStrictEqual(Result.fail("missing"));
        }),
      );

      it.effect("None → preserves the domain error type", () =>
        Effect.gen(function* () {
          const result = yield* pipe(
            Option.none<number>(),
            fromOptionOrElse(() => new CustomError({ reason: "missing" })),
            Effect.result,
          );

          expect(Result.isFailure(result)).toBe(true);
          if (Result.isFailure(result)) {
            expect(result.failure).toBeInstanceOf(CustomError);
            expect(result.failure.reason).toBe("missing");
          }
        }),
      );

      it.effect("composable with Effect.map", () =>
        Effect.gen(function* () {
          const result = yield* pipe(
            Option.some(10),
            fromOptionOrElse(() => "missing"),
            Effect.map((n) => n * 2),
            Effect.result,
          );

          expect(result).toStrictEqual(Result.succeed(20));
        }),
      );

      it.effect("composable with Effect.flatMap", () =>
        Effect.gen(function* () {
          const result = yield* pipe(
            Option.some(10),
            fromOptionOrElse(() => "missing"),
            Effect.flatMap((n) => Effect.succeed(n + 1)),
            Effect.result,
          );

          expect(result).toStrictEqual(Result.succeed(11));
        }),
      );
    });

    describe("yield* in Effect.gen", () => {
      it.effect("Some(value) → unwraps the value", () =>
        Effect.gen(function* () {
          const value = yield* fromOptionOrElse(
            Option.some("hello"),
            () => "missing",
          );
          expect(value).toBe("hello");
        }),
      );

      it.effect("None → short-circuits the gen with the error", () =>
        Effect.gen(function* () {
          let reachedAfterFromOption = false;

          const result = yield* Effect.gen(function* () {
            yield* fromOptionOrElse(
              Option.none<number>(),
              () => new CustomError({ reason: "empty" }),
            );
            reachedAfterFromOption = true;
            return "should not reach";
          }).pipe(Effect.result);

          expect(reachedAfterFromOption).toBe(false);
          expect(Result.isFailure(result)).toBe(true);
          if (Result.isFailure(result)) {
            expect(result.failure).toBeInstanceOf(CustomError);
          }
        }),
      );
    });
  });

  describe("tryUntil", () => {
    it.effect("the refinement narrows the success type", () =>
      Effect.gen(function* () {
        const effect = tryUntil({
          try: (): string | undefined => "Sam",
          until: Predicate.isString,
          maxDuration: Duration.seconds(1),
        });
        expectTypeOf(effect).toEqualTypeOf<
          Effect.Effect<string, Cause.TimeoutError>
        >();
        expect(yield* effect).toBe("Sam");
      }),
    );

    it.effect("an immediate match succeeds even with zero timeout", () =>
      Effect.gen(function* () {
        const value = { theme: "dark" };
        const mockThunk = vi.fn(() => value);
        const mockUntil = vi.fn(
          (setting: typeof value) => setting.theme === "dark",
        );
        const effect = tryUntil({
          try: mockThunk,
          until: (setting: typeof value): setting is typeof value =>
            mockUntil(setting),
          maxDuration: Duration.zero,
        });
        expect(yield* effect).toBe(value);
        expect(yield* effect).toBe(value);
        expect(mockThunk.mock.calls).toStrictEqual([[]]);
        expect(mockUntil.mock.calls).toStrictEqual([[value]]);
      }),
    );

    it.effect(
      "the default interval polls at 200ms and stops after success",
      () =>
        Effect.gen(function* () {
          const mockThunk = vi
            .fn<() => string | undefined>()
            .mockReturnValueOnce(undefined)
            .mockReturnValue("Sam");
          const mockUntil = vi.fn(Predicate.isString);
          const effect = tryUntil({
            try: mockThunk,
            until: (value: string | undefined): value is string =>
              mockUntil(value),
            maxDuration: Duration.seconds(1),
          });
          expect(mockThunk.mock.calls).toStrictEqual([[]]);
          expect(mockUntil.mock.calls).toStrictEqual([[undefined]]);
          const fiber = yield* Effect.forkChild(effect);
          yield* TestClock.adjust("199 millis");
          expect(fiber.pollUnsafe()).toBeUndefined();
          expect(mockThunk.mock.calls).toStrictEqual([[]]);
          expect(mockUntil.mock.calls).toStrictEqual([[undefined]]);
          yield* TestClock.adjust("1 millis");
          expect(fiber.pollUnsafe()).toStrictEqual(Exit.succeed("Sam"));
          expect(yield* Fiber.join(fiber)).toBe("Sam");
          expect(mockThunk.mock.calls).toStrictEqual([[], []]);
          expect(mockUntil.mock.calls).toStrictEqual([[undefined], ["Sam"]]);
          yield* TestClock.adjust("2 seconds");
          expect(mockThunk.mock.calls).toStrictEqual([[], []]);
          expect(mockUntil.mock.calls).toStrictEqual([[undefined], ["Sam"]]);
        }),
    );

    it.effect("short and zero timeouts permit no delayed attempt", () =>
      Effect.gen(function* () {
        for (const { maxDuration, label, boundaryTick } of [
          {
            maxDuration: Duration.millis(50),
            label: "50ms",
            boundaryTick: Duration.millis(1),
          },
          {
            maxDuration: Duration.zero,
            label: "0",
            boundaryTick: Duration.zero,
          },
        ]) {
          const mockThunk = vi.fn(() => 1);
          const mockUntil = vi.fn((value: number) => value === 2);
          const effect = tryUntil({
            try: mockThunk,
            until: (value: number): value is number => mockUntil(value),
            sleepDuration: Duration.millis(100),
            maxDuration,
          });
          expect(mockThunk.mock.calls).toStrictEqual([[]]);
          expect(mockUntil.mock.calls).toStrictEqual([[1]]);
          const fiber = yield* Effect.forkChild(Effect.exit(effect));
          if (Duration.isGreaterThan(maxDuration, Duration.zero)) {
            yield* TestClock.adjust("49 millis");
            expect(fiber.pollUnsafe()).toBeUndefined();
            expect(mockThunk.mock.calls).toStrictEqual([[]]);
            expect(mockUntil.mock.calls).toStrictEqual([[1]]);
          }
          yield* TestClock.adjust(boundaryTick);
          expect(fiber.pollUnsafe()).toBeDefined();
          const exit = yield* Fiber.join(fiber);
          expect(Exit.isFailure(exit)).toBe(true);
          if (Exit.isFailure(exit)) {
            expect(exit.cause.reasons).toHaveLength(1);
            const reason = exit.cause.reasons.find(Cause.isFailReason);
            expect(reason?.error).toBeInstanceOf(Cause.TimeoutError);
            expect(reason?.error.message).toBe(
              `Timed out after ${label} waiting for value to pass predicate`,
            );
          }
          expect(mockThunk.mock.calls).toStrictEqual([[]]);
          expect(mockUntil.mock.calls).toStrictEqual([[1]]);
          yield* TestClock.adjust("2 seconds");
          expect(mockThunk.mock.calls).toStrictEqual([[]]);
          expect(mockUntil.mock.calls).toStrictEqual([[1]]);
        }
      }),
    );

    test.each(["try", "until"])(
      "initial %s throws synchronously",
      (callback) => {
        const error = new Error(`${callback} threw`);
        const mockThunk = vi.fn(() => 1);
        const mockUntil = vi.fn((value: number) => value === 2);
        const throwError = () => {
          throw error;
        };
        const throwingCallback = callback === "try" ? mockThunk : mockUntil;
        throwingCallback.mockImplementationOnce(throwError);
        const construct = vi.fn(() =>
          tryUntil({
            try: mockThunk,
            until: (value: number): value is number => mockUntil(value),
            maxDuration: Duration.seconds(1),
          }),
        );

        expect(construct).toThrow(error);
        expect(construct.mock.results[0]?.value).toBe(error);
        expect(mockThunk.mock.calls).toStrictEqual([[]]);
        expect(mockUntil.mock.calls).toStrictEqual(
          callback === "try" ? [] : [[1]],
        );
      },
    );

    it.effect("delayed try and until throws are execution defects", () =>
      Effect.gen(function* () {
        for (const callback of ["try", "until"]) {
          const error = new Error(`${callback} threw`);
          const mockThunk = vi
            .fn<() => number>()
            .mockReturnValueOnce(1)
            .mockReturnValue(2);
          const mockUntil = vi.fn((value: number) => value === 3);
          const effect = tryUntil({
            try: mockThunk,
            until: (value: number): value is number => mockUntil(value),
            sleepDuration: Duration.millis(100),
            maxDuration: Duration.seconds(1),
          });
          const throwError = () => {
            throw error;
          };
          const throwingCallback = callback === "try" ? mockThunk : mockUntil;
          throwingCallback.mockImplementationOnce(throwError);
          expect(mockThunk.mock.calls).toStrictEqual([[]]);
          expect(mockUntil.mock.calls).toStrictEqual([[1]]);
          const fiber = yield* Effect.forkChild(Effect.exit(effect));
          yield* TestClock.adjust("99 millis");
          expect(fiber.pollUnsafe()).toBeUndefined();
          expect(mockThunk.mock.calls).toStrictEqual([[]]);
          expect(mockUntil.mock.calls).toStrictEqual([[1]]);
          yield* TestClock.adjust("1 millis");
          expect(fiber.pollUnsafe()).toBeDefined();
          const exit = yield* Fiber.join(fiber);
          expect(Exit.isFailure(exit)).toBe(true);
          if (Exit.isFailure(exit)) {
            expect(exit.cause.reasons).toHaveLength(1);
            expect(exit.cause.reasons.find(Cause.isDieReason)?.defect).toBe(
              error,
            );
          }
          expect(mockThunk.mock.calls).toStrictEqual([[], []]);
          expect(mockUntil.mock.calls).toStrictEqual(
            callback === "try" ? [[1]] : [[1], [2]],
          );
          yield* TestClock.adjust("2 seconds");
          expect(mockThunk.mock.calls).toStrictEqual([[], []]);
          expect(mockUntil.mock.calls).toStrictEqual(
            callback === "try" ? [[1]] : [[1], [2]],
          );
        }
      }),
    );

    test("an undefined try callback throws synchronously", () => {
      const mockUntil = vi.fn(Predicate.isString);
      expect(() =>
        tryUntil({
          // @ts-expect-error - undefined cannot be called as the required try thunk
          try: undefined,
          until: (value: unknown): value is string => mockUntil(value),
          maxDuration: Duration.seconds(1),
        }),
      ).toThrow(TypeError);
      expect(mockUntil).not.toHaveBeenCalled();
    });

    it.effect("value that immediately matches", () =>
      Effect.gen(function* () {
        const mockThunk = vi.fn<() => number>().mockReturnValue(1);
        const mockUntil = vi.fn((value: number) => value === 1);
        const effect = tryUntil({
          try: mockThunk,
          until: (value: number): value is number => mockUntil(value),
          sleepDuration: Duration.millis(100),
          maxDuration: Duration.seconds(1),
        });

        // Both callbacks have already run before the effect is executed.
        expect(mockThunk).toHaveBeenCalledTimes(1);
        expect(mockThunk).toHaveBeenNthCalledWith(1);
        expect(mockUntil.mock.calls).toStrictEqual([[1]]);

        expect(yield* effect).toBe(1);
        expect(yield* effect).toBe(1);
        expect(mockThunk).toHaveBeenCalledTimes(1);
        expect(mockUntil.mock.calls).toStrictEqual([[1]]);
        yield* TestClock.adjust("2 seconds");
        expect(mockThunk).toHaveBeenCalledTimes(1);
        expect(mockUntil.mock.calls).toStrictEqual([[1]]);
      }),
    );

    it.effect("value that eventually matches", () =>
      Effect.gen(function* () {
        const mockThunk = vi
          .fn<() => number>()
          .mockReturnValueOnce(1)
          .mockReturnValueOnce(2)
          .mockReturnValueOnce(3)
          .mockReturnValue(-1);
        const mockUntil = vi.fn((value: number) => value === 3);
        const effect = tryUntil({
          try: mockThunk,
          until: (value: number): value is number => mockUntil(value),
          sleepDuration: Duration.millis(100),
          maxDuration: Duration.seconds(1),
        });
        expect(mockThunk).toHaveBeenCalledTimes(1);
        expect(mockUntil.mock.calls).toStrictEqual([[1]]);

        // Construction starts neither the delay nor the timeout.
        yield* TestClock.adjust("2 seconds");
        expect(mockThunk).toHaveBeenCalledTimes(1);
        expect(mockUntil.mock.calls).toStrictEqual([[1]]);
        const fiber = yield* Effect.forkChild(effect);
        yield* TestClock.adjust("99 millis");
        expect(fiber.pollUnsafe()).toBeUndefined();
        expect(mockThunk).toHaveBeenCalledTimes(1);
        expect(mockThunk).toHaveBeenNthCalledWith(1);
        expect(mockUntil.mock.calls).toStrictEqual([[1]]);

        yield* TestClock.adjust("1 millis");
        expect(fiber.pollUnsafe()).toBeUndefined();
        expect(mockThunk).toHaveBeenCalledTimes(2);
        expect(mockThunk).toHaveBeenNthCalledWith(2);
        expect(mockUntil.mock.calls).toStrictEqual([[1], [2]]);

        yield* TestClock.adjust("99 millis");
        expect(fiber.pollUnsafe()).toBeUndefined();
        expect(mockThunk).toHaveBeenCalledTimes(2);
        expect(mockUntil.mock.calls).toStrictEqual([[1], [2]]);

        yield* TestClock.adjust("1 millis");
        expect(fiber.pollUnsafe()).toStrictEqual(Exit.succeed(3));
        expect(yield* Fiber.join(fiber)).toBe(3);
        expect(mockThunk).toHaveBeenCalledTimes(3);
        expect(mockThunk).toHaveBeenNthCalledWith(3);
        expect(mockUntil.mock.calls).toStrictEqual([[1], [2], [3]]);
        yield* TestClock.adjust("2 seconds");
        expect(mockThunk.mock.calls).toStrictEqual([[], [], []]);
        expect(mockUntil.mock.calls).toStrictEqual([[1], [2], [3]]);
      }),
    );

    it.effect("value that never matches and times out", () =>
      Effect.gen(function* () {
        const mockThunk = vi.fn<() => number>().mockReturnValue(1);

        const mockUntil = vi.fn((value: number) => value === 2);

        // Fork the effect so we can control when it runs
        const fiber = yield* Effect.forkChild(
          tryUntil({
            try: mockThunk,
            until: (value: number): value is number => mockUntil(value),
            sleepDuration: Duration.millis(100),
            maxDuration: Duration.seconds(1),
          }).pipe(Effect.exit),
        );

        // Check that the effect is running
        const pollAfterStart = Option.fromNullishOr(fiber.pollUnsafe());
        expect(pollAfterStart._tag).toBe("None");
        expect(mockThunk).toHaveBeenCalledTimes(1); // Immediate call
        expect(mockThunk).toHaveBeenNthCalledWith(1);
        expect(mockUntil.mock.calls).toStrictEqual([[1]]);

        // Advance time halfway through maxDuration
        // Check that the effect is still running (hasn't timed out yet)
        yield* TestClock.adjust("500 millis");
        const pollAfterHalfway = Option.fromNullishOr(fiber.pollUnsafe());
        expect(pollAfterHalfway._tag).toBe("None");
        expect(mockThunk).toHaveBeenCalledTimes(6); // Immediate call + 5 sleep calls
        expect(mockThunk).toHaveBeenNthCalledWith(2);
        expect(mockThunk).toHaveBeenNthCalledWith(3);
        expect(mockThunk).toHaveBeenNthCalledWith(4);
        expect(mockThunk).toHaveBeenNthCalledWith(5);
        expect(mockThunk).toHaveBeenNthCalledWith(6);
        expect(mockUntil.mock.calls).toStrictEqual([
          [1],
          [1],
          [1],
          [1],
          [1],
          [1],
        ]);

        yield* TestClock.adjust("499 millis");
        expect(fiber.pollUnsafe()).toBeUndefined();
        expect(mockThunk).toHaveBeenCalledTimes(10);
        expect(mockUntil).toHaveBeenCalledTimes(10);
        yield* TestClock.adjust("1 millis");
        const pollAfterTimeout = Option.fromNullishOr(fiber.pollUnsafe());
        expect(pollAfterTimeout._tag).toBe("Some");
        // `Effect.timeout` interrupts at the deadline, so the final delay
        // preempts the next evaluation. There are ten calls: one immediate
        // evaluation followed by nine evaluations after delay ticks.
        expect(mockThunk).toHaveBeenCalledTimes(10);
        expect(mockThunk).toHaveBeenNthCalledWith(7);
        expect(mockThunk).toHaveBeenNthCalledWith(8);
        expect(mockThunk).toHaveBeenNthCalledWith(9);
        expect(mockThunk).toHaveBeenNthCalledWith(10);

        // Assert the final return value
        const exit = yield* Fiber.join(fiber);
        expect(exit._tag).toBe("Failure");
        if (exit._tag === "Failure") {
          expect(exit.cause.reasons).toHaveLength(1);
          const failReason = exit.cause.reasons.find(Cause.isFailReason);
          expect(failReason?.error).toBeInstanceOf(Cause.TimeoutError);
          expect(failReason?.error.message).toBe(
            "Timed out after 1s waiting for value to pass predicate",
          );
        }
        // See note above — v4's `Effect.timeout` preempts the final tick.
        expect(mockThunk).toHaveBeenCalledTimes(10);
        yield* TestClock.adjust("2 seconds");
        expect(mockThunk.mock.calls).toStrictEqual(
          Array.from({ length: 10 }, () => []),
        );
        expect(mockUntil.mock.calls).toStrictEqual(
          Array.from({ length: 10 }, () => [1]),
        );
      }),
    );
  });
});
