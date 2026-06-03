import { Cause, Duration, Effect, Option, Predicate, pipe } from "effect";
import { dual } from "effect/Function";

/**
 * The duration of time a user registers something as "instant" — used as the
 * default poll interval for {@link tryUntil}. 200ms is the generally agreed
 * value. See https://psychology.stackexchange.com/a/1680
 */
const USER_INSTANT_DURATION = Duration.millis(200);

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
    Effect.flatMap(effect, (option) =>
      pipe(Effect.fromOption(option), Effect.mapError(onNone)),
    ),
);

/**
 * Converts an {@link Option} to an {@link Effect}, mapping the `None` case to
 * a domain-specific error via the `onNone` thunk.
 *
 * Bridges the gap in v4 where `Effect.mapError` no longer accepts `Option`
 * directly: instead of writing
 *
 * ```ts
 * pipe(option, Effect.fromOption, Effect.mapError(() => new MyError()))
 * ```
 *
 * write
 *
 * ```ts
 * pipe(option, EffectX.fromOptionOrElse(() => new MyError()))
 * ```
 *
 * Equivalent to
 * `Effect.mapError(Effect.fromOption(option), onNone)` — bridges the
 * `NoSuchElementError` produced by `Effect.fromOption` to the caller's domain
 * error type so callers never see `NoSuchElementError`.
 */
export const fromOptionOrElse: {
  <E>(onNone: () => E): <A>(option: Option.Option<A>) => Effect.Effect<A, E>;
  <A, E>(option: Option.Option<A>, onNone: () => E): Effect.Effect<A, E>;
} = dual(
  2,
  <A, E>(option: Option.Option<A>, onNone: () => E): Effect.Effect<A, E> =>
    pipe(Effect.fromOption(option), Effect.mapError(onNone)),
);

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
