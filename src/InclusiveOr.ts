/**
 * A value carrying a left payload, a right payload, or both at once.
 * Use InclusiveOr when problems can accompany a usable result.
 *
 * Shared example scenarios:
 *
 * - Sign-up email: left contains cleanup or validation messages; right contains
 *   the usable email, such as maya@example.com. Removing surrounding whitespace
 *   can produce both a warning and an email that can still be saved.
 * - Spreadsheet import: left contains a row's import problems; right contains
 *   its usable contact record. For zip, pair index-aligned problem entries and
 *   contact entries from the same rows. Pairing is positional, not a join by ID.
 *
 * WarnResult reuses these scenarios unchanged: warnings = left, success = right.
 *
 * @since 0.0.0
 */
import {
  Array,
  Data,
  Effect,
  Match,
  Option,
  Predicate,
  Struct,
  pipe,
} from "effect";
import { constUndefined, dual, identity } from "effect/Function";

/**
 * A value with a left payload, a right payload, or both. Use it when an operation can
 * produce problems and a usable result together, such as saving a cleaned form field.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 *
 * const warnings = ["Surrounding whitespace removed"];
 * const email = "maya@example.com";
 * // Cleaning the sign-up field produced an email and a warning.
 * const result: InclusiveOr.InclusiveOr<string[], string> =
 *   InclusiveOr.LeftAndRight({ left: warnings, right: email });
 * assert.deepStrictEqual(result, { _tag: "LeftAndRight", left: warnings, right: email });
 * ```
 *
 * @category models
 * @since 0.0.0
 */
export type InclusiveOr<L, R> = Data.TaggedEnum<{
  LeftOnly: {
    readonly left: L;
  };

  RightOnly: {
    readonly right: R;
  };

  LeftAndRight: {
    readonly left: L;
    readonly right: R;
  };
}>;

/**
 * A value that carries only a left payload. Use this type for problems that have no
 * usable result yet.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 *
 * // The sign-up email is missing, so there is nothing to save.
 * const result: InclusiveOr.LeftOnly<string[]> =
 *   InclusiveOr.LeftOnly({ left: ["Email is required"] });
 * assert.deepStrictEqual(result.left, ["Email is required"]);
 * ```
 *
 * @category models
 * @since 0.0.0
 */
export type LeftOnly<L> = InclusiveOr<L, never> & {
  _tag: "LeftOnly";
};

/**
 * A value that carries only a right payload. Use this type for a usable result with
 * no accompanying problems.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 *
 * // This sign-up email needs no cleanup.
 * const result: InclusiveOr.RightOnly<string> =
 *   InclusiveOr.RightOnly({ right: "maya@example.com" });
 * assert.deepStrictEqual(result.right, "maya@example.com");
 * ```
 *
 * @category models
 * @since 0.0.0
 */
export type RightOnly<R> = InclusiveOr<never, R> & {
  _tag: "RightOnly";
};

/**
 * A value that carries both payloads. Use this type when problems accompany a result
 * that is still usable.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 *
 * const warnings = ["Surrounding whitespace removed"];
 * const email = "maya@example.com";
 * // Keep the cleanup warning alongside the email that can be saved.
 * const result: InclusiveOr.LeftAndRight<string[], string> =
 *   InclusiveOr.LeftAndRight({ left: warnings, right: email });
 * assert.deepStrictEqual(result, { _tag: "LeftAndRight", left: warnings, right: email });
 * ```
 *
 * @category models
 * @since 0.0.0
 */
export type LeftAndRight<L, R> = InclusiveOr<L, R> & {
  _tag: "LeftAndRight";
};

/**
 * Either a left-only value or a value with both sides. Use this type when problems
 * are always available but a usable result may be missing.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 *
 * // The form always has a validation message; an email may become available later.
 * const result: InclusiveOr.WithLeft<string[], string> =
 *   InclusiveOr.LeftOnly({ left: ["Email is required"] });
 * assert.deepStrictEqual(result.left, ["Email is required"]);
 * ```
 *
 * @category models
 * @since 0.0.0
 */
export type WithLeft<L, R> = LeftOnly<L> | LeftAndRight<L, R>;

/**
 * Either a right-only value or a value with both sides. Use this type when a usable
 * result is always available but accompanying problems may be missing.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 *
 * // The cleaned email can be saved whether or not cleanup produced warnings.
 * const result: InclusiveOr.WithRight<string[], string> =
 *   InclusiveOr.RightOnly({ right: "maya@example.com" });
 * assert.deepStrictEqual(result.right, "maya@example.com");
 * ```
 *
 * @category models
 * @since 0.0.0
 */
export type WithRight<L, R> = RightOnly<R> | LeftAndRight<L, R>;

interface InclusiveOrDefinition extends Data.TaggedEnum.WithGenerics<2> {
  readonly taggedEnum: InclusiveOr<this["A"], this["B"]>;
}

const taggedEnum = Data.taggedEnum<InclusiveOrDefinition>();

/**
 * Creates a value carrying only a left payload. Use it to report problems when there
 * is no usable result. The supplied payload is preserved, even if it is nullish.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 *
 * // A missing email gives the form a problem without a value to save.
 * const result = InclusiveOr.LeftOnly({ left: ["Email is required"] });
 * assert.deepStrictEqual(result, { _tag: "LeftOnly", left: ["Email is required"] });
 * ```
 *
 * @category constructors
 * @since 0.0.0
 */
export const LeftOnly = taggedEnum.LeftOnly;

/**
 * Creates a value carrying only a right payload. Use it for a usable result without
 * problems. The supplied payload is preserved, even if it is nullish.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 *
 * // The email was already clean, so save it without warnings.
 * const result = InclusiveOr.RightOnly({ right: "maya@example.com" });
 * assert.deepStrictEqual(result, { _tag: "RightOnly", right: "maya@example.com" });
 * ```
 *
 * @category constructors
 * @since 0.0.0
 */
export const RightOnly = taggedEnum.RightOnly;

/**
 * Creates a value carrying both payloads. Use it to keep problems alongside a usable
 * result. Both supplied payloads are preserved, even if they are nullish.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 *
 * const warnings = ["Surrounding whitespace removed"];
 * const email = "maya@example.com";
 * // Save the cleaned email and retain the message explaining the cleanup.
 * const result = InclusiveOr.LeftAndRight({ left: warnings, right: email });
 * assert.deepStrictEqual(result, { _tag: "LeftAndRight", left: warnings, right: email });
 * ```
 *
 * @category constructors
 * @since 0.0.0
 */
export const LeftAndRight = taggedEnum.LeftAndRight;

/**
 * Checks a value's tag and narrows its type to that variant. Use it before reading a
 * side that is not available on every variant; it also accepts unknown inputs.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { pipe } from "effect";
 *
 * const warnings = ["Surrounding whitespace removed"];
 * const email = "maya@example.com";
 * const result = InclusiveOr.LeftAndRight({ left: warnings, right: email });
 * // Recognise a cleaned email that has accompanying warnings.
 * assert.strictEqual(pipe(result, InclusiveOr.is("LeftAndRight")), true);
 * assert.strictEqual(InclusiveOr.is("LeftOnly")(result), false);
 * ```
 *
 * @category guards
 * @since 0.0.0
 */
export const is = taggedEnum.$is;

/**
 * Chooses one of three handlers from the value's tag and returns that handler's
 * result. Use it when each combination of problems and usable data needs its own
 * handling. It supports both direct and piped calls.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { pipe } from "effect";
 *
 * const warnings = ["Surrounding whitespace removed"];
 * const email = "maya@example.com";
 * const result = InclusiveOr.LeftAndRight({ left: warnings, right: email });
 * const describe = {
 *   LeftOnly: ({ left }: InclusiveOr.LeftOnly<string[]>) => left.join("; "),
 *   RightOnly: ({ right }: InclusiveOr.RightOnly<string>) => `Save ${right}`,
 *   LeftAndRight: ({ left, right }: InclusiveOr.LeftAndRight<string[], string>) =>
 *     `Save ${right}: ${left.join("; ")}`
 * };
 * // Show both the cleaned email and the reason it changed.
 * assert.strictEqual(pipe(result, InclusiveOr.match(describe)),
 *   "Save maya@example.com: Surrounding whitespace removed");
 * assert.strictEqual(InclusiveOr.match(result, describe), pipe(result, InclusiveOr.match(describe)));
 * ```
 *
 * @category pattern matching
 * @since 0.0.0
 */
export const match = taggedEnum.$match;

/**
 * Creates a value with a mandatory left payload and an optional right companion.
 * Use it when problems are known but usable data might be absent. A null or undefined
 * companion produces LeftOnly; any other companion produces LeftAndRight. The
 * mandatory left is preserved even when nullish.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 *
 * const warnings = ["Surrounding whitespace removed"];
 * const email = "maya@example.com";
 * // The warning remains whether or not the cleaned email is available.
 * assert.deepStrictEqual(InclusiveOr.WithLeft({ left: warnings, right: email }),
 *   InclusiveOr.LeftAndRight({ left: warnings, right: email }));
 * assert.deepStrictEqual(InclusiveOr.WithLeft({ left: warnings }),
 *   InclusiveOr.LeftOnly({ left: warnings }));
 * ```
 *
 * @category constructors
 * @since 0.0.0
 */
export const WithLeft = <L, R>({
  left,
  right,
}: {
  left: L;
  right?: R | undefined;
}): WithLeft<L, R> =>
  Predicate.isNotNullish(right)
    ? LeftAndRight({ left, right })
    : LeftOnly({ left });

/**
 * Creates a value with a mandatory right payload and an optional left companion.
 * Use it when usable data is known but problems might be absent. A null or undefined
 * companion produces RightOnly; any other companion produces LeftAndRight. The
 * mandatory right is preserved even when nullish.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 *
 * const warnings = ["Surrounding whitespace removed"];
 * const email = "maya@example.com";
 * // A clean email has no warning companion; a cleaned email has both sides.
 * assert.deepStrictEqual(InclusiveOr.WithRight({ right: email }),
 *   InclusiveOr.RightOnly({ right: email }));
 * assert.deepStrictEqual(InclusiveOr.WithRight({ left: warnings, right: email }),
 *   InclusiveOr.LeftAndRight({ left: warnings, right: email }));
 * ```
 *
 * @category constructors
 * @since 0.0.0
 */
export const WithRight = <L, R>({
  left,
  right,
}: {
  left?: L | undefined;
  right: R;
}): WithRight<L, R> =>
  Predicate.isNotNullish(left)
    ? LeftAndRight({ left, right })
    : RightOnly({ right });

const optionFromOptions = <L, R>(
  leftOption: Option.Option<L>,
  rightOption: Option.Option<R>,
): Option.Option<InclusiveOr<L, R>> =>
  Option.orElse(
    Option.map(Option.product(leftOption, rightOption), ([left, right]) =>
      LeftAndRight({ left, right }),
    ),
    () =>
      Option.orElse(
        Option.map(leftOption, (left) => LeftOnly({ left })),
        () => Option.map(rightOption, (right) => RightOnly({ right })),
      ),
  );

/**
 * Creates an optional InclusiveOr from two possibly missing payloads. Use it when
 * neither side is guaranteed: null and undefined count as absent, and both absent
 * produce None. Present values, including false, zero and empty strings, are kept.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { Option } from "effect";
 *
 * const warnings = ["Surrounding whitespace removed"];
 * const email = "maya@example.com";
 * // Keep the available email even when no cleanup warning was recorded.
 * assert.deepStrictEqual(InclusiveOr.optionFromNullables({ left: null, right: email }),
 *   Option.some(InclusiveOr.RightOnly({ right: email })));
 * // With neither a warning nor an email there is no InclusiveOr to construct.
 * assert.deepStrictEqual(InclusiveOr.optionFromNullables({ left: null, right: undefined }),
 *   Option.none());
 * ```
 *
 * @category constructors
 * @since 0.0.0
 */

export const optionFromNullables = <L, R>({
  left,
  right,
}: {
  left?: L | null | undefined;
  right?: R | null | undefined;
}): Option.Option<InclusiveOr<L, R>> =>
  optionFromOptions(Option.fromNullishOr(left), Option.fromNullishOr(right));

/**
 * Creates an InclusiveOr from possibly missing payloads, using a lazy fallback when
 * both are absent. Use it when an absent pair needs a replacement value rather than
 * None. Null and undefined are absent; other values are kept. Without a custom
 * fallback, an absent pair throws Error("Both left and right are nullable").
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 *
 * // A blank sign-up field has neither a cleaned email nor a cleanup warning.
 * // Supply a validation problem only when both inputs are absent.
 * const result = InclusiveOr.fromNullables({
 *   left: null,
 *   right: undefined,
 *   orElse: () => InclusiveOr.LeftOnly({ left: ["Email is required"] })
 * });
 * assert.deepStrictEqual(result, InclusiveOr.LeftOnly({ left: ["Email is required"] }));
 * ```
 *
 * @category constructors
 * @since 0.0.0
 */
export const fromNullables = <L, R>({
  left,
  right,
  orElse = () => {
    throw new Error("Both left and right are nullable");
  },
}: {
  left?: L | null | undefined;
  right?: R | null | undefined;
  orElse?: () => InclusiveOr<L, R>;
}): InclusiveOr<L, R> =>
  Option.getOrElse(optionFromNullables({ left, right }), orElse);

/**
 * Handles values according to whether a left payload exists. Use it to display
 * problems regardless of whether usable data also exists. LeftOnly and LeftAndRight
 * pass their left to Left; RightOnly passes its right to RightOnly.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { pipe } from "effect";
 *
 * const warnings = ["Surrounding whitespace removed"];
 * const email = "maya@example.com";
 * const result = InclusiveOr.LeftAndRight({ left: warnings, right: email });
 * // Display the cleanup warning even though the email can still be saved.
 * const message = pipe(result, InclusiveOr.matchLeft({
 *   Left: (messages: string[]) => messages.join("; "),
 *   RightOnly: (email: string) => `Ready to save ${email}`
 * }));
 * assert.strictEqual(message, "Surrounding whitespace removed");
 * ```
 *
 * @category pattern matching
 * @since 0.0.0
 */
export const matchLeft =
  <L, R, A>({
    Left,
    RightOnly,
  }: {
    Left: (left: L) => A;
    RightOnly: (right: R) => A;
  }) =>
  (inclusiveOr: InclusiveOr<L, R>): A =>
    Match.typeTags<InclusiveOr<L, R>, A>()({
      LeftOnly: ({ left }) => Left(left),
      RightOnly: ({ right }) => RightOnly(right),
      LeftAndRight: ({ left }) => Left(left),
    })(inclusiveOr);

/**
 * Handles values according to whether a right payload exists. Use it to process
 * usable data regardless of accompanying problems. RightOnly and LeftAndRight pass
 * their right to Right; LeftOnly passes its left to LeftOnly.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { pipe } from "effect";
 *
 * const warnings = ["Surrounding whitespace removed"];
 * const email = "maya@example.com";
 * const result = InclusiveOr.LeftAndRight({ left: warnings, right: email });
 * // Prepare the usable email for saving despite the cleanup warning.
 * const message = pipe(result, InclusiveOr.matchRight({
 *   LeftOnly: (messages: string[]) => messages.join("; "),
 *   Right: (email: string) => `Save ${email}`
 * }));
 * assert.strictEqual(message, "Save maya@example.com");
 * ```
 *
 * @category pattern matching
 * @since 0.0.0
 */
export const matchRight =
  <L, R, A>({
    LeftOnly,
    Right,
  }: {
    LeftOnly: (left: L) => A;
    Right: (right: R) => A;
  }) =>
  (inclusiveOr: InclusiveOr<L, R>): A =>
    Match.typeTags<InclusiveOr<L, R>, A>()({
      LeftOnly: ({ left }) => LeftOnly(left),
      RightOnly: ({ right }) => Right(right),
      LeftAndRight: ({ right }) => Right(right),
    })(inclusiveOr);

/**
 * Fills whichever side is missing using its lazy fallback, producing LeftAndRight.
 * Use it when the next step needs both payloads. Only a missing side invokes a
 * fallback; a present null or undefined payload is preserved.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { pipe } from "effect";
 *
 * const result = InclusiveOr.RightOnly({ right: "maya@example.com" });
 * // Supply an empty warning list for an email that needed no cleanup.
 * const complete = pipe(result, InclusiveOr.orElse({
 *   orElseLeft: (): string[] => [],
 *   orElseRight: () => "draft@example.com"
 * }));
 * assert.deepStrictEqual(complete,
 *   InclusiveOr.LeftAndRight({ left: [], right: "maya@example.com" }));
 * ```
 *
 * @category getters
 * @since 0.0.0
 */
export const orElse = <L2, R2>({
  orElseLeft,
  orElseRight,
}: {
  orElseLeft: () => L2;
  orElseRight: () => R2;
}): (<L, R>(inclusiveOr: InclusiveOr<L, R>) => LeftAndRight<L | L2, R | R2>) =>
  match({
    LeftOnly: ({ left }) => LeftAndRight({ left, right: orElseRight() }),
    RightOnly: ({ right }) => LeftAndRight({ left: orElseLeft(), right }),
    LeftAndRight: ({ left, right }) => LeftAndRight({ left, right }),
  });

/**
 * Fills missing sides with undefined, producing LeftAndRight. Use it to read or
 * destructure both keys without branching on the tag. Present nullish payloads are
 * preserved.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { pipe } from "effect";
 *
 * // The clean email has no warning list; expose that absence as undefined.
 * const complete = pipe(InclusiveOr.RightOnly({ right: "maya@example.com" }),
 *   InclusiveOr.orUndefined);
 * assert.deepStrictEqual(complete,
 *   InclusiveOr.LeftAndRight({ left: undefined, right: "maya@example.com" }));
 * ```
 *
 * @category getters
 * @since 0.0.0
 */
export const orUndefined = orElse({
  orElseLeft: constUndefined,
  orElseRight: constUndefined,
});

/**
 * Reads the left payload, calling a lazy fallback only when that side is missing.
 * Use it to get problems with a default in one step. A present null or undefined
 * payload does not invoke the fallback.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { pipe } from "effect";
 *
 * // A clean email has no warning list; use an empty list for the form display.
 * const warnings = pipe(InclusiveOr.RightOnly({ right: "maya@example.com" }),
 *   InclusiveOr.leftOrElse((): string[] => []));
 * assert.deepStrictEqual(warnings, []);
 * ```
 *
 * @category getters
 * @since 0.0.0
 */
export const leftOrElse =
  <A>(orElseReturn: () => A) =>
  <L, R>(inclusiveOr: InclusiveOr<L, R>): L | A =>
    pipe(
      inclusiveOr,
      orElse({
        orElseLeft: orElseReturn,
        orElseRight: constUndefined,
      }),
      Struct.get("left"),
    );

/**
 * Reads the left payload, returning undefined if that side is missing. Use it
 * when problems can be absent and no default is needed. Present nullish payloads
 * are preserved.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { pipe } from "effect";
 *
 * // There are no warnings to display for this clean email.
 * assert.strictEqual(pipe(InclusiveOr.RightOnly({ right: "maya@example.com" }),
 *   InclusiveOr.leftOrUndefined), undefined);
 * ```
 *
 * @category getters
 * @since 0.0.0
 */
export const leftOrUndefined = leftOrElse(constUndefined);

/**
 * Reads the right payload, calling a lazy fallback only when that side is missing.
 * Use it to get usable data with a default in one step. A present null or undefined
 * payload does not invoke the fallback.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { pipe } from "effect";
 *
 * // A form with only a validation problem needs a draft email for its preview.
 * const email = pipe(InclusiveOr.LeftOnly({ left: ["Email is required"] }),
 *   InclusiveOr.rightOrElse(() => "draft@example.com"));
 * assert.strictEqual(email, "draft@example.com");
 * ```
 *
 * @category getters
 * @since 0.0.0
 */
export const rightOrElse =
  <A>(orElseReturn: () => A) =>
  <L, R>(inclusiveOr: InclusiveOr<L, R>): R | A =>
    pipe(
      inclusiveOr,
      orElse({
        orElseLeft: constUndefined,
        orElseRight: orElseReturn,
      }),
      Struct.get("right"),
    );

/**
 * Reads the right payload, returning undefined if that side is missing. Use it
 * when usable data can be absent and no default is needed. Present nullish payloads
 * are preserved.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { pipe } from "effect";
 *
 * // A missing email problem has no usable email to preview.
 * assert.strictEqual(pipe(InclusiveOr.LeftOnly({ left: ["Email is required"] }),
 *   InclusiveOr.rightOrUndefined), undefined);
 * ```
 *
 * @category getters
 * @since 0.0.0
 */
export const rightOrUndefined = rightOrElse(constUndefined);

/**
 * Reads the right payload as Some, or returns None if that side is missing. Use it
 * to compose optional usable data with Option helpers. A present null or undefined
 * payload is still Some.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { Option, pipe } from "effect";
 *
 * // Keep the usable email available for optional saving.
 * const result = InclusiveOr.RightOnly({ right: "maya@example.com" });
 * assert.deepStrictEqual(pipe(result, InclusiveOr.rightOption), Option.some("maya@example.com"));
 * // Problems alone have no usable email.
 * assert.deepStrictEqual(pipe(InclusiveOr.LeftOnly({ left: ["Email is required"] }),
 *   InclusiveOr.rightOption), Option.none());
 * ```
 *
 * @category getters
 * @since 0.0.0
 */
export const rightOption = <L, R>(
  inclusiveOr: InclusiveOr<L, R>,
): Option.Option<R> =>
  matchRight({
    LeftOnly: Option.none,
    Right: Option.some,
  })(inclusiveOr);

/**
 * Reads the left payload as Some, or returns None if that side is missing. Use it
 * to compose optional problems with Option helpers. A present null or undefined
 * payload is still Some.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { Option, pipe } from "effect";
 *
 * // Keep the cleanup warning available for optional display.
 * const result = InclusiveOr.LeftOnly({ left: ["Surrounding whitespace removed"] });
 * assert.deepStrictEqual(pipe(result, InclusiveOr.leftOption), Option.some(["Surrounding whitespace removed"]));
 * // An email alone has no problems.
 * assert.deepStrictEqual(pipe(InclusiveOr.RightOnly({ right: "maya@example.com" }),
 *   InclusiveOr.leftOption), Option.none());
 * ```
 *
 * @category getters
 * @since 0.0.0
 */
export const leftOption = <L, R>(
  inclusiveOr: InclusiveOr<L, R>,
): Option.Option<L> =>
  matchLeft({
    Left: Option.some,
    RightOnly: Option.none,
  })(inclusiveOr);

/**
 * Transforms each present payload and keeps the original tag. Use it when problems
 * and usable data each need a new representation. A missing side never calls its
 * mapper; the original value is left unchanged.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { pipe } from "effect";
 *
 * const warnings = ["Surrounding whitespace removed"];
 * const email = "maya@example.com";
 * const result = InclusiveOr.LeftAndRight({ left: warnings, right: email });
 * // Turn warnings into display text and the email into a contact record.
 * const mapped = pipe(result, InclusiveOr.mapBoth({
 *   mapLeft: (messages: string[]) => messages.join("; "),
 *   mapRight: (email: string) => ({ email })
 * }));
 * assert.deepStrictEqual(mapped, InclusiveOr.LeftAndRight({
 *   left: "Surrounding whitespace removed", right: { email: "maya@example.com" }
 * }));
 * ```
 *
 * @category mapping
 * @since 0.0.0
 */
export const mapBoth = <L1, R1, L2, R2>({
  mapLeft,
  mapRight,
}: {
  mapLeft: (left: L1) => L2;
  mapRight: (right: R1) => R2;
}): ((inclusiveOr: InclusiveOr<L1, R1>) => InclusiveOr<L2, R2>) =>
  match({
    LeftOnly: ({ left }) => LeftOnly({ left: mapLeft(left) }),
    RightOnly: ({ right }) => RightOnly({ right: mapRight(right) }),
    LeftAndRight: ({ left, right }) =>
      LeftAndRight({ left: mapLeft(left), right: mapRight(right) }),
  });

/**
 * Transforms each present payload with an Effect and keeps the original tag. Use it
 * when preparing problems and usable data requires effectful work. On a both-sides
 * value, the left effect runs before the right; failure stops execution and fails
 * the result. Missing sides never call their mapper.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { Effect, pipe } from "effect";
 *
 * const warnings = ["Surrounding whitespace removed"];
 * const email = "maya@example.com";
 * const result = InclusiveOr.LeftAndRight({ left: warnings, right: email });
 * // Prepare warning text first, then prepare the contact record.
 * const mapped = pipe(result, InclusiveOr.mapBothEffect({
 *   mapLeft: (messages: string[]) => Effect.succeed(messages.join("; ")),
 *   mapRight: (email: string) => Effect.succeed({ email })
 * }));
 * assert.deepStrictEqual(Effect.runSync(mapped), InclusiveOr.LeftAndRight({
 *   left: "Surrounding whitespace removed", right: { email: "maya@example.com" }
 * }));
 * ```
 *
 * @category sequencing
 * @since 0.0.0
 */
export const mapBothEffect = <L1, R1, L2, R2, EL, ER, RL, RR>({
  mapLeft,
  mapRight,
}: {
  mapLeft: (left: L1) => Effect.Effect<L2, EL, RL>;
  mapRight: (right: R1) => Effect.Effect<R2, ER, RR>;
}): ((
  inclusiveOr: InclusiveOr<L1, R1>,
) => Effect.Effect<InclusiveOr<L2, R2>, EL | ER, RL | RR>) =>
  match({
    LeftOnly: ({ left }) =>
      Effect.map(mapLeft(left), (left2) => LeftOnly({ left: left2 })),

    RightOnly: ({ right }) =>
      Effect.map(mapRight(right), (right2) => RightOnly({ right: right2 })),

    LeftAndRight: ({ left, right }) =>
      Effect.map(
        Effect.all({ left: mapLeft(left), right: mapRight(right) }),
        ({ left: left2, right: right2 }) =>
          LeftAndRight({ left: left2, right: right2 }),
      ),
  });

/**
 * Transforms the left payload, keeping any right payload and the tag.
 * Use it to prepare problem messages without changing usable data.
 * When left is absent, its mapper is not called.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { pipe } from "effect";
 *
 * const warnings = ["Surrounding whitespace removed"];
 * const email = "maya@example.com";
 * const result = InclusiveOr.LeftAndRight({ left: warnings, right: email });
 * // Prepare one display message while retaining the email.
 * const mapped = pipe(result, InclusiveOr.mapLeft((messages: string[]) =>
 *   messages.join("; ")
 * ));
 * assert.deepStrictEqual(mapped, InclusiveOr.LeftAndRight({
 *   left: "Surrounding whitespace removed",
 *   right: email
 * }));
 * ```
 *
 * @category mapping
 * @since 0.0.0
 */
export const mapLeft = <L1, L2>(
  mapLeft: (left: L1) => L2,
): (<R>(inclusiveOr: InclusiveOr<L1, R>) => InclusiveOr<L2, R>) =>
  mapBoth({ mapLeft, mapRight: identity });

/**
 * Replaces the whole value with a mapper's InclusiveOr when left exists.
 * Use it when rechecking problems can change which sides are available.
 * The original opposite payload is discarded, including on LeftAndRight; it is
 * not accumulated. Values without left pass through.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { pipe } from "effect";
 *
 * // An imported contact is usable, but rechecking its missing name rejects the row.
 * const row = InclusiveOr.LeftAndRight({
 *   left: ["Name is missing"],
 *   right: { email: "maya@example.com" }
 * });
 * const checked = pipe(row, InclusiveOr.flatMapLeft((problems: string[]) =>
 *   InclusiveOr.LeftOnly({ left: problems.map((problem) => `Unresolved: ${problem}`) })
 * ));
 * // The new problems-only result replaces the entire row, including its contact.
 * assert.deepStrictEqual(checked,
 *   InclusiveOr.LeftOnly({ left: ["Unresolved: Name is missing"] }));
 * ```
 *
 * @category sequencing
 * @since 0.0.0
 */
export const flatMapLeft = <L1, L2, R2>(
  mapLeft: (left: L1) => InclusiveOr<L2, R2>,
): (<R1>(inclusiveOr: InclusiveOr<L1, R1>) => InclusiveOr<L2, R1 | R2>) =>
  match({
    LeftOnly: ({ left }) => mapLeft(left),
    RightOnly: ({ right }) => RightOnly({ right }),
    LeftAndRight: ({ left }) => mapLeft(left),
  });

/**
 * Transforms the left payload with an Effect, keeping any right payload and the tag.
 * Use it to prepare problem messages without changing usable data.
 * When left is absent, its mapper is not called. A mapper failure fails the result.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { Effect, pipe } from "effect";
 *
 * const warnings = ["Surrounding whitespace removed"];
 * const email = "maya@example.com";
 * const result = InclusiveOr.LeftAndRight({ left: warnings, right: email });
 * // Prepare one display message while retaining the email.
 * const mapped = pipe(result, InclusiveOr.mapLeftEffect((messages: string[]) =>
 *   Effect.succeed(messages.join("; "))
 * ));
 * assert.deepStrictEqual(Effect.runSync(mapped), InclusiveOr.LeftAndRight({
 *   left: "Surrounding whitespace removed",
 *   right: email
 * }));
 * ```
 *
 * @category sequencing
 * @since 0.0.0
 */
export const mapLeftEffect = <L1, L2, EL, RL>(
  mapLeft: (left: L1) => Effect.Effect<L2, EL, RL>,
): (<R>(
  inclusiveOr: InclusiveOr<L1, R>,
) => Effect.Effect<InclusiveOr<L2, R>, EL, RL>) =>
  mapBothEffect({ mapLeft, mapRight: Effect.succeed });

/**
 * Replaces the whole value with an effectful mapper's InclusiveOr when left exists.
 * Use it when rechecking problems can change which sides are available.
 * The original opposite payload is discarded, including on LeftAndRight; it is
 * not accumulated. Values without left pass through in a successful Effect. A mapper failure fails the result.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { Effect, pipe } from "effect";
 *
 * // An imported contact is usable, but rechecking its missing name rejects the row.
 * const row = InclusiveOr.LeftAndRight({
 *   left: ["Name is missing"],
 *   right: { email: "maya@example.com" }
 * });
 * const checked = pipe(row, InclusiveOr.flatMapLeftEffect((problems: string[]) =>
 *   Effect.succeed(InclusiveOr.LeftOnly({ left: problems.map((problem) => `Unresolved: ${problem}`) }))
 * ));
 * // The new problems-only result replaces the entire row, including its contact.
 * assert.deepStrictEqual(Effect.runSync(checked),
 *   InclusiveOr.LeftOnly({ left: ["Unresolved: Name is missing"] }));
 * ```
 *
 * @category sequencing
 * @since 0.0.0
 */
export const flatMapLeftEffect = <L1, L2, R2, EL, RL>(
  mapLeft: (left: L1) => Effect.Effect<InclusiveOr<L2, R2>, EL, RL>,
): (<R1>(
  inclusiveOr: InclusiveOr<L1, R1>,
) => Effect.Effect<InclusiveOr<L2, R1 | R2>, EL, RL>) =>
  match({
    LeftOnly: ({ left }) => mapLeft(left),
    RightOnly: ({ right }) => Effect.succeed(RightOnly({ right })),
    LeftAndRight: ({ left }) => mapLeft(left),
  });

/**
 * Transforms the right payload, keeping any left payload and the tag.
 * Use it to prepare usable data without changing its problems.
 * When right is absent, its mapper is not called.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { pipe } from "effect";
 *
 * const warnings = ["Surrounding whitespace removed"];
 * const email = "maya@example.com";
 * const result = InclusiveOr.LeftAndRight({ left: warnings, right: email });
 * // Prepare a contact record while retaining the cleanup warnings.
 * const mapped = pipe(result, InclusiveOr.mapRight((email: string) =>
 *   ({ email })
 * ));
 * assert.deepStrictEqual(mapped, InclusiveOr.LeftAndRight({
 *   left: warnings,
 *   right: { email: "maya@example.com" }
 * }));
 * ```
 *
 * @category mapping
 * @since 0.0.0
 */
export const mapRight = <R1, R2>(
  mapRight: (right: R1) => R2,
): (<L>(inclusiveOr: InclusiveOr<L, R1>) => InclusiveOr<L, R2>) =>
  mapBoth({ mapLeft: identity, mapRight });

/**
 * Replaces the whole value with a mapper's InclusiveOr when right exists.
 * Use it when processing usable data can change which sides are available.
 * The original opposite payload is discarded, including on LeftAndRight; it is
 * not accumulated. Values without right pass through.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { pipe } from "effect";
 *
 * const warnings = ["Surrounding whitespace removed"];
 * const email = "maya@example.com";
 * const result = InclusiveOr.LeftAndRight({ left: warnings, right: email });
 * // Rechecking the cleaned email produces a fresh result with no problems.
 * const checked = pipe(result, InclusiveOr.flatMapRight((email: string) =>
 *   InclusiveOr.RightOnly({ right: { email } })
 * ));
 * // The original cleanup warning is discarded rather than accumulated.
 * assert.deepStrictEqual(checked,
 *   InclusiveOr.RightOnly({ right: { email: "maya@example.com" } }));
 * ```
 *
 * @category sequencing
 * @since 0.0.0
 */
export const flatMapRight = <L2, R1, R2>(
  mapRight: (right: R1) => InclusiveOr<L2, R2>,
): (<L1>(inclusiveOr: InclusiveOr<L1, R1>) => InclusiveOr<L1 | L2, R2>) =>
  match({
    LeftOnly: ({ left }) => LeftOnly({ left }),
    RightOnly: ({ right }) => mapRight(right),
    LeftAndRight: ({ right }) => mapRight(right),
  });

/**
 * Transforms the right payload with an Effect, keeping any left payload and the tag.
 * Use it to prepare usable data without changing its problems.
 * When right is absent, its mapper is not called. A mapper failure fails the result.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { Effect, pipe } from "effect";
 *
 * const warnings = ["Surrounding whitespace removed"];
 * const email = "maya@example.com";
 * const result = InclusiveOr.LeftAndRight({ left: warnings, right: email });
 * // Prepare a contact record while retaining the cleanup warnings.
 * const mapped = pipe(result, InclusiveOr.mapRightEffect((email: string) =>
 *   Effect.succeed(({ email }))
 * ));
 * assert.deepStrictEqual(Effect.runSync(mapped), InclusiveOr.LeftAndRight({
 *   left: warnings,
 *   right: { email: "maya@example.com" }
 * }));
 * ```
 *
 * @category sequencing
 * @since 0.0.0
 */
export const mapRightEffect = <R1, R2, ER, RR>(
  mapRight: (right: R1) => Effect.Effect<R2, ER, RR>,
): (<L>(
  inclusiveOr: InclusiveOr<L, R1>,
) => Effect.Effect<InclusiveOr<L, R2>, ER, RR>) =>
  mapBothEffect({ mapLeft: Effect.succeed, mapRight });

/**
 * Replaces the whole value with an effectful mapper's InclusiveOr when right exists.
 * Use it when processing usable data can change which sides are available.
 * The original opposite payload is discarded, including on LeftAndRight; it is
 * not accumulated. Values without right pass through in a successful Effect. A mapper failure fails the result.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { Effect, pipe } from "effect";
 *
 * const warnings = ["Surrounding whitespace removed"];
 * const email = "maya@example.com";
 * const result = InclusiveOr.LeftAndRight({ left: warnings, right: email });
 * // Rechecking the cleaned email produces a fresh result with no problems.
 * const checked = pipe(result, InclusiveOr.flatMapRightEffect((email: string) =>
 *   Effect.succeed(InclusiveOr.RightOnly({ right: { email } }))
 * ));
 * // The original cleanup warning is discarded rather than accumulated.
 * assert.deepStrictEqual(Effect.runSync(checked),
 *   InclusiveOr.RightOnly({ right: { email: "maya@example.com" } }));
 * ```
 *
 * @category sequencing
 * @since 0.0.0
 */
export const flatMapRightEffect = <L2, R1, R2, ER, RR>(
  mapRight: (right: R1) => Effect.Effect<InclusiveOr<L2, R2>, ER, RR>,
): (<L1>(
  inclusiveOr: InclusiveOr<L1, R1>,
) => Effect.Effect<InclusiveOr<L1 | L2, R2>, ER, RR>) =>
  match({
    LeftOnly: ({ left }) => Effect.succeed(LeftOnly({ left })),
    RightOnly: ({ right }) => mapRight(right),
    LeftAndRight: ({ right }) => mapRight(right),
  });

/**
 * Pairs two arrays by index and passes each pair to a callback as an InclusiveOr.
 * Use it when unmatched tails must be kept: both entries produce LeftAndRight,
 * only the first produces LeftOnly, and only the second produces RightOnly.
 * Presence depends on array bounds, so an explicit undefined entry is present.
 * This is positional pairing, not a join by identifier. Both empty inputs return
 * an empty array without calling the callback.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { pipe } from "effect";
 *
 * // These spreadsheet lists refer to the same rows in the same order.
 * const problems = [["Name is missing"], ["Email is missing"]];
 * const contacts = [{ email: "maya@example.com" }];
 * const keepPair = (row: InclusiveOr.InclusiveOr<string[], { email: string }>) => row;
 * // Row one has problems and a contact; row two has only problems.
 * const paired = InclusiveOr.zip(problems, contacts, keepPair);
 * assert.deepStrictEqual(paired, [
 *   InclusiveOr.LeftAndRight({ left: ["Name is missing"], right: { email: "maya@example.com" } }),
 *   InclusiveOr.LeftOnly({ left: ["Email is missing"] })
 * ]);
 * // The piped form keeps the same positional pairs and unmatched tail.
 * assert.deepStrictEqual(pipe(problems, InclusiveOr.zip(contacts, keepPair)), paired);
 * ```
 *
 * @category combinators
 * @since 0.0.0
 */
export const zip: {
  <A, B, C>(
    array2: readonly B[],
    f: (inclusiveOr: InclusiveOr<A, B>) => C,
  ): (array1: readonly A[]) => C[];
  <A, B, C>(
    array1: readonly A[],
    array2: readonly B[],
    f: (inclusiveOr: InclusiveOr<A, B>) => C,
  ): C[];
} = dual(
  3,
  <A, B, C>(
    array1: readonly A[],
    array2: readonly B[],
    f: (inclusiveOr: InclusiveOr<A, B>) => C,
  ): C[] =>
    Array.getSomes(
      Array.makeBy(Math.max(array1.length, array2.length), (index) =>
        Option.map(
          optionFromOptions(Array.get(array1, index), Array.get(array2, index)),
          f,
        ),
      ),
    ),
);
