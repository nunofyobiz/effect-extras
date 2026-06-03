import { BigInt, Schema, SchemaGetter, Struct } from "effect";

export const TrimmedNonEmptyString = Schema.NonEmptyString.pipe(
  Schema.decode({
    decode: SchemaGetter.transform((s) => s.trim()),
    encode: SchemaGetter.transform((s) => s.trim()),
  }),
);

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

export const nonNegativeBigInt = clampMinBigInt(0n);

/**
 * Extracts the "constructor input" type of a Schema — what `.make({...})`
 * accepts. Differs from `S["Type"]` (the decoded type) in that fields with
 * constructor defaults (e.g. `Model.DateTimeInsertFromDate` via `Overrideable`)
 * are optional in MakeIn but required in Type.
 *
 * Use this in repository signatures so callers can write a plain object literal
 * without needing to provide override-branded `createdAt` / `updatedAt` values.
 */
export type MakeIn<S extends { readonly "~type.make.in": unknown }> =
  S["~type.make.in"];

// ---------------------------------------------------------------------------
// Schema.Struct utilities — v4 removed the `.pick(...)`, `.omit(...)`, and
// `Schema.partial(...)` methods that v3 had on `Schema.Struct` instances. These
// helpers restore the same ergonomics on top of v4's `mapFields` primitive.
// ---------------------------------------------------------------------------

/**
 * Pick a subset of fields from a {@link Schema.Struct}.
 *
 * v3 equivalent: `mySchema.pick("a", "b")`.
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
 * Omit a subset of fields from a {@link Schema.Struct}.
 *
 * v3 equivalent: `mySchema.omit("a")`.
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
 * Make every field of a {@link Schema.Struct} optional.
 *
 * v3 equivalent: `Schema.partial(mySchema)`.
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
 * Pick a subset of fields from a {@link Schema.Struct} and make those fields
 * optional. Equivalent to `partial(pick(schema, ...keys))` but reads more
 * directly for the common "partial-update on a subset of fields" pattern used
 * by every action that updates an existing entity.
 *
 * Replaces the 2-step chain:
 * ```ts
 * recordingClip: RecordingClip.RecordingClip.update
 *   .mapFields(Struct.pick(["startOffsetMillis", "endOffsetMillis", "rating"]))
 *   .mapFields(Struct.map(Schema.optional))
 * ```
 *
 * With:
 * ```ts
 * recordingClip: SchemaX.pickPartial(
 *   RecordingClip.RecordingClip.update,
 *   "startOffsetMillis",
 *   "endOffsetMillis",
 *   "rating",
 * )
 * ```
 */
export const pickPartial = <
  const Fields extends Schema.Struct.Fields,
  const Keys extends readonly (keyof Fields & string)[],
>(
  schema: Schema.Struct<Fields>,
  ...keys: Keys
): Schema.Struct<{ [K in Keys[number]]: Schema.optional<Fields[K]> }> =>
  partial(pick(schema, ...keys));
