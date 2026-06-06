import { Schema } from "effect";
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
  });
});
