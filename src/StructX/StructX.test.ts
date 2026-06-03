import { Option, pipe } from "effect";
import { describe, expect, test } from "vitest";
import {
  defined,
  filterDefined,
  hasNotNullableProperty,
  pickSome,
  some,
  truthy,
} from "./StructX";

describe("Struct utils", () => {
  describe("defined", () => {
    test("undefined", () => {
      expect(defined("name", undefined)).toStrictEqual({
        // No properties
      });
    });

    test("null", () => {
      expect(defined("name", null)).toStrictEqual({
        name: null,
      });
    });

    test("falsy empty string", () => {
      expect(defined("name", "")).toStrictEqual({
        name: "",
      });
    });

    test("falsy number", () => {
      expect(defined("name", 0)).toStrictEqual({
        name: 0,
      });
    });

    test("falsy boolean", () => {
      expect(defined("name", false)).toStrictEqual({
        name: false,
      });
    });

    test("defined", () => {
      expect(defined("name", "value")).toStrictEqual({
        name: "value",
      });
    });
  });

  describe("filterDefined", () => {
    test("all undefined", () => {
      expect(
        filterDefined({
          a: undefined,
          b: undefined,
        }),
      ).toStrictEqual({
        // No properties
      });
    });

    test("some undefined, some defined", () => {
      expect(
        filterDefined({
          a: "value a",
          b: undefined,
        }),
      ).toStrictEqual({
        a: "value a",
      });
    });

    test("all defined", () => {
      expect(
        filterDefined({
          a: "value a",
          b: "value b",
        }),
      ).toStrictEqual({
        a: "value a",
        b: "value b",
      });
    });

    test("all falsy but defined", () => {
      expect(
        filterDefined({
          a: "",
          b: 0,
          c: false,
          d: null,
        }),
      ).toStrictEqual({
        a: "",
        b: 0,
        c: false,
        d: null,
      });
    });

    test("mix of everything", () => {
      expect(
        filterDefined({
          a: undefined,
          b: "value b",
          c: 0,
          d: false,
          e: null,
          f: undefined,
          g: "value g",
        }),
      ).toStrictEqual({
        b: "value b",
        c: 0,
        d: false,
        e: null,
        g: "value g",
      });
    });
  });

  describe("some", () => {
    test("none returns empty object", () => {
      expect(some("name", Option.none())).toStrictEqual({});
    });

    test("some returns singleton record", () => {
      expect(some("name", Option.some("value"))).toStrictEqual({
        name: "value",
      });
    });
  });

  describe("pickSome", () => {
    const record = {
      alpha: Option.some(100),
      beta: Option.none(),
      gamma: Option.some(42),
      delta: 1000,
    };

    test("key present and Some — returns singleton", () => {
      expect(pickSome(record, "alpha")).toStrictEqual({ alpha: 100 });
    });

    test("key present and None — returns empty object", () => {
      expect(pickSome(record, "beta")).toStrictEqual({});
    });

    test("key missing — returns empty object", () => {
      expect(
        pickSome(
          // @ts-expect-error - missing key
          record,
          "missing",
        ),
      ).toStrictEqual({});
    });

    test("with renameKeyTo — uses key for lookup, renameKeyTo for output", () => {
      expect(pickSome(record, "gamma", "durationMillis")).toStrictEqual({
        durationMillis: 42,
      });
    });

    test("with renameKeyTo and None value — returns empty object", () => {
      expect(pickSome(record, "beta", "durationMillis")).toStrictEqual({});
    });

    test("with renameKeyTo and missing key — returns empty object", () => {
      expect(
        pickSome(
          // @ts-expect-error - missing key
          record,
          "missing",
          "durationMillis",
        ),
      ).toStrictEqual({});
    });

    test("spreading multiple pickSome calls into an object", () => {
      const result = {
        ...pickSome(record, "alpha"),
        ...pickSome(record, "beta"),
        ...pickSome(record, "gamma", "count"),
      };
      expect(result).toStrictEqual({ alpha: 100, count: 42 });
    });

    test("typings disallow picking non-option values", () => {
      expect(
        pickSome(
          // @ts-expect-error - non-option value
          record,
          "delta",
        ),
      ).toStrictEqual(
        // The return value doesn't really matter here, since it's undefined behavior
        // The type error is the important part
        {
          delta: undefined,
        },
      );
    });
  });

  describe("truthy", () => {
    test("undefined", () => {
      expect(truthy("name", undefined)).toStrictEqual({
        // No properties
      });
    });

    test("null", () => {
      expect(truthy("name", null)).toStrictEqual({
        // No properties
      });
    });

    test("falsy empty string", () => {
      expect(truthy("name", "")).toStrictEqual({
        // No properties
      });
    });

    test("falsy number", () => {
      expect(truthy("name", 0)).toStrictEqual({
        // No properties
      });
    });

    test("falsy boolean", () => {
      expect(truthy("name", false)).toStrictEqual({
        // No properties
      });
    });

    test("defined", () => {
      expect(truthy("name", "value")).toStrictEqual({
        name: "value",
      });
    });
  });

  describe("hasNotNullableProperty", () => {
    test("works", () => {
      expect(pipe({ id: "1" }, hasNotNullableProperty("id"))).toBe(true);
      expect(pipe({ id: null }, hasNotNullableProperty("id"))).toBe(false);
    });
  });
});
