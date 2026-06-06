/**
 * Helpers for decoding `FormData` with Effect `Schema`.
 *
 * @since 0.0.0
 */
import { Function, Schema } from "effect";

/**
 * Decodes a `FormData` into a typed value using a `Schema`, throwing on
 * validation failure.
 *
 * Built on v4's native `Schema.fromFormData`, which first parses the `FormData`
 * entries into a nested tree record (bracket-path notation is supported) and then
 * decodes that tree with the provided inner schema. For schemas with non-string
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
 * import { FormDataX } from "@nunofyobiz/effect-extras"
 *
 * const formData = new FormData()
 * formData.append("name", "John")
 * formData.append("age", "30")
 *
 * const result = FormDataX.decodeSync(
 *   formData,
 *   Schema.Struct({ name: Schema.String, age: Schema.NumberFromString }),
 * )
 *
 * assert.deepStrictEqual(result, { name: "John", age: 30 })
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
} = Function.dual(
  2,
  <S extends Schema.Top & { readonly DecodingServices: never }>(
    formData: FormData,
    schema: S,
  ): S["Type"] =>
    Schema.decodeUnknownSync(Schema.fromFormData(schema))(formData),
);
