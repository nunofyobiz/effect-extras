import {
  Data,
  Duration,
  Effect,
  Fiber,
  Option,
  Predicate,
  Result,
  pipe,
} from "effect";
import * as TestClock from "effect/testing/TestClock";
import { describe, expect, vi } from "vitest";
import { it } from "@effect/vitest";
import { flattenOption, fromOptionOrElse, tryUntil } from "./EffectX";

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
  });

  describe("fromOptionOrElse", () => {
    class CustomError extends Data.TaggedError("CustomError")<{
      readonly reason: string;
    }> {}

    describe("data-first form", () => {
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
          let callCount = 0;
          const onNone = () => {
            callCount = callCount + 1;
            return "missing";
          };

          // Some case: onNone should NOT be called
          yield* fromOptionOrElse(Option.some("hello"), onNone).pipe(
            Effect.result,
          );
          expect(callCount).toBe(0);

          // None case: onNone should be called exactly once
          yield* fromOptionOrElse(Option.none<string>(), onNone).pipe(
            Effect.result,
          );
          expect(callCount).toBe(1);
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
    it.effect("value that immediately matches", () =>
      Effect.gen(function* () {
        const mockThunk = vi.fn<() => number>().mockReturnValue(1);

        // Fork the effect so we can control when it runs
        const fiber = yield* Effect.forkChild(
          tryUntil({
            try: mockThunk,
            until: (v: number) => v === 1,
            sleepDuration: Duration.millis(100),
            maxDuration: Duration.seconds(1),
          }),
        );

        // Check that the effect is running
        const pollAfterStart = Option.fromNullishOr(fiber.pollUnsafe());
        expect(pollAfterStart._tag).toBe("None");
        expect(mockThunk).toHaveBeenCalledTimes(1); // Immediate call

        // Advance time by one sleep duration to let the effect complete
        // Check that the effect is completed
        yield* TestClock.adjust("100 millis");
        const pollAfterFirstSleep = Option.fromNullishOr(fiber.pollUnsafe());
        expect(pollAfterFirstSleep._tag).toBe("Some");
        expect(mockThunk).toHaveBeenCalledTimes(1); // Still only 1 call since it matched immediately
        expect(mockThunk).toHaveBeenNthCalledWith(1);

        // Assert the final return value
        const result = yield* Fiber.join(fiber);
        expect(result).toBe(1);
        expect(mockThunk).toHaveBeenCalledTimes(1);
        expect(mockThunk).toHaveBeenNthCalledWith(1);
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

        // Fork the effect so we can control when it runs
        const fiber = yield* Effect.forkChild(
          tryUntil({
            try: mockThunk,
            until: (v: number) => v === 3,
            sleepDuration: Duration.millis(100),
            maxDuration: Duration.seconds(1),
          }),
        );

        // Check that the effect is running
        const pollAfterStart = Option.fromNullishOr(fiber.pollUnsafe());
        expect(pollAfterStart._tag).toBe("None");
        expect(mockThunk).toHaveBeenCalledTimes(1); // Immediate call
        expect(mockThunk).toHaveBeenNthCalledWith(1);

        // Advance time by one sleep duration
        // Check that the effect is still running (hasn't completed yet)
        yield* TestClock.adjust("100 millis");
        const pollAfterFirstSleep = Option.fromNullishOr(fiber.pollUnsafe());
        expect(pollAfterFirstSleep._tag).toBe("None");
        expect(mockThunk).toHaveBeenCalledTimes(2); // Immediate call + first sleep
        expect(mockThunk).toHaveBeenNthCalledWith(2);

        // Advance time enough to get to the third value (which matches)
        yield* TestClock.adjust("200 millis");
        const pollAfterSecondSleep = Option.fromNullishOr(fiber.pollUnsafe());
        expect(pollAfterSecondSleep._tag).toBe("Some");
        expect(mockThunk).toHaveBeenCalledTimes(3); // Immediate call + first sleep + second sleep
        expect(mockThunk).toHaveBeenNthCalledWith(3);

        // Assert the final return value
        const result = yield* Fiber.join(fiber);
        expect(result).toBe(3);
        expect(mockThunk).toHaveBeenCalledTimes(3);
        expect(mockThunk).toHaveBeenNthCalledWith(1);
        expect(mockThunk).toHaveBeenNthCalledWith(2);
        expect(mockThunk).toHaveBeenNthCalledWith(3);
      }),
    );

    it.effect("value that never matches and times out", () =>
      Effect.gen(function* () {
        const mockThunk = vi.fn<() => number>().mockReturnValue(1);

        // Never matches — hardcoded false so the value never passes the
        // predicate and tryUntil always times out. The parameter is unused by
        // design (the body is a constant), which the type-predicate signature
        // still requires us to name.
        const predicate: Predicate.Refinement<number, number> = (
          // eslint-disable-next-line @typescript-eslint/no-unused-vars -- parameter named only to satisfy the `_ is number` type predicate
          _: number,
        ): _ is number => false;

        // Fork the effect so we can control when it runs
        const fiber = yield* Effect.forkChild(
          tryUntil({
            try: mockThunk,
            until: predicate,
            sleepDuration: Duration.millis(100),
            maxDuration: Duration.seconds(1),
          }),
        );

        // Check that the effect is running
        const pollAfterStart = Option.fromNullishOr(fiber.pollUnsafe());
        expect(pollAfterStart._tag).toBe("None");
        expect(mockThunk).toHaveBeenCalledTimes(1); // Immediate call
        expect(mockThunk).toHaveBeenNthCalledWith(1);

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

        // Advance time to exceed maxDuration
        // Check that the effect has now completed (timed out)
        yield* TestClock.adjust("600 millis");
        const pollAfterTimeout = Option.fromNullishOr(fiber.pollUnsafe());
        expect(pollAfterTimeout._tag).toBe("Some");
        // V4 note: this used to be 11 (immediate + 10 sleeps) under v3's
        // `Effect.timeoutFail`. v4's `Effect.timeout` interrupts at exactly
        // the deadline, so the 11th tick is preempted and we see 10 calls
        // (immediate + 9 sleeps). The timeout behavior is the same; the
        // final tick was a coincidental side effect of v3's scheduling.
        expect(mockThunk).toHaveBeenCalledTimes(10);
        expect(mockThunk).toHaveBeenNthCalledWith(7);
        expect(mockThunk).toHaveBeenNthCalledWith(8);
        expect(mockThunk).toHaveBeenNthCalledWith(9);
        expect(mockThunk).toHaveBeenNthCalledWith(10);

        // Assert the final return value
        const exit = yield* Effect.exit(Fiber.join(fiber));
        expect(exit._tag).toBe("Failure");
        if (exit._tag === "Failure") {
          // V4: Cause exposes failures via `cause.reasons` (array of Reason).
          // Pull out the Fail reason and assert its error message.
          const failReason = exit.cause.reasons.find(
            (r): r is Extract<typeof r, { readonly _tag: "Fail" }> =>
              r._tag === "Fail",
          );
          expect(failReason).toBeDefined();
          expect(failReason?.error).toMatchObject({
            message: expect.stringContaining(
              "Timed out after 1s waiting for value to pass predicate",
            ),
          });
        }
        // See note above — v4's `Effect.timeout` preempts the final tick.
        expect(mockThunk).toHaveBeenCalledTimes(10);
      }),
    );
  });
});
