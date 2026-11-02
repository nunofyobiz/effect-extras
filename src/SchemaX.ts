/**
 * Generic, framework-agnostic extensions to Effect's `Schema` module.
 *
 * @since 0.0.0
 */
import {
  Array,
  BigInt,
  Effect,
  Number,
  Option,
  Predicate,
  Schema,
  SchemaGetter,
  SchemaIssue,
  Struct,
} from "effect";
import type { SchemaAST } from "effect";

type TransformUri = (
  transform: (
    path: string,
    options: SchemaAST.ParseOptions,
  ) => Effect.Effect<string, SchemaIssue.Issue>,
) => SchemaGetter.Getter<string, string>;

// Effect renamed transformOrFail to transformEffect after our supported floor.
const uriGetters: {
  readonly transformEffect?: TransformUri;
  readonly transformOrFail?: TransformUri;
} = SchemaGetter;
const transformUri = Option.getOrThrow(
  Array.findFirst(
    [uriGetters.transformEffect, uriGetters.transformOrFail],
    Predicate.isNotUndefined,
  ),
);

/**
 * Trims a string on decode and encode and requires non-empty content, useful
 * for normalizing required text fields in a form.
 *
 * Leading and trailing whitespace is stripped, and the resulting value must be
 * non-empty — so a whitespace-only input (e.g. `"   "`) fails the
 * `NonEmptyString` refinement after trimming. Use it wherever user-supplied text
 * should be normalized and guaranteed to carry content.
 *
 * @example
 * ```ts
 * import { Effect, Schema } from "effect"
 * import { SchemaX } from "@nunofyobiz/effect-extras"
 *
 * // Trim a submitted username before storing the sign-up form.
 * const username = Effect.runSync(
 *   Schema.decodeEffect(SchemaX.TrimmedNonEmptyString)("  ada_lovelace  "),
 * )
 * assert.deepStrictEqual(username, "ada_lovelace")
 * ```
 *
 * @category constructors
 * @since 0.0.0
 */
export const TrimmedNonEmptyString = Schema.NonEmptyString.pipe(
  Schema.decode({
    decode: SchemaGetter.transform((s) => s.trim()),
    encode: SchemaGetter.transform((s) => s.trim()),
  }),
);

/**
 * Decodes a percent-encoded file path and encodes it for use in a URL, built
 * on {@link TrimmedNonEmptyString}. Use it for uploaded file names in URL parameters.
 *
 * On decode, trims the encoded input and then expands percent-escapes with
 * `decodeURIComponent`. On encode, applies `encodeURIComponent` before trimming,
 * so spaces become `%20` rather than being removed. Empty input fails in both
 * directions; whitespace-only input fails decoding but encodes as escaped spaces.
 * Malformed percent-escapes and strings that cannot be URI-encoded produce schema
 * failures.
 *
 * @example
 * ```ts
 * import { Effect, Schema } from "effect"
 * import { SchemaX } from "@nunofyobiz/effect-extras"
 *
 * // Recover an uploaded file path from a URL parameter.
 * const decoded = Effect.runSync(
 *   Schema.decodeEffect(SchemaX.URLSafeFilePath)("uploads%2Fteam%20photo.png"),
 * )
 * assert.deepStrictEqual(decoded, "uploads/team photo.png")
 *
 * // Encode the path as one URL parameter, including its slash and space.
 * const encoded = Effect.runSync(
 *   Schema.encodeEffect(SchemaX.URLSafeFilePath)("uploads/team photo.png"),
 * )
 * assert.deepStrictEqual(encoded, "uploads%2Fteam%20photo.png")
 * ```
 *
 * @category constructors
 * @since 0.0.0
 */
export const URLSafeFilePath = TrimmedNonEmptyString.pipe(
  Schema.decode({
    decode: transformUri((path, options) =>
      Effect.try({
        try: () => decodeURIComponent(path),
        catch: () =>
          new SchemaIssue.InvalidValue(
            { expected: "a valid URI component" },
            path,
            options,
          ),
      }),
    ),
    encode: transformUri((path, options) =>
      Effect.try({
        try: () => encodeURIComponent(path),
        catch: () =>
          new SchemaIssue.InvalidValue(
            { expected: "a URI-encodable string" },
            path,
            options,
          ),
      }),
    ),
  }),
);

/**
 * Parses a string as a safe integer and serializes it back to a decimal string.
 * Use it for quantity fields that must not silently round large integers.
 *
 * `Schema.NumberFromString` has no range guard, so a string past
 * `Number.MAX_SAFE_INTEGER` — e.g. a Postgres `int8` column, which node-postgres
 * returns as a string — decodes to a silently-rounded number
 * (`Number("9223372036854775807")` is `9223372036854776000`). This codec adds
 * `Schema.isInt` (which is `Number.isSafeInteger`), so any value that can't be
 * represented exactly fails decoding rather than corrupting data. On encode a
 * `number` is written back as a decimal string.
 *
 * Being an integer guard, it also rejects fractional strings (`"3.14"`). Note
 * the failure names the *already-parsed* number (the rounded value), since the
 * check runs after `NumberFromString` has produced the JS `number` — by which
 * point the original digits are gone. The loud failure still flags the offending
 * input.
 *
 * The parsing step is `NumberFromString`'s, so its lenient `Number(...)` coercion
 * carries through: blank input decodes to zero (`""` and `"   "` → `0`), and
 * exponential / hex notation is accepted (`"1e3"` → `1000`, `"0x10"` → `16`).
 * The guard protects against unsafe-integer *overflow*, not against
 * non-canonical numeric strings — a caller that needs strict input (reject blanks
 * or only accept plain decimal digits) should compose an upstream check.
 *
 * @example
 * ```ts
 * import { Effect, Result, Schema } from "effect"
 * import { SchemaX } from "@nunofyobiz/effect-extras"
 *
 * // Parse a quantity submitted by an order form.
 * const quantity = Effect.runSync(
 *   Schema.decodeEffect(SchemaX.IntFromString)("12"),
 * )
 * assert.deepStrictEqual(quantity, 12)
 *
 * // Serialize the quantity when filling the form again.
 * const encoded = Effect.runSync(
 *   Schema.encodeEffect(SchemaX.IntFromString)(quantity),
 * )
 * assert.deepStrictEqual(encoded, "12")
 *
 * // A value past Number.MAX_SAFE_INTEGER fails instead of silently rounding
 * const result = Effect.runSync(
 *   Effect.result(Schema.decodeEffect(SchemaX.IntFromString)("9223372036854775807")),
 * )
 * assert.deepStrictEqual(Result.isFailure(result), true)
 * ```
 *
 * @category constructors
 * @since 0.0.0
 */
export const IntFromString = Schema.NumberFromString.check(
  Schema.isInt({
    expected: "a safe integer (no overflow past Number.MAX_SAFE_INTEGER)",
  }),
);

/**
 * Transforms a `number` `Schema` by coercing its values into an inclusive
 * range on both decode and encode. Use it to keep settings within allowed bounds.
 *
 * Unlike Schema refinements, which reject values outside their range, `clamp`
 * maps them to the nearest configured bound. Omit either bound to clamp only
 * one side; an empty options object leaves values unchanged.
 *
 * @example
 * ```ts
 * import { Effect, Schema } from "effect"
 * import { SchemaX } from "@nunofyobiz/effect-extras"
 *
 * const Volume = SchemaX.clamp({ min: 0, max: 100 })(Schema.Number)
 *
 * // An oversized volume setting is capped at 100.
 * assert.deepStrictEqual(
 *   Effect.runSync(Schema.decodeEffect(Volume)(125)),
 *   100,
 * )
 * ```
 *
 * @category combinators
 * @since 0.0.0
 */
export const clamp = (options: {
  readonly min?: number;
  readonly max?: number;
}) => {
  if (
    Predicate.isNotUndefined(options.min) &&
    Predicate.isNotUndefined(options.max) &&
    options.min > options.max
  ) {
    throw new Error(
      "SchemaX.clamp requires min to be less than or equal to max",
    );
  }

  return <S extends Schema.Schema<number>>(schema: S) => {
    const clampValue = (value: number) => {
      const min = options.min;
      const max = options.max;
      const withMin = Predicate.isNotUndefined(min)
        ? Number.max(value, min)
        : value;

      return Predicate.isNotUndefined(max) ? Number.min(withMin, max) : withMin;
    };

    return schema.pipe(
      Schema.decode({
        decode: SchemaGetter.transform(clampValue),
        encode: SchemaGetter.transform(clampValue),
      }),
    );
  };
};

// Internal — only used to construct nonNegativeBigInt below.
const clampMinBigInt =
  (min: bigint) =>
  <S extends Schema.Schema<bigint>>(schema: S) =>
    schema.pipe(
      Schema.decode({
        decode: SchemaGetter.transform((value) => BigInt.max(value, min)),
        encode: SchemaGetter.transform((value) => BigInt.max(value, min)),
      }),
    );

/**
 * Transforms a `bigint` `Schema` so its value is clamped to be non-negative,
 * mapping any value below `0n` up to `0n` on both decode and encode.
 *
 * Unlike a refinement that *rejects* negative input, this *coerces* it: a
 * negative `bigint` decodes to `0n` rather than failing. Apply it to a `bigint`
 * schema whenever negative magnitudes are meaningless and should be floored at
 * zero rather than treated as errors.
 *
 * @example
 * ```ts
 * import { Effect, Schema } from "effect"
 * import { SchemaX } from "@nunofyobiz/effect-extras"
 *
 * const StockCount = SchemaX.nonNegativeBigInt(Schema.BigInt)
 *
 * // A stock adjustment below zero is floored at zero.
 * assert.deepStrictEqual(
 *   Effect.runSync(Schema.decodeEffect(StockCount)(-5n)),
 *   0n,
 * )
 *
 * // Available stock is kept as entered.
 * assert.deepStrictEqual(
 *   Effect.runSync(Schema.decodeEffect(StockCount)(7n)),
 *   7n,
 * )
 * ```
 *
 * @category combinators
 * @since 0.0.0
 */
export const nonNegativeBigInt = clampMinBigInt(0n);

/**
 * Extracts the "constructor input" type of a `Schema` — what `.make({...})`
 * accepts.
 *
 * Differs from `S["Type"]` (the decoded type) in that fields carrying constructor
 * defaults are *optional* in `MakeIn` but *required* in `Type`. Use it in signatures
 * that accept a value to construct, so callers can pass a plain object literal
 * without supplying the defaulted fields.
 *
 * @example
 * ```ts
 * import { Effect, Schema } from "effect"
 * import { SchemaX } from "@nunofyobiz/effect-extras"
 *
 * const Settings = Schema.Struct({
 *   username: Schema.String,
 *   theme: Schema.String.pipe(Schema.withConstructorDefault(Effect.succeed("light"))),
 * })
 *
 * // Constructor input may omit the theme; the completed record includes it.
 * const input: SchemaX.MakeIn<typeof Settings> = { username: "ada" }
 * assert.deepStrictEqual(Settings.make(input), { username: "ada", theme: "light" })
 * ```
 *
 * @category models
 * @since 0.0.0
 */
export type MakeIn<S extends { readonly "~type.make.in": unknown }> =
  S["~type.make.in"];

// ---------------------------------------------------------------------------
// Schema.Struct utilities built on the `mapFields` primitive.
// ---------------------------------------------------------------------------

/**
 * Returns a new `Schema.Struct` containing only the named `keys` of `schema`.
 *
 * Use it to select fields for an edit form. Each picked field keeps its original
 * schema, including any refinements.
 *
 * @example
 * ```ts
 * import { Effect, Schema } from "effect"
 * import { SchemaX } from "@nunofyobiz/effect-extras"
 *
 * const Profile = Schema.Struct({
 *   displayName: Schema.NonEmptyString,
 *   bio: Schema.String,
 *   joinedAt: Schema.String,
 * })
 *
 * // Select only the fields shown in the profile editor.
 * const EditForm = SchemaX.pick(Profile, "displayName", "bio")
 * assert.deepStrictEqual(
 *   Effect.runSync(Schema.decodeEffect(EditForm)({ displayName: "Ada", bio: "Programmer" })),
 *   { displayName: "Ada", bio: "Programmer" },
 * )
 * ```
 *
 * @category combinators
 * @since 0.0.0
 */
export const pick = <
  const Fields extends Schema.Struct.Fields,
  const Keys extends readonly (keyof Fields & string)[],
>(
  schema: Schema.Struct<Fields>,
  ...keys: Keys
): Schema.Struct<Pick<Fields, Keys[number]>> =>
  schema.mapFields((fields) => Struct.pick(fields, keys));

/**
 * Returns a new `Schema.Struct` with the named `keys` of `schema` removed.
 *
 * The complement of {@link pick}. Every surviving field keeps its original
 * schema, including any refinements. Use it to leave server-managed fields out
 * of an editable schema.
 *
 * @example
 * ```ts
 * import { Effect, Schema } from "effect"
 * import { SchemaX } from "@nunofyobiz/effect-extras"
 *
 * const Profile = Schema.Struct({
 *   displayName: Schema.NonEmptyString,
 *   bio: Schema.String,
 *   joinedAt: Schema.String,
 * })
 *
 * // The editor does not ask for the server-managed join date.
 * const EditableProfile = SchemaX.omit(Profile, "joinedAt")
 * assert.deepStrictEqual(
 *   Effect.runSync(Schema.decodeEffect(EditableProfile)({ displayName: "Ada", bio: "Programmer" })),
 *   { displayName: "Ada", bio: "Programmer" },
 * )
 * ```
 *
 * @category combinators
 * @since 0.0.0
 */
export const omit = <
  const Fields extends Schema.Struct.Fields,
  const Keys extends readonly (keyof Fields & string)[],
>(
  schema: Schema.Struct<Fields>,
  ...keys: Keys
): Schema.Struct<Omit<Fields, Keys[number]>> =>
  schema.mapFields((fields) => Struct.omit(fields, keys));

/**
 * Returns a new `Schema.Struct` in which every field of `schema` is made
 * optional. Use it for update payloads containing only changed fields.
 *
 * Wraps each field in `Schema.optional`. A decoded value may therefore omit any
 * field; fields that *are* present still have to satisfy their original schema,
 * refinements included.
 *
 * @example
 * ```ts
 * import { Effect, Schema } from "effect"
 * import { SchemaX } from "@nunofyobiz/effect-extras"
 *
 * const Profile = Schema.Struct({
 *   displayName: Schema.NonEmptyString,
 *   bio: Schema.String,
 * })
 * const Update = SchemaX.partial(Profile)
 *
 * // Send only the changed biography; the display name may be omitted.
 * assert.deepStrictEqual(
 *   Effect.runSync(Schema.decodeEffect(Update)({ bio: "Mathematician" })),
 *   { bio: "Mathematician" },
 * )
 * ```
 *
 * @category combinators
 * @since 0.0.0
 */
export const partial = <Fields extends Schema.Struct.Fields>(
  schema: Schema.Struct<Fields>,
): Schema.Struct<{ [K in keyof Fields]: Schema.optional<Fields[K]> }> =>
  schema.mapFields((fields) => Struct.map(fields, Schema.optional));

/**
 * Returns a new `Schema.Struct` containing only the named `keys` of `schema`,
 * with every picked field made optional.
 *
 * Equivalent to `partial(pick(schema, ...keys))`, but reads more directly for
 * the common "partial update over a subset of fields" pattern: select the
 * mutable fields of an entity, then allow any of them to be omitted in the
 * update payload. Composes {@link pick} and {@link partial} in one call.
 *
 * @example
 * ```ts
 * import { Effect, Schema } from "effect"
 * import { SchemaX } from "@nunofyobiz/effect-extras"
 *
 * const Profile = Schema.Struct({
 *   displayName: Schema.NonEmptyString,
 *   bio: Schema.String,
 *   joinedAt: Schema.String,
 * })
 * const Update = SchemaX.pickPartial(Profile, "displayName", "bio")
 *
 * // Update the display name without requiring a biography or join date.
 * assert.deepStrictEqual(
 *   Effect.runSync(Schema.decodeEffect(Update)({ displayName: "Ada Lovelace" })),
 *   { displayName: "Ada Lovelace" },
 * )
 * ```
 *
 * @category combinators
 * @since 0.0.0
 */
export const pickPartial = <
  const Fields extends Schema.Struct.Fields,
  const Keys extends readonly (keyof Fields & string)[],
>(
  schema: Schema.Struct<Fields>,
  ...keys: Keys
): Schema.Struct<{ [K in Keys[number]]: Schema.optional<Fields[K]> }> =>
  partial(pick(schema, ...keys));
