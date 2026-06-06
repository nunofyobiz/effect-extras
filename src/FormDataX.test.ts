import { Schema, pipe } from "effect";
import { describe, expect, test } from "vitest";
import * as FormDataX from "./FormDataX.js";

describe("FormDataX", () => {
  // Note: v4's Schema.fromFormData handles FormData → record parsing internally,
  // so the standalone `toRecord` helper was removed in the v4 migration. The
  // parsing behavior previously tested here is now exercised indirectly via
  // `decodeSync` below.

  describe("decodeSync", () => {
    test("mixed values", () => {
      const formData = new FormData();
      formData.append("name", "John");
      formData.append("age", "30");
      formData.append("parentNames", "John");
      formData.append("parentNames", "Jane");

      const result = FormDataX.decodeSync(
        formData,
        Schema.Struct({
          name: Schema.String,
          age: Schema.NumberFromString,
          parentNames: Schema.mutable(Schema.Array(Schema.String)),
        }),
      );

      expect(result).toStrictEqual({
        name: "John",
        age: 30,
        parentNames: ["John", "Jane"],
      });
    });

    test("empty FormData against an empty struct", () => {
      const formData = new FormData();

      const result = FormDataX.decodeSync(formData, Schema.Struct({}));

      expect(result).toStrictEqual({});
    });

    test("single field", () => {
      const formData = new FormData();
      formData.append("name", "John");

      const result = FormDataX.decodeSync(
        formData,
        Schema.Struct({ name: Schema.String }),
      );

      expect(result).toStrictEqual({ name: "John" });
    });

    test("duplicate field names decode into an array", () => {
      const formData = new FormData();
      formData.append("tags", "a");
      formData.append("tags", "b");
      formData.append("tags", "c");

      const result = FormDataX.decodeSync(
        formData,
        Schema.Struct({
          tags: Schema.mutable(Schema.Array(Schema.String)),
        }),
      );

      expect(result).toStrictEqual({ tags: ["a", "b", "c"] });
    });

    test("data-last (piped)", () => {
      const formData = new FormData();
      formData.append("name", "John");

      const result = pipe(
        formData,
        FormDataX.decodeSync(Schema.Struct({ name: Schema.String })),
      );

      expect(result).toStrictEqual({ name: "John" });
    });

    test("throws on a validation failure (missing required field)", () => {
      const formData = new FormData();

      expect(() =>
        FormDataX.decodeSync(formData, Schema.Struct({ name: Schema.String })),
      ).toThrow();
    });
  });
});
