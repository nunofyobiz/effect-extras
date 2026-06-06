/**
 * Generic, framework-agnostic extensions to Effect's `Schema` module.
 *
 * @since 0.0.0
 */
import { BigInt, Schema, SchemaGetter, Struct } from "effect";

/**
 * A `Schema` for a non-empty string that is trimmed on both decode and encode.
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
 * const decoded = Effect.runSync(
 *   Schema.decodeEffect(SchemaX.TrimmedNonEmptyString)("  hello  "),
 * )
 * assert.deepStrictEqual(decoded, "hello")
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
 * A `Schema` for a URL-safe file path built on top of {@link
 * TrimmedNonEmptyString}.
 *
 * On decode the path is `decodeURIComponent`-ed (percent-escapes are expanded);
 * on encode it is `encodeURIComponent`-ed back into its URL-safe form. The
 * underlying value is also trimmed and required to be non-empty. Use it at the
 * boundary between stored/transmitted encoded paths and the decoded paths your
 * code works with.
 *
 * @example
 * ```ts
 * import { Effect, Schema } from "effect"
 * import { SchemaX } from "@nunofyobiz/effect-extras"
 *
 * // Decoding expands percent-escapes
 * const decoded = Effect.runSync(
 *   Schema.decodeEffect(SchemaX.URLSafeFilePath)("a%2Fb.txt"),
 * )
 * assert.deepStrictEqual(decoded, "a/b.txt")
 *
 * // Encoding produces the URL-safe form
 * const encoded = Effect.runSync(
 *   Schema.encodeEffect(SchemaX.URLSafeFilePath)("a/b.txt"),
 * )
 * assert.deepStrictEqual(encoded, "a%2Fb.txt")
 * ```
 *
 * @category constructors
 * @since 0.0.0
 */
export const URLSafeFilePath = TrimmedNonEmptyString.pipe(
  Schema.decode({
    decode: SchemaGetter.transform((path) => decodeURIComponent(path)),
    encode: SchemaGetter.transform((path) => encodeURIComponent(path)),
  }),
);

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
 * const NonNegative = SchemaX.nonNegativeBigInt(Schema.BigInt)
 *
 * // Negative values are clamped up to 0n
 * assert.deepStrictEqual(
 *   Effect.runSync(Schema.decodeEffect(NonNegative)(-5n)),
 *   0n,
 * )
 *
 * // Non-negative values pass through unchanged
 * assert.deepStrictEqual(
 *   Effect.runSync(Schema.decodeEffect(NonNegative)(7n)),
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
 * Differs from `S["Type"]` (the decoded type) in that fields carrying
 * constructor defaults (e.g. an `Overrideable` timestamp) are *optional* in
 * `MakeIn` but *required* in `Type`. Use it in signatures that accept a value to
 * construct, so callers can pass a plain object literal without supplying the
 * defaulted, override-branded fields.
 *
 * @example
 * ```ts
 * import { Schema } from "effect"
 * import { SchemaX } from "@nunofyobiz/effect-extras"
 *
 * const Person = Schema.Struct({ name: Schema.String, age: Schema.Number })
 *
 * const input: SchemaX.MakeIn<typeof Person> = { name: "Ada", age: 36 }
 *
 * assert.deepStrictEqual(input, { name: "Ada", age: 36 })
 * ```
 *
 * @category models
 * @since 0.0.0
 */
export type MakeIn<S extends { readonly "~type.make.in": unknown }> =
  S["~type.make.in"];

// ---------------------------------------------------------------------------
// Schema.Struct utilities — v4 removed the `.pick(...)`, `.omit(...)`, and
// `Schema.partial(...)` methods that v3 had on `Schema.Struct` instances. These
// helpers restore the same ergonomics on top of v4's `mapFields` primitive.
// ---------------------------------------------------------------------------

/**
 * Returns a new `Schema.Struct` containing only the named `keys` of `schema`.
 *
 * Restores the v3 ergonomics of `mySchema.pick("a", "b")` — v4 removed the
 * `.pick(...)` method from `Schema.Struct` instances, so this rebuilds it on top
 * of v4's `mapFields` primitive. Each picked field keeps its original schema,
 * including any refinements.
 *
 * @example
 * ```ts
 * import { Effect, Schema } from "effect"
 * import { SchemaX } from "@nunofyobiz/effect-extras"
 *
 * const Source = Schema.Struct({
 *   a: Schema.Number,
 *   b: Schema.String,
 *   c: Schema.Boolean,
 * })
 *
 * const Picked = SchemaX.pick(Source, "a", "b")
 *
 * const decoded = Effect.runSync(
 *   Schema.decodeEffect(Picked)({ a: 1, b: "hi" }),
 * )
 * assert.deepStrictEqual(decoded, { a: 1, b: "hi" })
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
  schema.mapFields(
    (fields) =>
      Struct.pick(fields, keys as readonly (keyof Fields)[]) as Pick<
        Fields,
        Keys[number]
      >,
  );

/**
 * Returns a new `Schema.Struct` with the named `keys` of `schema` removed.
 *
 * The complement of {@link pick}, restoring the v3 ergonomics of
 * `mySchema.omit("a")` that v4 dropped from `Schema.Struct` instances. Every
 * surviving field keeps its original schema, including any refinements.
 *
 * @example
 * ```ts
 * import { Effect, Schema } from "effect"
 * import { SchemaX } from "@nunofyobiz/effect-extras"
 *
 * const Source = Schema.Struct({
 *   a: Schema.Number,
 *   b: Schema.String,
 *   c: Schema.Boolean,
 * })
 *
 * const Omitted = SchemaX.omit(Source, "c")
 *
 * const decoded = Effect.runSync(
 *   Schema.decodeEffect(Omitted)({ a: 1, b: "hi" }),
 * )
 * assert.deepStrictEqual(decoded, { a: 1, b: "hi" })
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
  schema.mapFields(
    (fields) =>
      Struct.omit(fields, keys as readonly (keyof Fields)[]) as Omit<
        Fields,
        Keys[number]
      >,
  );

/**
 * Returns a new `Schema.Struct` in which every field of `schema` is made
 * optional.
 *
 * Restores the v3 `Schema.partial(mySchema)` behaviour that v4 removed, by
 * wrapping each field in `Schema.optional`. A decoded value may therefore omit
 * any field; fields that *are* present still have to satisfy their original
 * schema, refinements included.
 *
 * @example
 * ```ts
 * import { Effect, Schema } from "effect"
 * import { SchemaX } from "@nunofyobiz/effect-extras"
 *
 * const Source = Schema.Struct({ a: Schema.Number, b: Schema.String })
 * const Partial = SchemaX.partial(Source)
 *
 * // All fields may be absent
 * assert.deepStrictEqual(Effect.runSync(Schema.decodeEffect(Partial)({})), {})
 *
 * // A present subset still decodes
 * assert.deepStrictEqual(
 *   Effect.runSync(Schema.decodeEffect(Partial)({ a: 1 })),
 *   { a: 1 },
 * )
 * ```
 *
 * @category combinators
 * @since 0.0.0
 */
export const partial = <Fields extends Schema.Struct.Fields>(
  schema: Schema.Struct<Fields>,
): Schema.Struct<{ [K in keyof Fields]: Schema.optional<Fields[K]> }> =>
  schema.mapFields((fields) => {
    const result: { [K in keyof Fields]?: Schema.optional<Fields[K]> } = {};
    for (const key of Object.keys(fields) as (keyof Fields)[]) {
      result[key] = Schema.optional(fields[key]);
    }
    return result as { [K in keyof Fields]: Schema.optional<Fields[K]> };
  });

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
 * const Source = Schema.Struct({
 *   a: Schema.Number,
 *   b: Schema.String,
 *   c: Schema.Boolean,
 * })
 *
 * const Update = SchemaX.pickPartial(Source, "a", "b")
 *
 * // Only picked fields are known, and each may be omitted
 * assert.deepStrictEqual(Effect.runSync(Schema.decodeEffect(Update)({})), {})
 * assert.deepStrictEqual(
 *   Effect.runSync(Schema.decodeEffect(Update)({ a: 1 })),
 *   { a: 1 },
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
