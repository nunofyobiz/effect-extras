/**
 * The `WarnResult` data type — a result that may carry a success value and/or
 * warnings, where both sides are optional but never both absent.
 *
 * @since 0.0.0
 */
import { Data, Effect, Option, Predicate, Struct, pipe } from "effect";
import { constUndefined, identity } from "effect/Function";

/**
 * A result that may come with a success value and may come with warnings — both
 * are optional, but never both absent.
 *
 * Where `Result<A, E>` models an exclusive choice (success _or_ failure),
 * `WarnResult` is an "inclusive or": the success value and the warnings can each
 * be present independently. It is a tagged enum with three constructors:
 * `SuccessOnly` (only a `success` value), `WarningsOnly` (only `warnings`), and
 * `SuccessWithWarnings` (both). Reach for it when an operation can succeed, warn,
 * or do both at once — e.g. a parse that yields a value _and_ a list of warnings,
 * or that only produces warnings.
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 *
 * const both: WarnResult.WarnResult<string, number> =
 *   WarnResult.SuccessWithWarnings({
 *     warnings: "rounded down",
 *     success: 1
 *   })
 *
 * assert.deepStrictEqual(both._tag, "SuccessWithWarnings")
 * ```
 *
 * @category models
 * @since 0.0.0
 */
export type WarnResult<W, A> = Data.TaggedEnum<{
  WarningsOnly: {
    readonly warnings: W;
  };

  SuccessOnly: {
    readonly success: A;
  };

  SuccessWithWarnings: {
    readonly warnings: W;
    readonly success: A;
  };
}>;

/**
 * The `WarningsOnly` member of `WarnResult` — a result that carries only
 * `warnings` and no `success` value.
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 *
 * const value: WarnResult.WarningsOnly<string> = WarnResult.WarningsOnly({
 *   warnings: "skipped 2 rows"
 * })
 *
 * assert.deepStrictEqual(value.warnings, "skipped 2 rows")
 * ```
 *
 * @category models
 * @since 0.0.0
 */
export type WarningsOnly<W> = WarnResult<W, never> & {
  _tag: "WarningsOnly";
};

/**
 * The `SuccessOnly` member of `WarnResult` — a result that carries only a
 * `success` value and no `warnings`.
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 *
 * const value: WarnResult.SuccessOnly<number> = WarnResult.SuccessOnly({
 *   success: 1
 * })
 *
 * assert.deepStrictEqual(value.success, 1)
 * ```
 *
 * @category models
 * @since 0.0.0
 */
export type SuccessOnly<A> = WarnResult<never, A> & {
  _tag: "SuccessOnly";
};

/**
 * The `SuccessWithWarnings` member of `WarnResult` — a result that carries both a
 * `success` value and `warnings`.
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 *
 * const value: WarnResult.SuccessWithWarnings<string, number> =
 *   WarnResult.SuccessWithWarnings({
 *     warnings: "rounded down",
 *     success: 1
 *   })
 *
 * assert.deepStrictEqual(value, {
 *   _tag: "SuccessWithWarnings",
 *   warnings: "rounded down",
 *   success: 1
 * })
 * ```
 *
 * @category models
 * @since 0.0.0
 */
export type SuccessWithWarnings<W, A> = WarnResult<W, A> & {
  _tag: "SuccessWithWarnings";
};

/**
 * Any `WarnResult` that is guaranteed to carry `warnings` — either `WarningsOnly`
 * or `SuccessWithWarnings`.
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 *
 * const value: WarnResult.WithWarnings<string, number> = WarnResult.WarningsOnly({
 *   warnings: "skipped 2 rows"
 * })
 *
 * assert.deepStrictEqual(value.warnings, "skipped 2 rows")
 * ```
 *
 * @category models
 * @since 0.0.0
 */
export type WithWarnings<W, A> = WarningsOnly<W> | SuccessWithWarnings<W, A>;

/**
 * Any `WarnResult` that is guaranteed to carry a `success` value — either
 * `SuccessOnly` or `SuccessWithWarnings`.
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 *
 * const value: WarnResult.WithSuccess<string, number> = WarnResult.SuccessOnly({
 *   success: 1
 * })
 *
 * assert.deepStrictEqual(value.success, 1)
 * ```
 *
 * @category models
 * @since 0.0.0
 */
export type WithSuccess<W, A> = SuccessOnly<A> | SuccessWithWarnings<W, A>;

interface WarnResultDefinition extends Data.TaggedEnum.WithGenerics<2> {
  readonly taggedEnum: WarnResult<this["A"], this["B"]>;
}

const taggedEnum = Data.taggedEnum<WarnResultDefinition>();

/**
 * Constructs a `WarningsOnly` — a `WarnResult` that carries only `warnings`.
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 *
 * const value = WarnResult.WarningsOnly({ warnings: "skipped 2 rows" })
 *
 * assert.deepStrictEqual(value._tag, "WarningsOnly")
 * assert.deepStrictEqual(value.warnings, "skipped 2 rows")
 * ```
 *
 * @category constructors
 * @since 0.0.0
 */
export const WarningsOnly = taggedEnum.WarningsOnly;

/**
 * Constructs a `SuccessOnly` — a `WarnResult` that carries only a `success` value.
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 *
 * const value = WarnResult.SuccessOnly({ success: 1 })
 *
 * assert.deepStrictEqual(value._tag, "SuccessOnly")
 * assert.deepStrictEqual(value.success, 1)
 * ```
 *
 * @category constructors
 * @since 0.0.0
 */
export const SuccessOnly = taggedEnum.SuccessOnly;

/**
 * Constructs a `SuccessWithWarnings` — a `WarnResult` that carries both a
 * `success` value and `warnings`.
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 *
 * const value = WarnResult.SuccessWithWarnings({
 *   warnings: "rounded down",
 *   success: 1
 * })
 *
 * assert.deepStrictEqual(value._tag, "SuccessWithWarnings")
 * assert.deepStrictEqual(value.warnings, "rounded down")
 * assert.deepStrictEqual(value.success, 1)
 * ```
 *
 * @category constructors
 * @since 0.0.0
 */
export const SuccessWithWarnings = taggedEnum.SuccessWithWarnings;

/**
 * Builds per-tag refinements for `WarnResult`. `is("WarningsOnly")` is a type
 * guard that narrows a `WarnResult` to its `WarningsOnly` member, and likewise for
 * `"SuccessOnly"` and `"SuccessWithWarnings"`.
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 *
 * assert.deepStrictEqual(
 *   WarnResult.is("WarningsOnly")(WarnResult.WarningsOnly({ warnings: "w" })),
 *   true
 * )
 * assert.deepStrictEqual(
 *   WarnResult.is("WarningsOnly")(WarnResult.SuccessOnly({ success: 1 })),
 *   false
 * )
 * ```
 *
 * @category guards
 * @since 0.0.0
 */
export const is = taggedEnum.$is;

/**
 * Folds a `WarnResult` over its three tags. Provide a handler for `WarningsOnly`,
 * `SuccessOnly`, and `SuccessWithWarnings` and `match` returns a function from a
 * `WarnResult` to the handlers' common result type.
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 *
 * const describe = WarnResult.match({
 *   WarningsOnly: ({ warnings }) => `warnings ${warnings}`,
 *   SuccessOnly: ({ success }) => `success ${success}`,
 *   SuccessWithWarnings: ({ warnings, success }) => `both ${warnings}/${success}`
 * })
 *
 * assert.deepStrictEqual(
 *   describe(WarnResult.SuccessWithWarnings({ warnings: "w", success: 1 })),
 *   "both w/1"
 * )
 * ```
 *
 * @category pattern matching
 * @since 0.0.0
 */
export const match = taggedEnum.$match;

/**
 * Builds a `WarnResult` known to carry `warnings`, choosing `SuccessWithWarnings`
 * when a `success` value is present and `WarningsOnly` otherwise.
 *
 * Use it when the `warnings` are mandatory and the `success` value is an optional
 * companion: pass an absent (`null`/`undefined`) `success` to get a
 * `WarningsOnly`, or a present one to get a `SuccessWithWarnings`. The return type
 * `WithWarnings<W, A>` reflects that `warnings` are always present.
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 *
 * assert.deepStrictEqual(
 *   WarnResult.WithWarnings({ warnings: "w", success: 1 }),
 *   WarnResult.SuccessWithWarnings({ warnings: "w", success: 1 })
 * )
 *
 * assert.deepStrictEqual(
 *   WarnResult.WithWarnings({ warnings: "w" }),
 *   WarnResult.WarningsOnly({ warnings: "w" })
 * )
 * ```
 *
 * @category constructors
 * @since 0.0.0
 */
export const WithWarnings = <W, A>({
  warnings,
  success,
}: {
  warnings: W;
  success?: A | undefined;
}): WithWarnings<W, A> =>
  Predicate.isNotNullish(success)
    ? SuccessWithWarnings({ warnings, success })
    : WarningsOnly({ warnings });

/**
 * Builds a `WarnResult` known to carry a `success` value, choosing
 * `SuccessWithWarnings` when `warnings` are present and `SuccessOnly` otherwise.
 *
 * The mirror of `WithWarnings`: the `success` value is mandatory and the
 * `warnings` are an optional companion. Pass absent (`null`/`undefined`)
 * `warnings` to get a `SuccessOnly`, or present ones to get a
 * `SuccessWithWarnings`. The return type `WithSuccess<W, A>` reflects that a
 * `success` value is always present.
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 *
 * assert.deepStrictEqual(
 *   WarnResult.WithSuccess({ warnings: "w", success: 1 }),
 *   WarnResult.SuccessWithWarnings({ warnings: "w", success: 1 })
 * )
 *
 * assert.deepStrictEqual(
 *   WarnResult.WithSuccess({ success: 1 }),
 *   WarnResult.SuccessOnly({ success: 1 })
 * )
 * ```
 *
 * @category constructors
 * @since 0.0.0
 */
export const WithSuccess = <W, A>({
  warnings,
  success,
}: {
  warnings?: W | undefined;
  success: A;
}): WithSuccess<W, A> =>
  Predicate.isNotNullish(warnings)
    ? SuccessWithWarnings({ warnings, success })
    : SuccessOnly({ success });

/**
 * Builds a `WarnResult` from a pair of possibly-nullish inputs, wrapping the
 * result in an `Option` so the all-absent case is expressible.
 *
 * Returns `Option.some(SuccessWithWarnings)` when both are present,
 * `Option.some(WarningsOnly)` or `Option.some(SuccessOnly)` when exactly one is
 * present, and `Option.none()` when both are nullish. Use it as the total entry
 * point for turning an optional success value and optional warnings into a
 * `WarnResult`.
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 * import { Option } from "effect"
 *
 * assert.deepStrictEqual(
 *   WarnResult.optionFromNullables({ warnings: "w", success: 1 }),
 *   Option.some(WarnResult.SuccessWithWarnings({ warnings: "w", success: 1 }))
 * )
 *
 * assert.deepStrictEqual(
 *   WarnResult.optionFromNullables({ warnings: "w", success: null }),
 *   Option.some(WarnResult.WarningsOnly({ warnings: "w" }))
 * )
 *
 * assert.deepStrictEqual(
 *   WarnResult.optionFromNullables({ warnings: null, success: undefined }),
 *   Option.none()
 * )
 * ```
 *
 * @category constructors
 * @since 0.0.0
 */
export const optionFromNullables = <W, A>({
  warnings,
  success,
}: {
  warnings?: W | null | undefined;
  success?: A | null | undefined;
}): Option.Option<WarnResult<W, A>> => {
  if (Predicate.isNotNullish(warnings) && Predicate.isNotNullish(success)) {
    return Option.some(SuccessWithWarnings({ warnings, success }));
  }
  if (Predicate.isNotNullish(warnings)) {
    return Option.some(WarningsOnly({ warnings }));
  }
  if (Predicate.isNotNullish(success)) {
    return Option.some(SuccessOnly({ success }));
  }
  return Option.none();
};

/**
 * Builds a `WarnResult` from a pair of possibly-nullish inputs, falling back to
 * the `orElse` thunk when both are absent.
 *
 * The non-optional companion to `optionFromNullables`: it unwraps the same logic
 * but resolves the all-absent case with `orElse` instead of an `Option`. The
 * default `orElse` throws, so omit it only when at least one side is guaranteed
 * present.
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 *
 * assert.deepStrictEqual(
 *   WarnResult.fromNullables({ warnings: "w", success: 1 }),
 *   WarnResult.SuccessWithWarnings({ warnings: "w", success: 1 })
 * )
 *
 * // Both absent — fall back via orElse instead of throwing
 * assert.deepStrictEqual(
 *   WarnResult.fromNullables({
 *     warnings: null,
 *     success: null,
 *     orElse: () => WarnResult.WarningsOnly({ warnings: "none" })
 *   }),
 *   WarnResult.WarningsOnly({ warnings: "none" })
 * )
 * ```
 *
 * @category constructors
 * @since 0.0.0
 */
export const fromNullables = <W, A>({
  warnings,
  success,
  orElse = () => {
    throw new Error("Both warnings and success are nullish");
  },
}: {
  warnings?: W | null | undefined;
  success?: A | null | undefined;
  orElse?: () => WarnResult<W, A>;
}): WarnResult<W, A> =>
  pipe(optionFromNullables({ warnings, success }), Option.getOrElse(orElse));

/**
 * Folds a `WarnResult` from the warnings' perspective, collapsing the three tags
 * into two handlers.
 *
 * Both `WarningsOnly` and `SuccessWithWarnings` carry `warnings`, so they route to
 * the `Warnings` handler; only `SuccessOnly` lacks `warnings` and routes to
 * `SuccessOnly`. Use it when you care about the `warnings` and treat the
 * success-only case as the exception.
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 *
 * const onWarnings = WarnResult.matchWarnings({
 *   Warnings: (warnings: string) => `warnings ${warnings}`,
 *   SuccessOnly: (success: number) => `success ${success}`
 * })
 *
 * assert.deepStrictEqual(
 *   onWarnings(WarnResult.WarningsOnly({ warnings: "w" })),
 *   "warnings w"
 * )
 * assert.deepStrictEqual(
 *   onWarnings(WarnResult.SuccessWithWarnings({ warnings: "w", success: 1 })),
 *   "warnings w"
 * )
 * assert.deepStrictEqual(
 *   onWarnings(WarnResult.SuccessOnly({ success: 1 })),
 *   "success 1"
 * )
 * ```
 *
 * @category pattern matching
 * @since 0.0.0
 */
export const matchWarnings =
  <W, A, Z>({
    Warnings,
    SuccessOnly,
  }: {
    Warnings: (warnings: W) => Z;
    SuccessOnly: (success: A) => Z;
  }) =>
  (warnResult: WarnResult<W, A>): Z =>
    pipe(
      warnResult,

      match({
        WarningsOnly: ({ warnings }) => Warnings(warnings),
        SuccessOnly: ({ success }) => SuccessOnly(success),
        SuccessWithWarnings: ({ warnings }) => Warnings(warnings),
      }),

      // Make Typescript happy
      (a) => a as Z,
    );

/**
 * Folds a `WarnResult` from the success value's perspective, collapsing the three
 * tags into two handlers.
 *
 * The mirror of `matchWarnings`: both `SuccessOnly` and `SuccessWithWarnings`
 * carry a `success` value, so they route to the `Success` handler; only
 * `WarningsOnly` lacks a `success` value and routes to `WarningsOnly`. Use it when
 * you care about the `success` value and treat the warnings-only case as the
 * exception.
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 *
 * const onSuccess = WarnResult.matchSuccess({
 *   WarningsOnly: (warnings: string) => `warnings ${warnings}`,
 *   Success: (success: number) => `success ${success}`
 * })
 *
 * assert.deepStrictEqual(
 *   onSuccess(WarnResult.SuccessOnly({ success: 1 })),
 *   "success 1"
 * )
 * assert.deepStrictEqual(
 *   onSuccess(WarnResult.SuccessWithWarnings({ warnings: "w", success: 1 })),
 *   "success 1"
 * )
 * assert.deepStrictEqual(
 *   onSuccess(WarnResult.WarningsOnly({ warnings: "w" })),
 *   "warnings w"
 * )
 * ```
 *
 * @category pattern matching
 * @since 0.0.0
 */
export const matchSuccess =
  <W, A, Z>({
    WarningsOnly,
    Success,
  }: {
    WarningsOnly: (warnings: W) => Z;
    Success: (success: A) => Z;
  }) =>
  (warnResult: WarnResult<W, A>): Z =>
    pipe(
      warnResult,

      match({
        WarningsOnly: ({ warnings }) => WarningsOnly(warnings),
        SuccessOnly: ({ success }) => Success(success),
        SuccessWithWarnings: ({ success }) => Success(success),
      }),

      // Make Typescript happy
      (a) => a as Z,
    );

/**
 * Completes a `WarnResult` into a guaranteed `SuccessWithWarnings` by filling
 * whichever side is missing from the matching `orElse` thunk.
 *
 * A `SuccessWithWarnings` passes through unchanged; a `WarningsOnly` gains a
 * `success` value from `orElseSuccess`; a `SuccessOnly` gains `warnings` from
 * `orElseWarnings`. Use it to normalise a partial `WarnResult` into the
 * both-present shape before reading both sides.
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 *
 * const fill = WarnResult.orElse({
 *   orElseWarnings: () => "no warnings",
 *   orElseSuccess: () => 0
 * })
 *
 * assert.deepStrictEqual(
 *   fill(WarnResult.WarningsOnly({ warnings: "w" })),
 *   WarnResult.SuccessWithWarnings({ warnings: "w", success: 0 })
 * )
 * assert.deepStrictEqual(
 *   fill(WarnResult.SuccessOnly({ success: 1 })),
 *   WarnResult.SuccessWithWarnings({ warnings: "no warnings", success: 1 })
 * )
 * ```
 *
 * @category getters
 * @since 0.0.0
 */
export const orElse = <W2, A2>({
  orElseWarnings,
  orElseSuccess,
}: {
  orElseWarnings: () => W2;
  orElseSuccess: () => A2;
}): (<W, A>(
  warnResult: WarnResult<W, A>,
) => SuccessWithWarnings<W | W2, A | A2>) =>
  match({
    WarningsOnly: ({ warnings }) =>
      SuccessWithWarnings({ warnings, success: orElseSuccess() }),
    SuccessOnly: ({ success }) =>
      SuccessWithWarnings({ warnings: orElseWarnings(), success }),
    SuccessWithWarnings: ({ warnings, success }) =>
      SuccessWithWarnings({ warnings, success }),
  });

/**
 * Completes a `WarnResult` into a `SuccessWithWarnings` whose missing side is
 * filled with `undefined`.
 *
 * A specialisation of `orElse` that supplies `undefined` for whichever side is
 * absent, so the result always exposes both `warnings` and `success` keys (each
 * possibly `undefined`). Use it when you want to destructure both sides without
 * branching on the tag.
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 *
 * assert.deepStrictEqual(
 *   WarnResult.orUndefined(WarnResult.WarningsOnly({ warnings: "w" })),
 *   WarnResult.SuccessWithWarnings({ warnings: "w", success: undefined })
 * )
 * assert.deepStrictEqual(
 *   WarnResult.orUndefined(WarnResult.SuccessOnly({ success: 1 })),
 *   WarnResult.SuccessWithWarnings({ warnings: undefined, success: 1 })
 * )
 * ```
 *
 * @category getters
 * @since 0.0.0
 */
export const orUndefined = orElse({
  orElseWarnings: () => undefined,
  orElseSuccess: () => undefined,
});

/**
 * Extracts the `warnings` of a `WarnResult`, falling back to `orElseReturn` when
 * no `warnings` are present.
 *
 * `WarningsOnly` and `SuccessWithWarnings` return their `warnings`; `SuccessOnly`
 * returns the result of `orElseReturn`. Use it to read the warnings with a default
 * in one step.
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 *
 * const warningsOrNone = WarnResult.warningsOrElse(() => "no warnings")
 *
 * assert.deepStrictEqual(
 *   warningsOrNone(WarnResult.WarningsOnly({ warnings: "w" })),
 *   "w"
 * )
 * assert.deepStrictEqual(
 *   warningsOrNone(WarnResult.SuccessWithWarnings({ warnings: "w", success: 1 })),
 *   "w"
 * )
 * assert.deepStrictEqual(
 *   warningsOrNone(WarnResult.SuccessOnly({ success: 1 })),
 *   "no warnings"
 * )
 * ```
 *
 * @category getters
 * @since 0.0.0
 */
export const warningsOrElse =
  <Z>(orElseReturn: () => Z) =>
  <W, A>(warnResult: WarnResult<W, A>): W | Z =>
    pipe(
      warnResult,
      orElse({
        orElseWarnings: orElseReturn,
        orElseSuccess: constUndefined,
      }),
      Struct.get("warnings"),
    );

/**
 * Extracts the `warnings` of a `WarnResult`, returning `undefined` when no
 * `warnings` are present.
 *
 * A specialisation of `warningsOrElse` whose fallback is `undefined`:
 * `WarningsOnly` and `SuccessWithWarnings` yield their `warnings`, while
 * `SuccessOnly` yields `undefined`.
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 *
 * assert.deepStrictEqual(
 *   WarnResult.warningsOrUndefined(WarnResult.WarningsOnly({ warnings: "w" })),
 *   "w"
 * )
 * assert.deepStrictEqual(
 *   WarnResult.warningsOrUndefined(WarnResult.SuccessOnly({ success: 1 })),
 *   undefined
 * )
 * ```
 *
 * @category getters
 * @since 0.0.0
 */
export const warningsOrUndefined = warningsOrElse(() => undefined);

/**
 * Extracts the `success` value of a `WarnResult`, falling back to `orElseReturn`
 * when no `success` value is present.
 *
 * The mirror of `warningsOrElse`: `SuccessOnly` and `SuccessWithWarnings` return
 * their `success` value; `WarningsOnly` returns the result of `orElseReturn`.
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 *
 * const successOrZero = WarnResult.successOrElse(() => 0)
 *
 * assert.deepStrictEqual(
 *   successOrZero(WarnResult.SuccessOnly({ success: 1 })),
 *   1
 * )
 * assert.deepStrictEqual(
 *   successOrZero(WarnResult.WarningsOnly({ warnings: "w" })),
 *   0
 * )
 * ```
 *
 * @category getters
 * @since 0.0.0
 */
export const successOrElse =
  <Z>(orElseReturn: () => Z) =>
  <W, A>(warnResult: WarnResult<W, A>): A | Z =>
    pipe(
      warnResult,
      orElse({
        orElseWarnings: constUndefined,
        orElseSuccess: orElseReturn,
      }),
      Struct.get("success"),
    );

/**
 * Extracts the `success` value of a `WarnResult`, returning `undefined` when no
 * `success` value is present.
 *
 * A specialisation of `successOrElse` whose fallback is `undefined`: `SuccessOnly`
 * and `SuccessWithWarnings` yield their `success` value, while `WarningsOnly`
 * yields `undefined`.
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 *
 * assert.deepStrictEqual(
 *   WarnResult.successOrUndefined(WarnResult.SuccessOnly({ success: 1 })),
 *   1
 * )
 * assert.deepStrictEqual(
 *   WarnResult.successOrUndefined(WarnResult.WarningsOnly({ warnings: "w" })),
 *   undefined
 * )
 * ```
 *
 * @category getters
 * @since 0.0.0
 */
export const successOrUndefined = successOrElse(() => undefined);

/**
 * Extracts the `success` value of a `WarnResult` as an `Option`.
 *
 * `SuccessOnly` and `SuccessWithWarnings` yield `Option.some(success)`;
 * `WarningsOnly` yields `Option.none()`. Use it when you want to chain the success
 * value through `Option` combinators rather than fall back to a default eagerly.
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 * import { Option } from "effect"
 *
 * assert.deepStrictEqual(
 *   WarnResult.successOption(WarnResult.SuccessOnly({ success: 1 })),
 *   Option.some(1)
 * )
 * assert.deepStrictEqual(
 *   WarnResult.successOption(WarnResult.WarningsOnly({ warnings: "w" })),
 *   Option.none()
 * )
 * ```
 *
 * @category getters
 * @since 0.0.0
 */
export const successOption = <W, A>(
  warnResult: WarnResult<W, A>,
): Option.Option<A> =>
  pipe(
    warnResult,
    matchSuccess({
      WarningsOnly: () => Option.none(),
      Success: Option.some,
    }),
  );

/**
 * Extracts the `warnings` of a `WarnResult` as an `Option`.
 *
 * The mirror of `successOption`: `WarningsOnly` and `SuccessWithWarnings` yield
 * `Option.some(warnings)`, while `SuccessOnly` yields `Option.none()`.
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 * import { Option } from "effect"
 *
 * assert.deepStrictEqual(
 *   WarnResult.warningsOption(WarnResult.WarningsOnly({ warnings: "w" })),
 *   Option.some("w")
 * )
 * assert.deepStrictEqual(
 *   WarnResult.warningsOption(WarnResult.SuccessOnly({ success: 1 })),
 *   Option.none()
 * )
 * ```
 *
 * @category getters
 * @since 0.0.0
 */
export const warningsOption = <W, A>(
  warnResult: WarnResult<W, A>,
): Option.Option<W> =>
  pipe(
    warnResult,
    matchWarnings({
      Warnings: Option.some,
      SuccessOnly: () => Option.none(),
    }),
  );

/**
 * Transforms both sides of a `WarnResult`, applying `mapWarnings` to any
 * `warnings` and `mapSuccess` to any `success` value.
 *
 * Each constructor is rebuilt with its mapped contents, so `WarningsOnly` maps
 * only the warnings, `SuccessOnly` only the success value, and
 * `SuccessWithWarnings` both. The tag is preserved. Use it as the bifunctor map
 * over `WarnResult`.
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 *
 * const both = WarnResult.mapBoth({
 *   mapWarnings: (warnings: string) => warnings.toUpperCase(),
 *   mapSuccess: (success: number) => success + 1
 * })
 *
 * assert.deepStrictEqual(
 *   both(WarnResult.SuccessWithWarnings({ warnings: "w", success: 1 })),
 *   WarnResult.SuccessWithWarnings({ warnings: "W", success: 2 })
 * )
 * assert.deepStrictEqual(
 *   both(WarnResult.WarningsOnly({ warnings: "w" })),
 *   WarnResult.WarningsOnly({ warnings: "W" })
 * )
 * ```
 *
 * @category mapping
 * @since 0.0.0
 */
export const mapBoth = <W1, A1, W2, A2>({
  mapWarnings,
  mapSuccess,
}: {
  mapWarnings: (warnings: W1) => W2;
  mapSuccess: (success: A1) => A2;
}): ((warnResult: WarnResult<W1, A1>) => WarnResult<W2, A2>) =>
  match({
    WarningsOnly: ({ warnings }) =>
      WarningsOnly({ warnings: mapWarnings(warnings) }),
    SuccessOnly: ({ success }) => SuccessOnly({ success: mapSuccess(success) }),
    SuccessWithWarnings: ({ warnings, success }) =>
      SuccessWithWarnings({
        warnings: mapWarnings(warnings),
        success: mapSuccess(success),
      }),
  });

/**
 * Effectful `mapBoth`: transforms each present side through an `Effect`,
 * reassembling the results into a `WarnResult` inside an `Effect`.
 *
 * For `SuccessWithWarnings` both effects run via `Effect.all` and their results
 * are combined; `WarningsOnly`/`SuccessOnly` run only the relevant effect. Errors
 * and requirements from both mappers are unioned into the result type. Use it when
 * mapping a `WarnResult`'s sides requires effects (validation, IO).
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 * import { Effect } from "effect"
 *
 * const both = WarnResult.mapBothEffect({
 *   mapWarnings: (warnings: string) => Effect.succeed(warnings.toUpperCase()),
 *   mapSuccess: (success: number) => Effect.succeed(success + 1)
 * })
 *
 * assert.deepStrictEqual(
 *   Effect.runSync(
 *     both(WarnResult.SuccessWithWarnings({ warnings: "w", success: 1 }))
 *   ),
 *   WarnResult.SuccessWithWarnings({ warnings: "W", success: 2 })
 * )
 * ```
 *
 * @category sequencing
 * @since 0.0.0
 */
export const mapBothEffect = <W1, A1, W2, A2, EW, EA, RW, RA>({
  mapWarnings,
  mapSuccess,
}: {
  mapWarnings: (warnings: W1) => Effect.Effect<W2, EW, RW>;
  mapSuccess: (success: A1) => Effect.Effect<A2, EA, RA>;
}): ((
  warnResult: WarnResult<W1, A1>,
) => Effect.Effect<WarnResult<W2, A2>, EW | EA, RW | RA>) =>
  match({
    WarningsOnly: ({ warnings }) =>
      pipe(
        mapWarnings(warnings),
        Effect.map((warnings2) => WarningsOnly({ warnings: warnings2 })),
      ),

    SuccessOnly: ({ success }) =>
      pipe(
        mapSuccess(success),
        Effect.map((success2) => SuccessOnly({ success: success2 })),
      ),

    SuccessWithWarnings: ({ warnings, success }) =>
      pipe(
        Effect.all({
          warnings: mapWarnings(warnings),
          success: mapSuccess(success),
        }),
        Effect.map(({ warnings: warnings2, success: success2 }) =>
          SuccessWithWarnings({ warnings: warnings2, success: success2 }),
        ),
      ),
  });

/**
 * Transforms the `warnings` of a `WarnResult`, leaving any `success` value
 * untouched.
 *
 * A specialisation of `mapBoth` with the success mapper set to `identity`:
 * `WarningsOnly` and `SuccessWithWarnings` have their `warnings` mapped, while
 * `SuccessOnly` passes through unchanged.
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 *
 * const shout = WarnResult.mapWarnings((warnings: string) =>
 *   warnings.toUpperCase()
 * )
 *
 * assert.deepStrictEqual(
 *   shout(WarnResult.SuccessWithWarnings({ warnings: "w", success: 1 })),
 *   WarnResult.SuccessWithWarnings({ warnings: "W", success: 1 })
 * )
 * assert.deepStrictEqual(
 *   shout(WarnResult.SuccessOnly({ success: 1 })),
 *   WarnResult.SuccessOnly({ success: 1 })
 * )
 * ```
 *
 * @category mapping
 * @since 0.0.0
 */
export const mapWarnings = <W1, W2>(
  mapWarnings: (warnings: W1) => W2,
): (<A>(warnResult: WarnResult<W1, A>) => WarnResult<W2, A>) =>
  mapBoth({ mapWarnings, mapSuccess: identity });

/**
 * Chains the `warnings` of a `WarnResult` into a new `WarnResult`, flattening the
 * result.
 *
 * Whenever `warnings` are present (`WarningsOnly` or `SuccessWithWarnings`) they
 * are passed to `mapWarnings`, whose returned `WarnResult` replaces the original;
 * `SuccessOnly` passes through unchanged. Use it to sequence warnings-driven
 * computations that themselves produce a `WarnResult`.
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 *
 * const chain = WarnResult.flatMapWarnings((warnings: string) =>
 *   warnings.length > 0
 *     ? WarnResult.WarningsOnly({ warnings: warnings.toUpperCase() })
 *     : WarnResult.SuccessOnly({ success: 0 })
 * )
 *
 * assert.deepStrictEqual(
 *   chain(WarnResult.WarningsOnly({ warnings: "w" })),
 *   WarnResult.WarningsOnly({ warnings: "W" })
 * )
 * assert.deepStrictEqual(
 *   chain(WarnResult.SuccessOnly({ success: 1 })),
 *   WarnResult.SuccessOnly({ success: 1 })
 * )
 * ```
 *
 * @category sequencing
 * @since 0.0.0
 */
export const flatMapWarnings = <W1, W2, A2>(
  mapWarnings: (warnings: W1) => WarnResult<W2, A2>,
): (<A1>(warnResult: WarnResult<W1, A1>) => WarnResult<W2, A1 | A2>) =>
  match({
    WarningsOnly: ({ warnings }) => mapWarnings(warnings),
    SuccessOnly: ({ success }) => SuccessOnly({ success }),
    SuccessWithWarnings: ({ warnings }) => mapWarnings(warnings),
  });

/**
 * Effectful `mapWarnings`: transforms the `warnings` of a `WarnResult` through an
 * `Effect`, leaving any `success` value untouched.
 *
 * A specialisation of `mapBothEffect` with the success mapper set to
 * `Effect.succeed`: the `warnings` (when present) are mapped effectfully and the
 * `success` value is carried through unchanged.
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 * import { Effect } from "effect"
 *
 * const shout = WarnResult.mapWarningsEffect((warnings: string) =>
 *   Effect.succeed(warnings.toUpperCase())
 * )
 *
 * assert.deepStrictEqual(
 *   Effect.runSync(
 *     shout(WarnResult.SuccessWithWarnings({ warnings: "w", success: 1 }))
 *   ),
 *   WarnResult.SuccessWithWarnings({ warnings: "W", success: 1 })
 * )
 * ```
 *
 * @category sequencing
 * @since 0.0.0
 */
export const mapWarningsEffect = <W1, W2, EW, RW>(
  mapWarnings: (warnings: W1) => Effect.Effect<W2, EW, RW>,
): (<A>(
  warnResult: WarnResult<W1, A>,
) => Effect.Effect<WarnResult<W2, A>, EW, RW>) =>
  mapBothEffect({ mapWarnings, mapSuccess: Effect.succeed });

/**
 * Effectful `flatMapWarnings`: chains the `warnings` of a `WarnResult` into an
 * `Effect` that yields a new `WarnResult`, flattening the result.
 *
 * When `warnings` are present they are passed to `mapWarnings`, whose effectful
 * `WarnResult` replaces the original; `SuccessOnly` is lifted unchanged via
 * `Effect.succeed`. Use it to sequence warnings-driven effectful computations that
 * produce a `WarnResult`.
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 * import { Effect } from "effect"
 *
 * const chain = WarnResult.flatMapWarningsEffect((warnings: string) =>
 *   Effect.succeed(WarnResult.WarningsOnly({ warnings: warnings.toUpperCase() }))
 * )
 *
 * assert.deepStrictEqual(
 *   Effect.runSync(chain(WarnResult.WarningsOnly({ warnings: "w" }))),
 *   WarnResult.WarningsOnly({ warnings: "W" })
 * )
 * assert.deepStrictEqual(
 *   Effect.runSync(chain(WarnResult.SuccessOnly({ success: 1 }))),
 *   WarnResult.SuccessOnly({ success: 1 })
 * )
 * ```
 *
 * @category sequencing
 * @since 0.0.0
 */
export const flatMapWarningsEffect = <W1, W2, A2, EW, RW>(
  mapWarnings: (warnings: W1) => Effect.Effect<WarnResult<W2, A2>, EW, RW>,
): (<A1>(
  warnResult: WarnResult<W1, A1>,
) => Effect.Effect<WarnResult<W2, A1 | A2>, EW, RW>) =>
  match({
    WarningsOnly: ({ warnings }) => mapWarnings(warnings),
    SuccessOnly: ({ success }) => Effect.succeed(SuccessOnly({ success })),
    SuccessWithWarnings: ({ warnings }) => mapWarnings(warnings),
  });

/**
 * Transforms the `success` value of a `WarnResult`, leaving any `warnings`
 * untouched.
 *
 * The mirror of `mapWarnings`: `SuccessOnly` and `SuccessWithWarnings` have their
 * `success` value mapped, while `WarningsOnly` passes through unchanged.
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 *
 * const inc = WarnResult.mapSuccess((success: number) => success + 1)
 *
 * assert.deepStrictEqual(
 *   inc(WarnResult.SuccessWithWarnings({ warnings: "w", success: 1 })),
 *   WarnResult.SuccessWithWarnings({ warnings: "w", success: 2 })
 * )
 * assert.deepStrictEqual(
 *   inc(WarnResult.WarningsOnly({ warnings: "w" })),
 *   WarnResult.WarningsOnly({ warnings: "w" })
 * )
 * ```
 *
 * @category mapping
 * @since 0.0.0
 */
export const mapSuccess = <A1, A2>(
  mapSuccess: (success: A1) => A2,
): (<W>(warnResult: WarnResult<W, A1>) => WarnResult<W, A2>) =>
  mapBoth({ mapWarnings: identity, mapSuccess });

/**
 * Chains the `success` value of a `WarnResult` into a new `WarnResult`, flattening
 * the result.
 *
 * The mirror of `flatMapWarnings`: whenever a `success` value is present
 * (`SuccessOnly` or `SuccessWithWarnings`) it is passed to `mapSuccess`, whose
 * returned `WarnResult` replaces the original; `WarningsOnly` passes through
 * unchanged.
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 *
 * const chain = WarnResult.flatMapSuccess((success: number) =>
 *   WarnResult.SuccessOnly({ success: success + 1 })
 * )
 *
 * assert.deepStrictEqual(
 *   chain(WarnResult.SuccessOnly({ success: 1 })),
 *   WarnResult.SuccessOnly({ success: 2 })
 * )
 * assert.deepStrictEqual(
 *   chain(WarnResult.WarningsOnly({ warnings: "w" })),
 *   WarnResult.WarningsOnly({ warnings: "w" })
 * )
 * ```
 *
 * @category sequencing
 * @since 0.0.0
 */
export const flatMapSuccess = <W2, A1, A2>(
  mapSuccess: (success: A1) => WarnResult<W2, A2>,
): (<W1>(warnResult: WarnResult<W1, A1>) => WarnResult<W1 | W2, A2>) =>
  match({
    WarningsOnly: ({ warnings }) => WarningsOnly({ warnings }),
    SuccessOnly: ({ success }) => mapSuccess(success),
    SuccessWithWarnings: ({ success }) => mapSuccess(success),
  });

/**
 * Effectful `mapSuccess`: transforms the `success` value of a `WarnResult` through
 * an `Effect`, leaving any `warnings` untouched.
 *
 * The mirror of `mapWarningsEffect`: the `success` value (when present) is mapped
 * effectfully and the `warnings` are carried through unchanged via
 * `Effect.succeed`.
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 * import { Effect } from "effect"
 *
 * const inc = WarnResult.mapSuccessEffect((success: number) =>
 *   Effect.succeed(success + 1)
 * )
 *
 * assert.deepStrictEqual(
 *   Effect.runSync(
 *     inc(WarnResult.SuccessWithWarnings({ warnings: "w", success: 1 }))
 *   ),
 *   WarnResult.SuccessWithWarnings({ warnings: "w", success: 2 })
 * )
 * ```
 *
 * @category sequencing
 * @since 0.0.0
 */
export const mapSuccessEffect = <A1, A2, EA, RA>(
  mapSuccess: (success: A1) => Effect.Effect<A2, EA, RA>,
): (<W>(
  warnResult: WarnResult<W, A1>,
) => Effect.Effect<WarnResult<W, A2>, EA, RA>) =>
  mapBothEffect({ mapWarnings: Effect.succeed, mapSuccess });

/**
 * Effectful `flatMapSuccess`: chains the `success` value of a `WarnResult` into an
 * `Effect` that yields a new `WarnResult`, flattening the result.
 *
 * The mirror of `flatMapWarningsEffect`: when a `success` value is present it is
 * passed to `mapSuccess`, whose effectful `WarnResult` replaces the original;
 * `WarningsOnly` is lifted unchanged via `Effect.succeed`.
 *
 * @example
 * ```ts
 * import { WarnResult } from "@nunofyobiz/effect-extras"
 * import { Effect } from "effect"
 *
 * const chain = WarnResult.flatMapSuccessEffect((success: number) =>
 *   Effect.succeed(WarnResult.SuccessOnly({ success: success + 1 }))
 * )
 *
 * assert.deepStrictEqual(
 *   Effect.runSync(chain(WarnResult.SuccessOnly({ success: 1 }))),
 *   WarnResult.SuccessOnly({ success: 2 })
 * )
 * assert.deepStrictEqual(
 *   Effect.runSync(chain(WarnResult.WarningsOnly({ warnings: "w" }))),
 *   WarnResult.WarningsOnly({ warnings: "w" })
 * )
 * ```
 *
 * @category sequencing
 * @since 0.0.0
 */
export const flatMapSuccessEffect = <W2, A1, A2, EA, RA>(
  mapSuccess: (success: A1) => Effect.Effect<WarnResult<W2, A2>, EA, RA>,
): (<W1>(
  warnResult: WarnResult<W1, A1>,
) => Effect.Effect<WarnResult<W1 | W2, A2>, EA, RA>) =>
  match({
    WarningsOnly: ({ warnings }) => Effect.succeed(WarningsOnly({ warnings })),
    SuccessOnly: ({ success }) => mapSuccess(success),
    SuccessWithWarnings: ({ success }) => mapSuccess(success),
  });
