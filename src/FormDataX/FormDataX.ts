import { Function, Schema } from "effect";

/**
 * Decode a FormData into a typed value using a schema.
 *
 * Built on v4's native `Schema.fromFormData` which:
 * 1. Parses FormData entries into a nested tree record (bracket-path notation supported)
 * 2. Decodes the tree using the provided inner schema
 *
 * For schemas with non-string fields (e.g. `Schema.Int`), wrap the inner schema
 * in `Schema.toCodecStringTree(schema, { keepDeclarations: true })` so string
 * → number/boolean coercion happens.
 *
 * Throws on validation failure. Use only when the schema has no decoding
 * services (constrained at the type level via `S["DecodingServices"] = never`).
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
