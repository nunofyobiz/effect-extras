/**
 * Generic, framework-agnostic extensions to Effect's `Effect` module.
 *
 * @since 0.0.0
 */
import { Cause, Duration, Effect, Option, Predicate } from "effect";
import { dual } from "effect/Function";

/**
 * The duration of time a user registers something as "instant" — used as the
 * default poll interval for {@link tryUntil}. 200ms is the generally agreed
 * value. See https://psychology.stackexchange.com/a/1680
 */
const USER_INSTANT_DURATION = Duration.millis(200);

/**
 * Requires a value from an effectful optional lookup, failing with `onNone()`
 * when the lookup returns `None`. Use it when a missing value should stop the
 * computation rather than remain optional.
 *
 * When the wrapped `Option` is `Some(value)` the effect succeeds with `value`;
 * when it is `None` the effect fails with the error produced by the `onNone`
 * thunk. `onNone` runs only when a `None` result is executed, once per execution;
 * it is not called during construction, for `Some`, or for a source failure.
 * Existing source failures are preserved. A throwing `onNone` becomes an
 * execution defect rather than a typed failure.
 *
 * @example
 * ```ts
 * import { Effect, Option, Result } from "effect"
 * import { EffectX } from "@nunofyobiz/effect-extras"
 *
 * // A saved theme becomes a required setting without changing its value.
 * const theme = EffectX.flattenOption(
 *   Effect.succeed(Option.some("dark")),
 *   () => "No saved theme",
 * )
 * assert.deepStrictEqual(Effect.runSync(Effect.result(theme)), Result.succeed("dark"))
 *
 * // A missing setting produces the chosen error only when the effect runs.
 * const missingTheme = EffectX.flattenOption(
 *   Effect.succeed(Option.none<string>()),
 *   () => "No saved theme",
 * )
 * assert.deepStrictEqual(
 *   Effect.runSync(Effect.result(missingTheme)),
 *   Result.fail("No saved theme"),
 * )
 * ```
 *
 * @category sequencing
 * @since 0.0.0
 */
export const flattenOption = dual<
  <A, E1, E2, R>(
    onNone: () => E2,
  ) => (
    effect: Effect.Effect<Option.Option<A>, E1, R>,
  ) => Effect.Effect<A, E1 | E2, R>,
  <A, E1, E2, R>(
    effect: Effect.Effect<Option.Option<A>, E1, R>,
    onNone: () => E2,
  ) => Effect.Effect<A, E1 | E2, R>
>(
  2,
  <A, E1, E2, R>(
    effect: Effect.Effect<Option.Option<A>, E1, R>,
    onNone: () => E2,
  ): Effect.Effect<A, E1 | E2, R> =>
    Effect.flatMap(effect, (option) => Effect.fromOption(option, onNone)),
);

/**
 * Converts an `Option` to an `Effect`, mapping the `None` case to a caller-chosen
 * error via the `onNone` thunk.
 *
 * @example
 * ```ts
 * import { Effect, Option, Result } from "effect"
 *
 * const some = Effect.fromOption(Option.some(42), () => "missing")
 * assert.deepStrictEqual(Effect.runSync(Effect.result(some)), Result.succeed(42))
 *
 * const none = Effect.fromOption(Option.none<number>(), () => "missing")
 * assert.deepStrictEqual(
 *   Effect.runSync(Effect.result(none)),
 *   Result.fail("missing"),
 * )
 * ```
 *
 * @deprecated Use `Effect.fromOption(option, onNone)` instead. Starting with this
 * release, `onNone` runs once when constructing a `None` effect, rather than on
 * every execution.
 * @category conversions
 * @since 0.0.0
 */
export const fromOptionOrElse: {
  <E>(onNone: () => E): <A>(option: Option.Option<A>) => Effect.Effect<A, E>;
  <A, E>(option: Option.Option<A>, onNone: () => E): Effect.Effect<A, E>;
} = dual(
  2,
  <A, E>(option: Option.Option<A>, onNone: () => E): Effect.Effect<A, E> =>
    Effect.fromOption(option, onNone),
);

/**
 * Reads a synchronous value until it becomes usable, returning the value
 * narrowed by `until`. Use it to wait for a non-effectful condition, such as a
 * value saved by a callback.
 *
 * Both `try` and `until` run immediately when this helper is called. If the
 * first value matches, the returned effect succeeds with that captured value
 * on every execution without polling. Otherwise, each execution starts the
 * timeout and delayed attempts, spaced by `sleepDuration` (200ms by default).
 * Polling stops on a match or fails with `Cause.TimeoutError` at `maxDuration`.
 * Callback throws during the initial attempt escape synchronously; throws
 * during delayed attempts become execution defects, not timeout failures.
 *
 * @example
 * ```ts
 * import { Duration, Effect, Predicate } from "effect"
 * import { EffectX } from "@nunofyobiz/effect-extras"
 *
 * // The display name is already saved, so construction captures it immediately.
 * const readSavedName = (): string | undefined => "Sam"
 * const displayName = EffectX.tryUntil({
 *   try: readSavedName,
 *   until: Predicate.isString,
 *   maxDuration: Duration.seconds(1),
 * })
 *
 * // Reusing the effect returns the captured name without reading or waiting again.
 * assert.deepStrictEqual(Effect.runSync(displayName), "Sam")
 * assert.deepStrictEqual(Effect.runSync(displayName), "Sam")
 * ```
 *
 * @category sequencing
 * @since 0.0.0
 */
export const tryUntil = <A, B extends A>({
  try: doTry,
  until: isDone,
  sleepDuration = USER_INSTANT_DURATION,
  maxDuration,
}: {
  try: () => A;
  until: Predicate.Refinement<A, B>;
  sleepDuration?: Duration.Duration;
  maxDuration: Duration.Duration;
}): Effect.Effect<B, Cause.TimeoutError, never> => {
  const immediateValue = doTry();
  if (isDone(immediateValue)) {
    return Effect.succeed(immediateValue);
  }

  // Continually call it again on a schedule with a delay
  return Effect.sync(doTry).pipe(
    // Sleep in between each attempt
    Effect.delay(sleepDuration),

    // Keep doing this until the predicate passes
    Effect.repeat({ until: isDone }),

    // Until a timeout occurs. In v4, `Effect.timeout` raises `TimeoutError`
    // on its own — no separate `timeoutFail` overload is needed.
    Effect.timeout(maxDuration),
    Effect.catchTag("TimeoutError", () =>
      Effect.fail(
        new Cause.TimeoutError(
          `Timed out after ${Duration.format(maxDuration)} waiting for value to pass predicate`,
        ),
      ),
    ),
  );
};
