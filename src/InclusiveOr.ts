/**
 * A value carrying a left payload, a right payload, or both at once.
 * Use InclusiveOr when at least one of two pieces of data must be available:
 * either side may exist on its own, or both may exist together, and only the
 * state where neither exists is excluded.
 *
 * The documentation examples share two everyday scenarios. In both, left holds
 * the warnings or problems and right holds the usable value:
 *
 * - Sign-up email: a form field is cleaned up before saving. Left is a cleanup or
 *   validation message such as "Removed surrounding spaces"; right is the usable
 *   email, such as maya@example.com. Trimming a padded email yields both a
 *   warning and a usable value; a clean email yields only the value; an email
 *   that cannot be used yields only the warning.
 * - Spreadsheet import: a row is imported into a contact list. Left is the list of
 *   problems found in the row, such as "Phone number is missing"; right is the
 *   usable contact record, such as `{ name: "Maya", email: "maya@example.com" }`.
 *   `zip` pairs a list of per-row problems with a list of imported contacts by
 *   position, not by joining on an identifier.
 *
 * InclusiveOr itself stays generic and gives neither side a built-in meaning;
 * the roles above are how the examples use it. WarnResult reuses these same
 * scenarios with warnings = left and success = right, and its derived operations
 * delegate to InclusiveOr and share its logic.
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
 * A value with a left payload, a right payload, or both. Use it when a result can
 * carry warnings, a usable value, or both, such as a cleaned-up sign-up email. There
 * is no variant with neither side.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { Option } from "effect";
 *
 * // Left is a cleanup warning; right is the usable email.
 * type CleanedEmail = InclusiveOr.InclusiveOr<string, string>;
 *
 * const cleanEmail = (typed: string): Option.Option<CleanedEmail> => {
 *   const email = typed.trim();
 *   return InclusiveOr.optionFromNullables({
 *     left: email === typed ? undefined : "Removed surrounding spaces",
 *     right: email === "" ? undefined : email
 *   });
 * };
 *
 * // A clean email has only a usable value.
 * assert.deepStrictEqual(cleanEmail("maya@example.com"),
 *   Option.some(InclusiveOr.RightOnly({ right: "maya@example.com" })));
 * // A padded email is saved with a warning: both sides exist.
 * assert.deepStrictEqual(cleanEmail("  maya@example.com "),
 *   Option.some(InclusiveOr.LeftAndRight({
 *     left: "Removed surrounding spaces", right: "maya@example.com"
 *   })));
 * // Blank spaces leave a warning but nothing usable.
 * assert.deepStrictEqual(cleanEmail("   "),
 *   Option.some(InclusiveOr.LeftOnly({ left: "Removed surrounding spaces" })));
 * // An empty field has neither, which InclusiveOr cannot represent.
 * assert.deepStrictEqual(cleanEmail(""), Option.none());
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
 * A value that carries only a left payload. Use this type when only the warnings
 * or problems exist, such as a sign-up email that could not be cleaned up into
 * anything usable.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 *
 * // The typed address was rejected, so there is a warning but no usable email.
 * const rejected: InclusiveOr.LeftOnly<string> =
 *   InclusiveOr.LeftOnly({ left: "Email must contain an @" });
 * assert.strictEqual(rejected.left, "Email must contain an @");
 * ```
 *
 * @category models
 * @since 0.0.0
 */
export type LeftOnly<L> = InclusiveOr<L, never> & {
  _tag: "LeftOnly";
};

/**
 * A value that carries only a right payload. Use this type when only the usable
 * value exists, such as a sign-up email that needed no cleanup.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 *
 * // The typed address was already clean: a usable email and no warnings.
 * const clean: InclusiveOr.RightOnly<string> =
 *   InclusiveOr.RightOnly({ right: "maya@example.com" });
 * assert.strictEqual(clean.right, "maya@example.com");
 * ```
 *
 * @category models
 * @since 0.0.0
 */
export type RightOnly<R> = InclusiveOr<never, R> & {
  _tag: "RightOnly";
};

/**
 * A value that carries both payloads.
 * Use it when warnings and a usable value exist together, such as a sign-up email
 * that was cleaned up and saved with a warning. Both payloads are retained, even
 * if they are nullish.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 *
 * // The email was trimmed: keep the warning and the usable value together.
 * const cleaned: InclusiveOr.LeftAndRight<string, string> =
 *   InclusiveOr.LeftAndRight({
 *     left: "Removed surrounding spaces", right: "maya@example.com"
 *   });
 * assert.deepStrictEqual(cleaned, {
 *   _tag: "LeftAndRight", left: "Removed surrounding spaces", right: "maya@example.com"
 * });
 * ```
 *
 * @category models
 * @since 0.0.0
 */
export type LeftAndRight<L, R> = InclusiveOr<L, R> & {
  _tag: "LeftAndRight";
};

/**
 * Either a left-only value or a value with both sides. Use this type when the left
 * payload is always present but a right payload may or may not accompany it, such
 * as a spreadsheet row that always has at least one problem but may still yield a
 * usable contact.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 *
 * // This row has a problem and produced no contact, so only the problems exist.
 * const row: InclusiveOr.WithLeft<string[], { name: string; email: string }> =
 *   InclusiveOr.LeftOnly({ left: ["Phone number is missing"] });
 * // The problems can be read without checking which variant it is.
 * assert.deepStrictEqual(row.left, ["Phone number is missing"]);
 * ```
 *
 * @category models
 * @since 0.0.0
 */
export type WithLeft<L, R> = LeftOnly<L> | LeftAndRight<L, R>;

/**
 * Either a right-only value or a value with both sides. Use this type when the right
 * payload is always present but warnings may or may not accompany it, such as a
 * sign-up email that is always usable but may carry a cleanup warning.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 *
 * // The email is usable here and no warning accompanies it.
 * const saved: InclusiveOr.WithRight<string, string> =
 *   InclusiveOr.RightOnly({ right: "maya@example.com" });
 * // The usable email can be read without checking which variant it is.
 * assert.strictEqual(saved.right, "maya@example.com");
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
 * Creates a value carrying only a left payload. Use it when only the warnings or
 * problems exist, such as an email that could not be used. The supplied payload is
 * preserved, even if it is nullish.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 *
 * // The sign-up email was rejected: there is a warning but no usable value.
 * const rejected = InclusiveOr.LeftOnly({ left: "Email must contain an @" });
 * assert.deepStrictEqual(rejected,
 *   { _tag: "LeftOnly", left: "Email must contain an @" });
 * ```
 *
 * @category constructors
 * @since 0.0.0
 */
export const LeftOnly = taggedEnum.LeftOnly;

/**
 * Creates a value carrying only a right payload. Use it when only the usable value
 * exists, such as an email that needed no cleanup. The supplied payload is
 * preserved, even if it is nullish.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 *
 * // The sign-up email was already clean: a usable value and no warnings.
 * const clean = InclusiveOr.RightOnly({ right: "maya@example.com" });
 * assert.deepStrictEqual(clean, { _tag: "RightOnly", right: "maya@example.com" });
 * ```
 *
 * @category constructors
 * @since 0.0.0
 */
export const RightOnly = taggedEnum.RightOnly;

/**
 * Creates a value carrying both payloads.
 * Use it when warnings and a usable value exist together, such as an email that was
 * cleaned up and saved with a warning. Both payloads are retained, even if they
 * are nullish.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 *
 * // The email was trimmed and saved: keep the warning with the usable value.
 * const cleaned = InclusiveOr.LeftAndRight({
 *   left: "Removed surrounding spaces",
 *   right: "maya@example.com"
 * });
 * assert.deepStrictEqual(cleaned, {
 *   _tag: "LeftAndRight", left: "Removed surrounding spaces", right: "maya@example.com"
 * });
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
 * const cleaned = InclusiveOr.LeftAndRight({
 *   left: "Removed surrounding spaces",
 *   right: "maya@example.com"
 * });
 * // Recognise a sign-up email that has both a warning and a usable value.
 * assert.strictEqual(pipe(cleaned, InclusiveOr.is("LeftAndRight")), true);
 * assert.strictEqual(InclusiveOr.is("LeftOnly")(cleaned), false);
 * ```
 *
 * @category guards
 * @since 0.0.0
 */
export const is = taggedEnum.$is;

/**
 * Chooses one of three handlers from the value's tag and returns that handler's
 * result. Use it when each combination of warnings and usable value needs its own
 * handling. It supports both direct and piped calls.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { pipe } from "effect";
 *
 * const cleaned = InclusiveOr.LeftAndRight({
 *   left: "Removed surrounding spaces",
 *   right: "maya@example.com"
 * });
 * const describe = {
 *   LeftOnly: ({ left }: InclusiveOr.LeftOnly<string>) => `Rejected: ${left}`,
 *   RightOnly: ({ right }: InclusiveOr.RightOnly<string>) => `Saved ${right}`,
 *   LeftAndRight: ({ left, right }: InclusiveOr.LeftAndRight<string, string>) =>
 *     `Saved ${right} (${left})`
 * };
 * // A cleaned-up email is saved, and the sign-up form mentions the warning.
 * assert.strictEqual(pipe(cleaned, InclusiveOr.match(describe)),
 *   "Saved maya@example.com (Removed surrounding spaces)");
 * assert.strictEqual(InclusiveOr.match(cleaned, describe),
 *   pipe(cleaned, InclusiveOr.match(describe)));
 * ```
 *
 * @category pattern matching
 * @since 0.0.0
 */
export const match = taggedEnum.$match;

/**
 * Creates a value with a mandatory left payload and an optional right companion.
 * Use it when the warnings or problems are known but a usable value might be
 * absent. A null or undefined companion produces LeftOnly; any other companion
 * produces LeftAndRight. The mandatory left is preserved even when nullish.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 *
 * const problems = ["Phone number is missing"];
 * const contact = { name: "Maya", email: "maya@example.com" };
 * // A spreadsheet row with problems and no usable contact keeps only the problems.
 * assert.deepStrictEqual(InclusiveOr.WithLeft({ left: problems }),
 *   InclusiveOr.LeftOnly({ left: problems }));
 * // A row that still produced a contact keeps both.
 * assert.deepStrictEqual(InclusiveOr.WithLeft({ left: problems, right: contact }),
 *   InclusiveOr.LeftAndRight({ left: problems, right: contact }));
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
 * Use it when the usable value is known but warnings or problems might be absent.
 * A null or undefined companion produces RightOnly; any other companion produces
 * LeftAndRight. The mandatory right is preserved even when nullish.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 *
 * const contact = { name: "Maya", email: "maya@example.com" };
 * const problems = ["Phone number is missing"];
 * // A spreadsheet row that imported cleanly keeps only the contact.
 * assert.deepStrictEqual(InclusiveOr.WithRight({ right: contact }),
 *   InclusiveOr.RightOnly({ right: contact }));
 * // A row imported with problems keeps both.
 * assert.deepStrictEqual(InclusiveOr.WithRight({ left: problems, right: contact }),
 *   InclusiveOr.LeftAndRight({ left: problems, right: contact }));
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
 * // The email was cleaned without a warning: only the usable value exists.
 * assert.deepStrictEqual(
 *   InclusiveOr.optionFromNullables({ left: null, right: "maya@example.com" }),
 *   Option.some(InclusiveOr.RightOnly({ right: "maya@example.com" })));
 * // A warning and a usable email both exist.
 * assert.deepStrictEqual(
 *   InclusiveOr.optionFromNullables({
 *     left: "Removed surrounding spaces", right: "maya@example.com"
 *   }),
 *   Option.some(InclusiveOr.LeftAndRight({
 *     left: "Removed surrounding spaces", right: "maya@example.com"
 *   })));
 * // With neither a warning nor a value, there is nothing to construct.
 * assert.deepStrictEqual(
 *   InclusiveOr.optionFromNullables({ left: null, right: undefined }),
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
 * // The sign-up field was empty: report a warning instead of a usable email.
 * const emptyField = InclusiveOr.fromNullables({
 *   left: null,
 *   right: undefined,
 *   orElse: () => InclusiveOr.LeftOnly({ left: "Email is required" })
 * });
 * assert.deepStrictEqual(emptyField,
 *   InclusiveOr.LeftOnly({ left: "Email is required" }));
 * // Without a fallback, an absent pair is an error.
 * assert.throws(() => InclusiveOr.fromNullables({ left: null, right: null }),
 *   { message: "Both left and right are nullable" });
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
 * Handles values according to whether a left payload exists. Use it to react to the
 * warnings whenever there are any, including when a usable value also exists.
 * LeftOnly and LeftAndRight pass their left to Left; RightOnly passes its right to
 * RightOnly.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { pipe } from "effect";
 *
 * const cleaned = InclusiveOr.LeftAndRight({
 *   left: "Removed surrounding spaces",
 *   right: "maya@example.com"
 * });
 * // Show the warning whenever there is one; otherwise confirm the clean email.
 * const message = pipe(cleaned, InclusiveOr.matchLeft({
 *   Left: (warning: string) => `Warning: ${warning}`,
 *   RightOnly: (email: string) => `Saved ${email}`
 * }));
 * assert.strictEqual(message, "Warning: Removed surrounding spaces");
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
 * Handles values according to whether a right payload exists. Use it to work with
 * the usable value whenever there is one, including when warnings also exist.
 * RightOnly and LeftAndRight pass their right to Right; LeftOnly passes its left to
 * LeftOnly.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { pipe } from "effect";
 *
 * const cleaned = InclusiveOr.LeftAndRight({
 *   left: "Removed surrounding spaces",
 *   right: "maya@example.com"
 * });
 * // Use the email whenever there is one; otherwise explain why there is none.
 * const message = pipe(cleaned, InclusiveOr.matchRight({
 *   LeftOnly: (warning: string) => `Cannot save: ${warning}`,
 *   Right: (email: string) => `Saved ${email}`
 * }));
 * assert.strictEqual(message, "Saved maya@example.com");
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
 * // This spreadsheet row produced problems but no usable contact.
 * const row = InclusiveOr.LeftOnly({ left: ["Phone number is missing"] });
 * // Fill in a placeholder contact; a row without problems would get an empty list.
 * const complete = pipe(row, InclusiveOr.orElse({
 *   orElseLeft: (): string[] => [],
 *   orElseRight: () => ({ name: "Unknown", email: "unknown@example.com" })
 * }));
 * assert.deepStrictEqual(complete, InclusiveOr.LeftAndRight({
 *   left: ["Phone number is missing"],
 *   right: { name: "Unknown", email: "unknown@example.com" }
 * }));
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
 * // The email was rejected: expose the missing usable value as undefined.
 * const { left: warning, right: email } = pipe(
 *   InclusiveOr.LeftOnly({ left: "Email must contain an @" }),
 *   InclusiveOr.orUndefined);
 * assert.strictEqual(warning, "Email must contain an @");
 * assert.strictEqual(email, undefined);
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
 * Use it to get the warnings with a default in one step. A present null or
 * undefined payload does not invoke the fallback.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { pipe } from "effect";
 *
 * // A clean email has no warnings; read an empty list instead.
 * const clean = InclusiveOr.RightOnly({ right: "maya@example.com" });
 * assert.deepStrictEqual(
 *   pipe(clean, InclusiveOr.leftOrElse((): string[] => [])), []);
 * // When a warning exists, it is returned and the fallback is not needed.
 * const cleaned = InclusiveOr.LeftAndRight({
 *   left: "Removed surrounding spaces", right: "maya@example.com"
 * });
 * assert.strictEqual(
 *   pipe(cleaned, InclusiveOr.leftOrElse(() => "No warnings")),
 *   "Removed surrounding spaces");
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
 * when there may be no warnings and no default is needed. Present nullish
 * payloads are preserved.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { pipe } from "effect";
 *
 * // A clean sign-up email has no warning to display.
 * assert.strictEqual(
 *   pipe(InclusiveOr.RightOnly({ right: "maya@example.com" }),
 *     InclusiveOr.leftOrUndefined),
 *   undefined);
 * ```
 *
 * @category getters
 * @since 0.0.0
 */
export const leftOrUndefined = leftOrElse(constUndefined);

/**
 * Reads the right payload, calling a lazy fallback only when that side is missing.
 * Use it to get the usable value with a default in one step. A present null or
 * undefined payload does not invoke the fallback.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { pipe } from "effect";
 *
 * // The email was rejected, so read a placeholder address instead.
 * const rejected = InclusiveOr.LeftOnly({ left: "Email must contain an @" });
 * assert.strictEqual(
 *   pipe(rejected, InclusiveOr.rightOrElse(() => "unknown@example.com")),
 *   "unknown@example.com");
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
 * when the usable value can be absent and no default is needed. Present nullish
 * payloads are preserved.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { pipe } from "effect";
 *
 * // The email was rejected, so there is no usable value to save.
 * assert.strictEqual(
 *   pipe(InclusiveOr.LeftOnly({ left: "Email must contain an @" }),
 *     InclusiveOr.rightOrUndefined),
 *   undefined);
 * ```
 *
 * @category getters
 * @since 0.0.0
 */
export const rightOrUndefined = rightOrElse(constUndefined);

/**
 * Reads the right payload as Some, or returns None if that side is missing. Use it
 * to compose the usable value with Option helpers. A present null or undefined
 * payload is still Some.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { Option, pipe } from "effect";
 *
 * // A cleaned-up email still has a usable value to save.
 * const cleaned = InclusiveOr.LeftAndRight({
 *   left: "Removed surrounding spaces", right: "maya@example.com"
 * });
 * assert.deepStrictEqual(pipe(cleaned, InclusiveOr.rightOption),
 *   Option.some("maya@example.com"));
 * // A rejected email has none.
 * assert.deepStrictEqual(
 *   pipe(InclusiveOr.LeftOnly({ left: "Email must contain an @" }),
 *     InclusiveOr.rightOption),
 *   Option.none());
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
 * to compose the warnings with Option helpers. A present null or undefined payload
 * is still Some.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { Option, pipe } from "effect";
 *
 * // A cleaned-up email carries a warning to show the user.
 * const cleaned = InclusiveOr.LeftAndRight({
 *   left: "Removed surrounding spaces", right: "maya@example.com"
 * });
 * assert.deepStrictEqual(pipe(cleaned, InclusiveOr.leftOption),
 *   Option.some("Removed surrounding spaces"));
 * // A clean email has none.
 * assert.deepStrictEqual(
 *   pipe(InclusiveOr.RightOnly({ right: "maya@example.com" }),
 *     InclusiveOr.leftOption),
 *   Option.none());
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
 * Transforms each present payload and keeps the original tag. Use it when both the
 * warnings and the usable value need a new representation. A missing side never
 * calls its mapper; the original value is left unchanged.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { pipe } from "effect";
 *
 * const typed = InclusiveOr.LeftAndRight({
 *   left: "Removed surrounding spaces",
 *   right: "Maya@Example.com"
 * });
 * // Label the warning for display and normalise the email's case.
 * const normalised = pipe(typed, InclusiveOr.mapBoth({
 *   mapLeft: (warning: string) => `Warning: ${warning}`,
 *   mapRight: (email: string) => email.toLowerCase()
 * }));
 * assert.deepStrictEqual(normalised,
 *   InclusiveOr.LeftAndRight({
 *     left: "Warning: Removed surrounding spaces", right: "maya@example.com"
 *   }));
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
 * Transforms each present payload with an Effect and keeps the original tag.
 * Use it when preparing the warnings and the usable value requires effectful work.
 * On a both-sides value, the left effect runs before the right; failure stops
 * execution and fails the result. Missing sides never call their mapper.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { Effect, pipe } from "effect";
 *
 * const typed = InclusiveOr.LeftAndRight({
 *   left: "Removed surrounding spaces",
 *   right: "Maya@Example.com"
 * });
 * // Prepare the warning first, then the normalised email.
 * const prepared = pipe(typed, InclusiveOr.mapBothEffect({
 *   mapLeft: (warning: string) => Effect.succeed(`Warning: ${warning}`),
 *   mapRight: (email: string) => Effect.succeed(email.toLowerCase())
 * }));
 * assert.deepStrictEqual(Effect.runSync(prepared),
 *   InclusiveOr.LeftAndRight({
 *     left: "Warning: Removed surrounding spaces", right: "maya@example.com"
 *   }));
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
 * Use it to rewrite the warnings without touching the usable value.
 * When left is absent, its mapper is not called.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { pipe } from "effect";
 *
 * const contact = { name: "Maya", email: "maya@example.com" };
 * const row = InclusiveOr.LeftAndRight({
 *   left: ["Phone number is missing"],
 *   right: contact
 * });
 * // Summarise the row's problems as a count; the imported contact is untouched.
 * const summary = pipe(row, InclusiveOr.mapLeft(
 *   (problems: string[]) => problems.length
 * ));
 * assert.deepStrictEqual(summary,
 *   InclusiveOr.LeftAndRight({ left: 1, right: contact }));
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
 * Use it when handling the warnings produces a fresh result, such as escalating a
 * warning into a rejection. The original opposite payload is discarded, including
 * on LeftAndRight; it is not accumulated. Values without left pass through.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { pipe } from "effect";
 *
 * const typed = InclusiveOr.LeftAndRight({
 *   left: "Email has no domain",
 *   right: "maya@"
 * });
 * // The warning turns out to be blocking, so the email is rejected outright.
 * const rejected = pipe(typed, InclusiveOr.flatMapLeft((warning: string) =>
 *   InclusiveOr.LeftOnly({ left: `Rejected: ${warning}` })
 * ));
 * // This is a replacement: the unusable "maya@" is dropped, not merged in.
 * assert.deepStrictEqual(rejected,
 *   InclusiveOr.LeftOnly({ left: "Rejected: Email has no domain" }));
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
 * Use it to prepare the warnings with effectful work without touching the usable
 * value. When left is absent, its mapper is not called. A mapper failure fails the
 * result.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { Effect, pipe } from "effect";
 *
 * const cleaned = InclusiveOr.LeftAndRight({
 *   left: "Removed surrounding spaces",
 *   right: "maya@example.com"
 * });
 * // Prepare the warning for display; the usable email is retained as is.
 * const prepared = pipe(cleaned, InclusiveOr.mapLeftEffect((warning: string) =>
 *   Effect.succeed(`Warning: ${warning}`)
 * ));
 * assert.deepStrictEqual(Effect.runSync(prepared),
 *   InclusiveOr.LeftAndRight({
 *     left: "Warning: Removed surrounding spaces", right: "maya@example.com"
 *   }));
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
 * Use it when handling the warnings with effectful work produces a fresh result.
 * The original opposite payload is discarded, including on LeftAndRight; it is
 * not accumulated. Values without left pass through in a successful Effect. A mapper
 * failure fails the result.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { Effect, pipe } from "effect";
 *
 * const typed = InclusiveOr.LeftAndRight({
 *   left: "Email has no domain",
 *   right: "maya@"
 * });
 * // The warning turns out to be blocking, so the email is rejected outright.
 * const rejected = pipe(typed, InclusiveOr.flatMapLeftEffect((warning: string) =>
 *   Effect.succeed(InclusiveOr.LeftOnly({ left: `Rejected: ${warning}` }))
 * ));
 * // This is a replacement: the unusable "maya@" is dropped, not merged in.
 * assert.deepStrictEqual(Effect.runSync(rejected),
 *   InclusiveOr.LeftOnly({ left: "Rejected: Email has no domain" }));
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
 * Use it to rewrite the usable value without touching the warnings.
 * When right is absent, its mapper is not called.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { pipe } from "effect";
 *
 * const typed = InclusiveOr.LeftAndRight({
 *   left: "Removed surrounding spaces",
 *   right: "Maya@Example.com"
 * });
 * // Normalise the email's case; the cleanup warning is retained as is.
 * const normalised = pipe(typed, InclusiveOr.mapRight((email: string) =>
 *   email.toLowerCase()
 * ));
 * assert.deepStrictEqual(normalised,
 *   InclusiveOr.LeftAndRight({
 *     right: "maya@example.com", left: "Removed surrounding spaces"
 *   }));
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
 * Use it when handling the usable value produces a fresh result, such as finding
 * that it is already taken. The original opposite payload is discarded, including
 * on LeftAndRight; it is not accumulated. Values without right pass through.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { pipe } from "effect";
 *
 * const cleaned = InclusiveOr.LeftAndRight({
 *   left: "Removed surrounding spaces",
 *   right: "maya@example.com"
 * });
 * // The cleaned email turns out to belong to an existing account.
 * const rejected = pipe(cleaned, InclusiveOr.flatMapRight((email: string) =>
 *   InclusiveOr.LeftOnly({ left: `${email} is already registered` })
 * ));
 * // This is a replacement: the earlier cleanup warning is dropped, not merged in.
 * assert.deepStrictEqual(rejected,
 *   InclusiveOr.LeftOnly({ left: "maya@example.com is already registered" }));
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
 * Use it to prepare the usable value with effectful work without touching the
 * warnings. When right is absent, its mapper is not called. A mapper failure fails
 * the result.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { Effect, pipe } from "effect";
 *
 * const typed = InclusiveOr.LeftAndRight({
 *   left: "Removed surrounding spaces",
 *   right: "Maya@Example.com"
 * });
 * // Normalise the email's case; the cleanup warning is retained as is.
 * const prepared = pipe(typed, InclusiveOr.mapRightEffect((email: string) =>
 *   Effect.succeed(email.toLowerCase())
 * ));
 * assert.deepStrictEqual(Effect.runSync(prepared),
 *   InclusiveOr.LeftAndRight({
 *     right: "maya@example.com", left: "Removed surrounding spaces"
 *   }));
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
 * Use it when handling the usable value with effectful work produces a fresh result,
 * such as finding that it is already taken. The original opposite payload is
 * discarded, including on LeftAndRight; it is not accumulated. Values without right
 * pass through in a successful Effect. A mapper failure fails the result.
 *
 * @example
 * ```ts
 * import { InclusiveOr } from "@nunofyobiz/effect-extras";
 * import { Effect, pipe } from "effect";
 *
 * const cleaned = InclusiveOr.LeftAndRight({
 *   left: "Removed surrounding spaces",
 *   right: "maya@example.com"
 * });
 * // The cleaned email turns out to belong to an existing account.
 * const rejected = pipe(cleaned, InclusiveOr.flatMapRightEffect((email: string) =>
 *   Effect.succeed(
 *     InclusiveOr.LeftOnly({ left: `${email} is already registered` }))
 * ));
 * // This is a replacement: the earlier cleanup warning is dropped, not merged in.
 * assert.deepStrictEqual(Effect.runSync(rejected),
 *   InclusiveOr.LeftOnly({ left: "maya@example.com is already registered" }));
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
 * Pairs two arrays by index and collects the callback's result for each InclusiveOr.
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
 * // Row 1 and row 2 each list problems, but only row 1 produced a contact.
 * const problems = [["Phone number is missing"], ["Name is blank"]];
 * const contacts = [{ name: "Maya", email: "maya@example.com" }];
 * const toRow = (
 *   pair: InclusiveOr.InclusiveOr<string[], { name: string; email: string }>
 * ) => ({
 *   problems: pipe(pair, InclusiveOr.leftOrElse((): string[] => [])),
 *   contact: pipe(pair, InclusiveOr.rightOrUndefined)
 * });
 * // Pairing is by position: the second row has problems but no contact.
 * const rows = InclusiveOr.zip(problems, contacts, toRow);
 * assert.deepStrictEqual(rows, [
 *   { problems: ["Phone number is missing"], contact: contacts[0] },
 *   { problems: ["Name is blank"], contact: undefined }
 * ]);
 * // The piped form produces the same rows and unmatched tail.
 * assert.deepStrictEqual(pipe(problems, InclusiveOr.zip(contacts, toRow)), rows);
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
