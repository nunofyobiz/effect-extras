import { Array, Option, pipe } from "effect";
import { describe, expect, expectTypeOf, test } from "vitest";
import {
  defined,
  filterDefined,
  hasNotNullableProperty,
  pickSome,
  some,
  truthy,
} from "./StructX.js";

describe("Struct utils", () => {
  describe("defined", () => {
    test("undefined", () => {
      expect(defined("name", undefined)).toStrictEqual({
        // No properties
      });
      expect(Object.hasOwn(defined("name", undefined), "name")).toBe(false);
    });

    test.each([-0, Number.NaN, 0n])("retains defined boundary %s", (value) => {
      expect(defined("notificationLimit", value)).toStrictEqual({
        notificationLimit: value,
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

    test("narrows an optional value without retaining undefined", () => {
      const value: string | undefined = Math.random() > 2 ? undefined : "Ada";
      const result: Partial<Record<"name", string>> = defined("name", value);
      expect(result).toStrictEqual({ name: "Ada" });
    });
  });

  describe("filterDefined", () => {
    test("singleton retained value", () => {
      expect(filterDefined({ notifications: false })).toStrictEqual({
        notifications: false,
      });
    });

    test("singleton undefined is omitted", () => {
      const result = filterDefined({ theme: undefined });
      expect(result).toStrictEqual({});
      expect(Object.hasOwn(result, "theme")).toBe(false);
    });

    test("only own enumerable string properties survive", () => {
      const settings: Record<string, unknown> = Object.create({
        theme: "dark",
      });
      Object.defineProperty(settings, "fontSize", { value: 14 });
      settings.notifications = false;

      expect(filterDefined(settings)).toStrictEqual({ notifications: false });
    });

    test("empty input", () => {
      const input = {};
      const result = filterDefined(input);

      expect(result).toStrictEqual({});
      expect(result).not.toBe(input);
    });

    test("preserves order and omits undefined without mutating the input", () => {
      const input = { b: 0, a: undefined, c: "", d: false, e: null };
      const result = filterDefined(input);

      expect(result).toStrictEqual({ b: 0, c: "", d: false, e: null });
      expect(Object.keys(result)).toStrictEqual(["b", "c", "d", "e"]);
      expect("a" in result).toBe(false);
      expect(result).not.toBe(input);
      // This assertion targets the original input, not the filtered result.
      expect(input).toStrictEqual({
        b: 0,
        a: undefined,
        c: "",
        d: false,
        e: null,
      });
    });

    test("keeps an own enumerable __proto__ property and drops symbols", () => {
      const symbol = Symbol("ignored");
      const input: Record<string, unknown> = { [symbol]: "symbol" };
      Object.defineProperty(input, "__proto__", {
        configurable: true,
        enumerable: true,
        value: "kept",
      });

      const result = filterDefined(input);

      expect(Object.hasOwn(result, "__proto__")).toBe(true);
      expect(Object.getOwnPropertyDescriptor(result, "__proto__")?.value).toBe(
        "kept",
      );
      expect(Object.getOwnPropertySymbols(result)).toStrictEqual([]);
      expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    });

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
          negativeZero: -0,
          notANumber: Number.NaN,
          zeroBigInt: 0n,
        }),
      ).toStrictEqual({
        a: "",
        b: 0,
        c: false,
        d: null,
        negativeZero: -0,
        notANumber: Number.NaN,
        zeroBigInt: 0n,
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
      expect(Object.hasOwn(some("name", Option.none()), "name")).toBe(false);
    });

    test.each([undefined, null, false, "", 0, -0, Number.NaN, 0n])(
      "some preserves nullish or falsy payload %s",
      (value) => {
        const result = some("setting", Option.some(value));
        expect(result).toStrictEqual({ setting: value });
        expect(Object.hasOwn(result, "setting")).toBe(true);
      },
    );

    test.each([{ displayName: "Ada" }, []])(
      "some preserves reference payload %j",
      (value) => {
        expect(some("profile", Option.some(value)).profile).toBe(value);
      },
    );

    test("some returns singleton record", () => {
      expect(some("name", Option.some("value"))).toStrictEqual({
        name: "value",
      });
    });
  });

  describe("pickSome", () => {
    test("empty lookup with either public overload", () => {
      const settings: Record<string, Option.Option<string>> = {};
      expect(pickSome(settings, "theme")).toStrictEqual({});
      expect(pickSome(settings, "theme", "selectedTheme")).toStrictEqual({});
    });

    test("singleton None with either public overload", () => {
      const settings = { theme: Option.none<string>() };
      expect(pickSome(settings, "theme")).toStrictEqual({});
      expect(pickSome(settings, "theme", "selectedTheme")).toStrictEqual({});
    });

    test.each([undefined, null, false, "", 0, -0, Number.NaN, 0n])(
      "singleton Some preserves payload %s with either public overload",
      (value) => {
        const settings = { theme: Option.some(value) };
        const originalKey = pickSome(settings, "theme");
        const renamed = pickSome(settings, "theme", "selectedTheme");
        expect(originalKey).toStrictEqual({ theme: value });
        expect(Object.hasOwn(originalKey, "theme")).toBe(true);
        expect(renamed).toStrictEqual({ selectedTheme: value });
        expect(Object.hasOwn(renamed, "selectedTheme")).toBe(true);
        expect(Object.hasOwn(renamed, "theme")).toBe(false);
      },
    );

    test.each([{ displayName: "Ada" }, []])(
      "preserves reference payload %j with either public overload",
      (value) => {
        const settings = { profile: Option.some(value) };
        expect(pickSome(settings, "profile").profile).toBe(value);
        expect(pickSome(settings, "profile", "user").user).toBe(value);
      },
    );

    test("unchanged and empty-string output keys", () => {
      const settings = { theme: Option.some("dark") };
      expect(pickSome(settings, "theme", "theme")).toStrictEqual({
        theme: "dark",
      });
      expect(pickSome(settings, "theme", "")).toStrictEqual({ "": "dark" });
    });

    test("empty-string lookup key with either public overload", () => {
      const settings = { "": Option.some("dark") };
      expect(pickSome(settings, "")).toStrictEqual({ "": "dark" });
      expect(pickSome(settings, "", "theme")).toStrictEqual({ theme: "dark" });
    });

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
    test.each([-0, Number.NaN, 0n])("omits falsy boundary %s", (value) => {
      const result = truthy("notificationLimit", value);
      expect(result).toStrictEqual({});
      expect(Object.hasOwn(result, "notificationLimit")).toBe(false);
    });

    test.each([true, 1, -1, 1n, -1n])("retains truthy value %s", (value) => {
      expect(truthy("setting", value)).toStrictEqual({ setting: value });
    });

    test.each([{}, []])("retains empty reference value %j", (value) => {
      expect(truthy("setting", value).setting).toBe(value);
    });

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
    interface Profile {
      nickname?: string | number | boolean | bigint | null | undefined;
    }
    const cases: [Profile, boolean][] = [
      [{ nickname: "Ada" }, true],
      [{ nickname: "" }, true],
      [{ nickname: false }, true],
      [{ nickname: 0 }, true],
      [{ nickname: -0 }, true],
      [{ nickname: Number.NaN }, true],
      [{ nickname: 0n }, true],
      [{ nickname: null }, false],
      [{ nickname: undefined }, false],
      [{}, false],
    ];

    test.each(cases)(
      "direct and piped calls agree for %s",
      (profile, expected) => {
        const direct = hasNotNullableProperty(profile, "nickname");
        const piped = pipe(
          profile,
          hasNotNullableProperty<Profile, "nickname">("nickname"),
        );
        expect(direct).toBe(expected);
        expect(piped).toBe(direct);
      },
    );

    test("direct guard narrows a nullable property", () => {
      const uppercaseName = (profile: {
        displayName: string | null | undefined;
      }) => {
        if (hasNotNullableProperty(profile, "displayName")) {
          expectTypeOf(profile.displayName).toEqualTypeOf<string>();
          return profile.displayName.toUpperCase();
        }
        return "Anonymous";
      };

      expect(uppercaseName({ displayName: "Ada" })).toBe("ADA");
      expect(uppercaseName({ displayName: null })).toBe("Anonymous");
    });

    test("curried filtering predicate narrows an optional nullable property", () => {
      interface NamedProfile {
        displayName?: string | null | undefined;
      }
      const profiles: NamedProfile[] = [
        { displayName: "Ada" },
        { displayName: null },
        { displayName: undefined },
        {},
        { displayName: "" },
      ];
      const names = pipe(
        profiles,
        Array.filter(
          hasNotNullableProperty<NamedProfile, "displayName">("displayName"),
        ),
        Array.map((profile) => {
          expectTypeOf(profile.displayName).toEqualTypeOf<string>();
          return profile.displayName.toUpperCase();
        }),
      );

      expect(names).toStrictEqual(["ADA", ""]);
    });
  });
});
