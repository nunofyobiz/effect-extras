/**
 * Helpers for decoding `FormData` with Effect `Schema`.
 *
 * @since 0.0.0
 */
import { Schema } from "effect";
import { dual } from "effect/Function";

/**
 * Decodes submitted form fields into a typed value using a schema, throwing
 * synchronously when validation fails. Use it to validate a form before using
 * its values.
 *
 * Built on v4's native `Schema.fromFormData`, which first parses the `FormData`
 * entries into a nested tree record (bracket-path notation is supported, and
 * repeated keys become arrays) and then decodes that tree with the provided
 * inner schema. For schemas with non-string
 * fields (for example `Schema.Int`), wrap the inner schema in
 * `Schema.toCodecStringTree(schema, { keepDeclarations: true })` so the
 * string → number/boolean coercion happens. Usable only with schemas that have
 * no decoding services — this is enforced at the type level via
 * `S["DecodingServices"] = never` — and it throws synchronously when the input
 * fails validation.
 *
 * @example
 * ```ts
 * import { Schema } from "effect"
 * import { FormDataX, SchemaX } from "@nunofyobiz/effect-extras"
 *
 * const formData = new FormData()
 * formData.append("displayName", "  Mira Patel  ")
 * formData.append("teamSize", "3")
 *
 * const result = FormDataX.decodeSync(
 *   formData,
 *   Schema.Struct({
 *     displayName: SchemaX.TrimmedNonEmptyString,
 *     teamSize: SchemaX.IntFromString,
 *   }),
 * )
 *
 * // The team sign-up trims the display name and converts the team size to an integer.
 * assert.deepStrictEqual(result, { displayName: "Mira Patel", teamSize: 3 })
 * ```
 *
 * @category conversions
 * @since 0.0.0
 */
export const decodeSync: {
  <S extends Schema.Top & { readonly DecodingServices: never }>(
    formData: FormData,
    schema: S,
  ): S["Type"];
  <S extends Schema.Top & { readonly DecodingServices: never }>(
    schema: S,
  ): (formData: FormData) => S["Type"];
} = dual(
  2,
  <S extends Schema.Top & { readonly DecodingServices: never }>(
    formData: FormData,
    schema: S,
  ): S["Type"] =>
    Schema.decodeUnknownSync(Schema.fromFormData(schema))(formData),
);
