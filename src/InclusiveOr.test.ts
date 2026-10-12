import { Effect, Equal, Hash, Option, Result, pipe } from "effect";
import { it } from "@effect/vitest";
import { describe, expect, expectTypeOf, test, vi } from "vitest";
import * as InclusiveOr from "./InclusiveOr.js";

const warning = "Surrounding whitespace removed";
const email = "maya@example.com";
const left = InclusiveOr.LeftOnly({ left: warning });
const right = InclusiveOr.RightOnly({ right: email });
const both = InclusiveOr.LeftAndRight({ left: warning, right: email });
const variants: InclusiveOr.InclusiveOr<string, string>[] = [left, right, both];
const payloads = [null, undefined, 0, false, ""];
const absentPairs = [
  {},
  { left: null },
  { right: null },
  { left: undefined },
  { right: undefined },
  { left: null, right: null },
  { left: null, right: undefined },
  { left: undefined, right: null },
  { left: undefined, right: undefined },
];

describe("InclusiveOr", () => {
  describe("LeftOnly", () => {
    test("keeps the warning with structural equality and hashing", () => {
      const copy = InclusiveOr.LeftOnly({ left: warning });
      expect(left).toStrictEqual({ _tag: "LeftOnly", left: warning });
      expect(Equal.equals(left, copy)).toBe(true);
      expect(Hash.hash(left)).toBe(Hash.hash(copy));
      expect(
        Equal.equals(left, InclusiveOr.LeftOnly({ left: "Missing email" })),
      ).toBe(false);
    });
    test.each(payloads)("preserves a required payload of %s", (value) => {
      expect(InclusiveOr.LeftOnly({ left: value })).toStrictEqual({
        _tag: "LeftOnly",
        left: value,
      });
    });
  });
  describe("RightOnly", () => {
    test("keeps the email with structural equality and hashing", () => {
      const copy = InclusiveOr.RightOnly({ right: email });
      expect(right).toStrictEqual({ _tag: "RightOnly", right: email });
      expect(Equal.equals(right, copy)).toBe(true);
      expect(Hash.hash(right)).toBe(Hash.hash(copy));
      expect(
        Equal.equals(
          right,
          InclusiveOr.RightOnly({ right: "lee@example.com" }),
        ),
      ).toBe(false);
    });
    test.each(payloads)("preserves a required payload of %s", (value) => {
      expect(InclusiveOr.RightOnly({ right: value })).toStrictEqual({
        _tag: "RightOnly",
        right: value,
      });
    });
  });
  describe("LeftAndRight", () => {
    test("keeps both payloads with structural equality and hashing", () => {
      const copy = InclusiveOr.LeftAndRight({ left: warning, right: email });
      expect(both).toStrictEqual({
        _tag: "LeftAndRight",
        left: warning,
        right: email,
      });
      expect(Equal.equals(both, copy)).toBe(true);
      expect(Hash.hash(both)).toBe(Hash.hash(copy));
      expect(
        Equal.equals(
          both,
          InclusiveOr.LeftAndRight({ left: "Missing name", right: email }),
        ),
      ).toBe(false);
      expect(
        Equal.equals(
          both,
          InclusiveOr.LeftAndRight({ left: warning, right: "lee@example.com" }),
        ),
      ).toBe(false);
    });
    test.each(payloads)(
      "preserves required nullish and falsy payloads: %s",
      (value) => {
        expect(
          InclusiveOr.LeftAndRight({ left: value, right: value }),
        ).toStrictEqual({ _tag: "LeftAndRight", left: value, right: value });
      },
    );
  });
  describe("is", () => {
    test.each(variants)("checks every requested tag against $_tag", (value) => {
      expect(pipe(value, InclusiveOr.is("LeftOnly"))).toBe(
        value._tag === "LeftOnly",
      );
      expect(pipe(value, InclusiveOr.is("RightOnly"))).toBe(
        value._tag === "RightOnly",
      );
      expect(pipe(value, InclusiveOr.is("LeftAndRight"))).toBe(
        value._tag === "LeftAndRight",
      );
    });
    test.each([null, undefined, 0, "email", {}, { _tag: "Unknown" }])(
      "rejects a nonmatching unknown: %s",
      (value) => {
        expect(InclusiveOr.is("LeftOnly")(value)).toBe(false);
        expect(InclusiveOr.is("RightOnly")(value)).toBe(false);
        expect(InclusiveOr.is("LeftAndRight")(value)).toBe(false);
      },
    );
    test.each(variants)("narrows an actual union parameter: $_tag", (value) => {
      const read = (value: InclusiveOr.InclusiveOr<string, string>) => {
        if (InclusiveOr.is("LeftOnly")(value)) {
          expectTypeOf(value).toMatchTypeOf<InclusiveOr.LeftOnly<string>>();
          return value.left;
        }
        if (InclusiveOr.is("RightOnly")(value)) {
          expectTypeOf(value).toMatchTypeOf<InclusiveOr.RightOnly<string>>();
          return value.right;
        }
        if (InclusiveOr.is("LeftAndRight")(value)) {
          expectTypeOf(value).toMatchTypeOf<
            InclusiveOr.LeftAndRight<string, string>
          >();
          return value.left + value.right;
        }
        throw new Error("Unexpected tag");
      };
      expect(read(value)).toBe(
        value._tag === "LeftOnly"
          ? warning
          : value._tag === "RightOnly"
            ? email
            : warning + email,
      );
    });
  });
  describe("match", () => {
    test.each(variants)(
      "routes only $_tag with its whole value in both call styles",
      (value) => {
        const handlers = {
          LeftOnly: vi.fn(
            (value: InclusiveOr.LeftOnly<string>) => `Problem: ${value.left}`,
          ),
          RightOnly: vi.fn(
            (value: InclusiveOr.RightOnly<string>) => `Save ${value.right}`,
          ),
          LeftAndRight: vi.fn(
            (value: InclusiveOr.LeftAndRight<string, string>) =>
              `Save ${value.right}: ${value.left}`,
          ),
        };
        const direct = InclusiveOr.match(value, handlers);
        const piped = pipe(value, InclusiveOr.match(handlers));
        expect(piped).toBe(direct);
        expect(direct).toBe(
          {
            LeftOnly: `Problem: ${warning}`,
            RightOnly: `Save ${email}`,
            LeftAndRight: `Save ${email}: ${warning}`,
          }[value._tag],
        );
        expect(handlers[value._tag].mock.calls).toStrictEqual([
          [value],
          [value],
        ]);
        expect(handlers.LeftOnly).toHaveBeenCalledTimes(
          value._tag === "LeftOnly" ? 2 : 0,
        );
        expect(handlers.RightOnly).toHaveBeenCalledTimes(
          value._tag === "RightOnly" ? 2 : 0,
        );
        expect(handlers.LeftAndRight).toHaveBeenCalledTimes(
          value._tag === "LeftAndRight" ? 2 : 0,
        );
      },
    );
  });
  describe("WithLeft", () => {
    test("omitted and undefined companions leave the mandatory warning intact", () => {
      expect(InclusiveOr.WithLeft({ left: warning })).toStrictEqual(left);
      expect(
        InclusiveOr.WithLeft({ left: warning, right: undefined }),
      ).toStrictEqual(left);
      const value: InclusiveOr.WithLeft<string, string> = InclusiveOr.WithLeft({
        left: warning,
        right: email,
      });
      expect(value).toStrictEqual(both);
      expect(value.left).toBe(warning);
    });
    test("a rejected null companion is absent at runtime", () => {
      expect(
        InclusiveOr.WithLeft<string, string>({
          left: warning,
          // @ts-expect-error - null right companion with a non-null string generic
          right: null,
        }),
      ).toStrictEqual(left);
    });
    test.each([0, false, ""])("preserves a falsy companion of %s", (value) => {
      expect(
        InclusiveOr.WithLeft({ left: warning, right: value }),
      ).toStrictEqual(
        InclusiveOr.LeftAndRight({ left: warning, right: value }),
      );
    });
    test.each(payloads)("keeps a required payload of %s", (value) => {
      expect(InclusiveOr.WithLeft({ left: value })).toStrictEqual(
        InclusiveOr.LeftOnly({ left: value }),
      );
      expect(InclusiveOr.WithLeft({ left: value, right: email })).toStrictEqual(
        InclusiveOr.LeftAndRight({ left: value, right: email }),
      );
    });
  });
  describe("WithRight", () => {
    test("omitted and undefined companions leave the mandatory email intact", () => {
      expect(InclusiveOr.WithRight({ right: email })).toStrictEqual(right);
      expect(
        InclusiveOr.WithRight({ left: undefined, right: email }),
      ).toStrictEqual(right);
      const value: InclusiveOr.WithRight<string, string> =
        InclusiveOr.WithRight({ left: warning, right: email });
      expect(value).toStrictEqual(both);
      expect(value.right).toBe(email);
    });
    test("a rejected null companion is absent at runtime", () => {
      expect(
        InclusiveOr.WithRight<string, string>({
          // @ts-expect-error - null left companion with a non-null string generic
          left: null,
          right: email,
        }),
      ).toStrictEqual(right);
    });
    test.each([0, false, ""])("preserves a falsy companion of %s", (value) => {
      expect(
        InclusiveOr.WithRight({ left: value, right: email }),
      ).toStrictEqual(InclusiveOr.LeftAndRight({ left: value, right: email }));
    });
    test.each(payloads)("keeps a required payload of %s", (value) => {
      expect(InclusiveOr.WithRight({ right: value })).toStrictEqual(
        InclusiveOr.RightOnly({ right: value }),
      );
      expect(
        InclusiveOr.WithRight({ left: warning, right: value }),
      ).toStrictEqual(
        InclusiveOr.LeftAndRight({ left: warning, right: value }),
      );
    });
  });
  describe("optionFromNullables", () => {
    test("builds each present variant", () => {
      expect(
        InclusiveOr.optionFromNullables({ left: warning, right: email }),
      ).toStrictEqual(Option.some(both));
      expect(InclusiveOr.optionFromNullables({ left: warning })).toStrictEqual(
        Option.some(left),
      );
      expect(InclusiveOr.optionFromNullables({ right: email })).toStrictEqual(
        Option.some(right),
      );
    });
    test.each([null, undefined])(
      "treats %s as an absent companion",
      (value) => {
        expect(
          InclusiveOr.optionFromNullables({ left: warning, right: value }),
        ).toStrictEqual(Option.some(left));
        expect(
          InclusiveOr.optionFromNullables({ left: value, right: email }),
        ).toStrictEqual(Option.some(right));
      },
    );
    test.each(absentPairs)(
      "returns None when both sides are absent: %s",
      (value) => {
        expect(InclusiveOr.optionFromNullables(value)).toStrictEqual(
          Option.none(),
        );
      },
    );
    test.each([0, false, ""])("keeps falsy present values: %s", (value) => {
      expect(
        InclusiveOr.optionFromNullables({ left: value, right: value }),
      ).toStrictEqual(
        Option.some(InclusiveOr.LeftAndRight({ left: value, right: value })),
      );
      expect(InclusiveOr.optionFromNullables({ left: value })).toStrictEqual(
        Option.some(InclusiveOr.LeftOnly({ left: value })),
      );
      expect(InclusiveOr.optionFromNullables({ right: value })).toStrictEqual(
        Option.some(InclusiveOr.RightOnly({ right: value })),
      );
    });
  });
  describe("fromNullables", () => {
    test.each([
      { input: { left: warning, right: email }, expected: both },
      { input: { left: warning }, expected: left },
      { input: { right: email }, expected: right },
      { input: { left: warning, right: null }, expected: left },
      { input: { left: warning, right: undefined }, expected: left },
      { input: { left: null, right: email }, expected: right },
      { input: { left: undefined, right: email }, expected: right },
    ])(
      "keeps present data without evaluating the fallback: $input",
      ({ input, expected }) => {
        const orElse = vi.fn(() => {
          throw new Error("Unexpected fallback");
        });
        expect(InclusiveOr.fromNullables({ ...input, orElse })).toStrictEqual(
          expected,
        );
        expect(orElse).not.toHaveBeenCalled();
      },
    );
    test.each(absentPairs)(
      "throws the default error for absent sides: %s",
      (value) => {
        expect(() => InclusiveOr.fromNullables(value)).toThrow(
          new Error("Both left and right are nullable"),
        );
      },
    );
    test.each(variants)(
      "uses a custom $_tag fallback exactly once",
      (fallback) => {
        const orElse = vi.fn(() => fallback);
        expect(
          InclusiveOr.fromNullables({ left: null, right: undefined, orElse }),
        ).toStrictEqual(fallback);
        expect(orElse).toHaveBeenCalledExactlyOnceWith();
      },
    );
    test("propagates an error thrown by the custom fallback", () => {
      const error = new Error("No spreadsheet row");
      const orElse = vi.fn(() => {
        throw error;
      });
      expect(() => InclusiveOr.fromNullables({ orElse })).toThrow(error);
      expect(orElse).toHaveBeenCalledTimes(1);
    });
    test.each([0, false, ""])("preserves present falsy data: %s", (value) => {
      const orElse = vi.fn(() => {
        throw new Error("Unexpected fallback");
      });
      expect(
        InclusiveOr.fromNullables({ left: value, right: value, orElse }),
      ).toStrictEqual(InclusiveOr.LeftAndRight({ left: value, right: value }));
      expect(InclusiveOr.fromNullables({ left: value, orElse })).toStrictEqual(
        InclusiveOr.LeftOnly({ left: value }),
      );
      expect(InclusiveOr.fromNullables({ right: value, orElse })).toStrictEqual(
        InclusiveOr.RightOnly({ right: value }),
      );
      expect(orElse).not.toHaveBeenCalled();
    });
  });
  describe("matchLeft", () => {
    test.each(variants)(
      "selects only the appropriate handler for $_tag",
      (value) => {
        const Left = vi.fn((message: string) => `Problem: ${message}`);
        const RightOnly = vi.fn((email: string) => `Save ${email}`);
        expect(pipe(value, InclusiveOr.matchLeft({ Left, RightOnly }))).toBe(
          value._tag === "RightOnly" ? `Save ${email}` : `Problem: ${warning}`,
        );
        expect(Left.mock.calls).toStrictEqual(
          value._tag === "RightOnly" ? [] : [[warning]],
        );
        expect(RightOnly.mock.calls).toStrictEqual(
          value._tag === "RightOnly" ? [[email]] : [],
        );
      },
    );
  });
  describe("matchRight", () => {
    test.each(variants)(
      "selects only the appropriate handler for $_tag",
      (value) => {
        const LeftOnly = vi.fn((message: string) => `Problem: ${message}`);
        const Right = vi.fn((email: string) => `Save ${email}`);
        expect(pipe(value, InclusiveOr.matchRight({ LeftOnly, Right }))).toBe(
          value._tag === "LeftOnly" ? `Problem: ${warning}` : `Save ${email}`,
        );
        expect(LeftOnly.mock.calls).toStrictEqual(
          value._tag === "LeftOnly" ? [[warning]] : [],
        );
        expect(Right.mock.calls).toStrictEqual(
          value._tag === "LeftOnly" ? [] : [[email]],
        );
      },
    );
  });
  describe("orElse", () => {
    test.each(variants)("fills only the missing side of $_tag", (value) => {
      const orElseLeft = vi.fn(() => "No warnings");
      const orElseRight = vi.fn(() => "draft@example.com");
      const result: InclusiveOr.LeftAndRight<string, string> = pipe(
        value,
        InclusiveOr.orElse({ orElseLeft, orElseRight }),
      );
      expect(result).toStrictEqual(
        InclusiveOr.LeftAndRight({
          left: value._tag === "RightOnly" ? "No warnings" : warning,
          right: value._tag === "LeftOnly" ? "draft@example.com" : email,
        }),
      );
      expect(orElseLeft).toHaveBeenCalledTimes(
        value._tag === "RightOnly" ? 1 : 0,
      );
      expect(orElseRight).toHaveBeenCalledTimes(
        value._tag === "LeftOnly" ? 1 : 0,
      );
    });
    test.each([null, undefined])(
      "present %s does not trigger either fallback",
      (value) => {
        const orElseLeft = vi.fn(() => warning);
        const orElseRight = vi.fn(() => email);
        expect(
          pipe(
            InclusiveOr.LeftAndRight({ left: value, right: value }),
            InclusiveOr.orElse({ orElseLeft, orElseRight }),
          ),
        ).toStrictEqual(
          InclusiveOr.LeftAndRight({ left: value, right: value }),
        );
        expect(orElseLeft).not.toHaveBeenCalled();
        expect(orElseRight).not.toHaveBeenCalled();
      },
    );
  });
  describe("leftOrElse", () => {
    test.each(variants)(
      "reads $_tag and falls back only when left is absent",
      (value) => {
        const fallback = vi.fn(() => "Missing left");
        expect(pipe(value, InclusiveOr.leftOrElse(fallback))).toBe(
          value._tag === "RightOnly" ? "Missing left" : warning,
        );
        expect(fallback).toHaveBeenCalledTimes(
          value._tag === "RightOnly" ? 1 : 0,
        );
      },
    );
    test.each(payloads)(
      "keeps a present payload of %s without a fallback",
      (value) => {
        const fallback = vi.fn(() => "Missing left");
        expect(
          pipe(
            InclusiveOr.LeftOnly({ left: value }),
            InclusiveOr.leftOrElse(fallback),
          ),
        ).toBe(value);
        expect(
          pipe(
            InclusiveOr.LeftAndRight({ left: value, right: value }),
            InclusiveOr.leftOrElse(fallback),
          ),
        ).toBe(value);
        expect(fallback).not.toHaveBeenCalled();
      },
    );
  });
  describe("leftOrUndefined", () => {
    test.each(variants)("projects left from $_tag", (value) => {
      expect(pipe(value, InclusiveOr.leftOrUndefined)).toBe(
        value._tag === "RightOnly" ? undefined : warning,
      );
    });
    test.each(payloads)("keeps a present payload of %s", (value) => {
      expect(
        pipe(
          InclusiveOr.LeftOnly({ left: value }),
          InclusiveOr.leftOrUndefined,
        ),
      ).toBe(value);
      expect(
        pipe(
          InclusiveOr.LeftAndRight({ left: value, right: value }),
          InclusiveOr.leftOrUndefined,
        ),
      ).toBe(value);
    });
  });
  describe("leftOption", () => {
    test.each(variants)("projects left from $_tag as an Option", (value) => {
      expect(pipe(value, InclusiveOr.leftOption)).toStrictEqual(
        value._tag === "RightOnly" ? Option.none() : Option.some(warning),
      );
    });
    test.each(payloads)(
      "wraps present %s in Some, including undefined",
      (value) => {
        expect(
          pipe(InclusiveOr.LeftOnly({ left: value }), InclusiveOr.leftOption),
        ).toStrictEqual(Option.some(value));
        expect(
          pipe(
            InclusiveOr.LeftAndRight({ left: value, right: value }),
            InclusiveOr.leftOption,
          ),
        ).toStrictEqual(Option.some(value));
      },
    );
  });
  describe("rightOrElse", () => {
    test.each(variants)(
      "reads $_tag and falls back only when right is absent",
      (value) => {
        const fallback = vi.fn(() => "Missing right");
        expect(pipe(value, InclusiveOr.rightOrElse(fallback))).toBe(
          value._tag === "LeftOnly" ? "Missing right" : email,
        );
        expect(fallback).toHaveBeenCalledTimes(
          value._tag === "LeftOnly" ? 1 : 0,
        );
      },
    );
    test.each(payloads)(
      "keeps a present payload of %s without a fallback",
      (value) => {
        const fallback = vi.fn(() => "Missing right");
        expect(
          pipe(
            InclusiveOr.RightOnly({ right: value }),
            InclusiveOr.rightOrElse(fallback),
          ),
        ).toBe(value);
        expect(
          pipe(
            InclusiveOr.LeftAndRight({ left: value, right: value }),
            InclusiveOr.rightOrElse(fallback),
          ),
        ).toBe(value);
        expect(fallback).not.toHaveBeenCalled();
      },
    );
  });
  describe("rightOrUndefined", () => {
    test.each(variants)("projects right from $_tag", (value) => {
      expect(pipe(value, InclusiveOr.rightOrUndefined)).toBe(
        value._tag === "LeftOnly" ? undefined : email,
      );
    });
    test.each(payloads)("keeps a present payload of %s", (value) => {
      expect(
        pipe(
          InclusiveOr.RightOnly({ right: value }),
          InclusiveOr.rightOrUndefined,
        ),
      ).toBe(value);
      expect(
        pipe(
          InclusiveOr.LeftAndRight({ left: value, right: value }),
          InclusiveOr.rightOrUndefined,
        ),
      ).toBe(value);
    });
  });
  describe("rightOption", () => {
    test.each(variants)("projects right from $_tag as an Option", (value) => {
      expect(pipe(value, InclusiveOr.rightOption)).toStrictEqual(
        value._tag === "LeftOnly" ? Option.none() : Option.some(email),
      );
    });
    test.each(payloads)(
      "wraps present %s in Some, including undefined",
      (value) => {
        expect(
          pipe(
            InclusiveOr.RightOnly({ right: value }),
            InclusiveOr.rightOption,
          ),
        ).toStrictEqual(Option.some(value));
        expect(
          pipe(
            InclusiveOr.LeftAndRight({ left: value, right: value }),
            InclusiveOr.rightOption,
          ),
        ).toStrictEqual(Option.some(value));
      },
    );
  });
  describe("mapBoth", () => {
    test.each(variants)(
      "maps only the present sides of $_tag without changing the input",
      (value) => {
        const mapLeft = vi.fn((message: string) => `Warning: ${message}`);
        const mapRight = vi.fn((email: string) => email.toUpperCase());
        const original = { ...value };
        const result = pipe(value, InclusiveOr.mapBoth({ mapLeft, mapRight }));
        expect(result).toStrictEqual(
          {
            LeftOnly: InclusiveOr.LeftOnly({ left: `Warning: ${warning}` }),
            RightOnly: InclusiveOr.RightOnly({ right: email.toUpperCase() }),
            LeftAndRight: InclusiveOr.LeftAndRight({
              left: `Warning: ${warning}`,
              right: email.toUpperCase(),
            }),
          }[value._tag],
        );
        expect(mapLeft.mock.calls).toStrictEqual(
          value._tag === "RightOnly" ? [] : [[warning]],
        );
        expect(mapRight.mock.calls).toStrictEqual(
          value._tag === "LeftOnly" ? [] : [[email]],
        );
        // Check the original reference after asserting the mapped result.
        expect(value).toStrictEqual(original);
      },
    );
  });
  describe("mapLeft", () => {
    test.each(variants)(
      "maps only a present left in $_tag without changing the input",
      (value) => {
        const mapper = vi.fn((value: string) => `Warning: ${value}`);
        const original = { ...value };
        expect(pipe(value, InclusiveOr.mapLeft(mapper))).toStrictEqual(
          {
            LeftOnly: InclusiveOr.LeftOnly({ left: `Warning: ${warning}` }),
            RightOnly: InclusiveOr.RightOnly({ right: email }),
            LeftAndRight: InclusiveOr.LeftAndRight({
              left: `Warning: ${warning}`,
              right: email,
            }),
          }[value._tag],
        );
        expect(mapper.mock.calls).toStrictEqual(
          value._tag === "RightOnly" ? [] : [[warning]],
        );
        // Check the original reference after asserting the mapped result.
        expect(value).toStrictEqual(original);
      },
    );
  });
  describe("flatMapLeft", () => {
    test.each(variants)(
      "replaces all of $_tag with each mapper-result variant when left exists",
      (value) => {
        const replacements: InclusiveOr.InclusiveOr<string, string>[] = [
          InclusiveOr.LeftOnly({ left: "Missing name" }),
          InclusiveOr.RightOnly({ right: "lee@example.com" }),
          InclusiveOr.LeftAndRight({
            left: "Name trimmed",
            right: "lee@example.com",
          }),
        ];
        for (const replacement of replacements) {
          const mapper = vi.fn<
            (value: string) => InclusiveOr.InclusiveOr<string, string>
          >(() => replacement);
          const original = { ...value };
          // A both-sides input loses its original opposite payload; nothing is accumulated.
          expect(pipe(value, InclusiveOr.flatMapLeft(mapper))).toStrictEqual(
            value._tag === "RightOnly" ? value : replacement,
          );
          expect(mapper.mock.calls).toStrictEqual(
            value._tag === "RightOnly" ? [] : [[warning]],
          );
          expect(value).toStrictEqual(original);
        }
      },
    );
  });
  describe("mapRight", () => {
    test.each(variants)(
      "maps only a present right in $_tag without changing the input",
      (value) => {
        const mapper = vi.fn((value: string) => value.toUpperCase());
        const original = { ...value };
        expect(pipe(value, InclusiveOr.mapRight(mapper))).toStrictEqual(
          {
            LeftOnly: InclusiveOr.LeftOnly({ left: warning }),
            RightOnly: InclusiveOr.RightOnly({ right: email.toUpperCase() }),
            LeftAndRight: InclusiveOr.LeftAndRight({
              left: warning,
              right: email.toUpperCase(),
            }),
          }[value._tag],
        );
        expect(mapper.mock.calls).toStrictEqual(
          value._tag === "LeftOnly" ? [] : [[email]],
        );
        // Check the original reference after asserting the mapped result.
        expect(value).toStrictEqual(original);
      },
    );
  });
  describe("flatMapRight", () => {
    test.each(variants)(
      "replaces all of $_tag with each mapper-result variant when right exists",
      (value) => {
        const replacements: InclusiveOr.InclusiveOr<string, string>[] = [
          InclusiveOr.LeftOnly({ left: "Missing name" }),
          InclusiveOr.RightOnly({ right: "lee@example.com" }),
          InclusiveOr.LeftAndRight({
            left: "Name trimmed",
            right: "lee@example.com",
          }),
        ];
        for (const replacement of replacements) {
          const mapper = vi.fn<
            (value: string) => InclusiveOr.InclusiveOr<string, string>
          >(() => replacement);
          const original = { ...value };
          // A both-sides input loses its original opposite payload; nothing is accumulated.
          expect(pipe(value, InclusiveOr.flatMapRight(mapper))).toStrictEqual(
            value._tag === "LeftOnly" ? value : replacement,
          );
          expect(mapper.mock.calls).toStrictEqual(
            value._tag === "LeftOnly" ? [] : [[email]],
          );
          expect(value).toStrictEqual(original);
        }
      },
    );
  });
  describe("mapBothEffect", () => {
    it.effect(
      "maps present sides of all variants in left-before-right execution order",
      () =>
        Effect.gen(function* () {
          for (const value of variants) {
            const execute = vi.fn((side: string, value: string) =>
              side === "left" ? `Warning: ${value}` : value.toUpperCase(),
            );
            const mapLeft = vi.fn((value: string) =>
              Effect.sync(() => execute("left", value)),
            );
            const mapRight = vi.fn((value: string) =>
              Effect.sync(() => execute("right", value)),
            );
            const original = { ...value };
            const effect = pipe(
              value,
              InclusiveOr.mapBothEffect({ mapLeft, mapRight }),
            );
            // Constructing the mappers must not run the effects.
            expect(execute).not.toHaveBeenCalled();
            const result = yield* effect;
            expect(result).toStrictEqual(
              {
                LeftOnly: InclusiveOr.LeftOnly({ left: `Warning: ${warning}` }),
                RightOnly: InclusiveOr.RightOnly({
                  right: email.toUpperCase(),
                }),
                LeftAndRight: InclusiveOr.LeftAndRight({
                  left: `Warning: ${warning}`,
                  right: email.toUpperCase(),
                }),
              }[value._tag],
            );
            expect(execute.mock.calls).toStrictEqual(
              {
                LeftOnly: [["left", warning]],
                RightOnly: [["right", email]],
                LeftAndRight: [
                  ["left", warning],
                  ["right", email],
                ],
              }[value._tag],
            );
            expect(mapLeft.mock.calls).toStrictEqual(
              value._tag === "RightOnly" ? [] : [[warning]],
            );
            expect(mapRight.mock.calls).toStrictEqual(
              value._tag === "LeftOnly" ? [] : [[email]],
            );
            expect(value).toStrictEqual(original);
          }
        }),
    );
    it.effect(
      "propagates left failure in all variants and short-circuits execution",
      () =>
        Effect.gen(function* () {
          for (const value of variants) {
            const execute = vi.fn<(side: string, value: string) => undefined>(
              () => undefined,
            );
            const result = yield* pipe(
              value,
              InclusiveOr.mapBothEffect({
                mapLeft: (value: string) =>
                  Effect.gen(function* () {
                    execute("left", value);
                    return yield* Effect.fail("Warning lookup failed");
                  }),
                mapRight: (value: string) =>
                  Effect.sync(() => {
                    execute("right", value);
                    return value;
                  }),
              }),
              Effect.result,
            );
            expect(result).toStrictEqual(
              value._tag === "RightOnly"
                ? Result.succeed(value)
                : Result.fail("Warning lookup failed"),
            );
            expect(execute.mock.calls).toStrictEqual(
              value._tag === "RightOnly"
                ? [["right", email]]
                : [["left", warning]],
            );
          }
        }),
    );
    it.effect(
      "propagates right failure in all variants and short-circuits execution",
      () =>
        Effect.gen(function* () {
          for (const value of variants) {
            const execute = vi.fn<(side: string, value: string) => undefined>(
              () => undefined,
            );
            const result = yield* pipe(
              value,
              InclusiveOr.mapBothEffect({
                mapLeft: (value: string) =>
                  Effect.sync(() => {
                    execute("left", value);
                    return value;
                  }),
                mapRight: (value: string) =>
                  Effect.gen(function* () {
                    execute("right", value);
                    return yield* Effect.fail("Email lookup failed");
                  }),
              }),
              Effect.result,
            );
            expect(result).toStrictEqual(
              value._tag === "LeftOnly"
                ? Result.succeed(value)
                : Result.fail("Email lookup failed"),
            );
            expect(execute.mock.calls).toStrictEqual(
              value._tag === "LeftAndRight"
                ? [
                    ["left", warning],
                    ["right", email],
                  ]
                : value._tag === "LeftOnly"
                  ? [["left", warning]]
                  : [["right", email]],
            );
          }
        }),
    );
  });
  describe("mapLeftEffect", () => {
    it.effect("maps only the present left of all variants", () =>
      Effect.gen(function* () {
        for (const value of variants) {
          const execute = vi.fn((value: string) => `Warning: ${value}`);
          const mapper = vi.fn((value: string) =>
            Effect.sync(() => execute(value)),
          );
          const original = { ...value };
          const effect = pipe(value, InclusiveOr.mapLeftEffect(mapper));
          expect(execute).not.toHaveBeenCalled();
          const result = yield* effect;
          expect(result).toStrictEqual(
            {
              LeftOnly: InclusiveOr.LeftOnly({ left: `Warning: ${warning}` }),
              RightOnly: InclusiveOr.RightOnly({ right: email }),
              LeftAndRight: InclusiveOr.LeftAndRight({
                left: `Warning: ${warning}`,
                right: email,
              }),
            }[value._tag],
          );
          expect(mapper.mock.calls).toStrictEqual(
            value._tag === "RightOnly" ? [] : [[warning]],
          );
          expect(execute.mock.calls).toStrictEqual(
            value._tag === "RightOnly" ? [] : [[warning]],
          );
          expect(value).toStrictEqual(original);
        }
      }),
    );
    it.effect("fails only when left is present in all variants", () =>
      Effect.gen(function* () {
        for (const value of variants) {
          const execute = vi.fn<(value: string) => undefined>(() => undefined);
          const mapper = vi.fn((value: string) =>
            Effect.gen(function* () {
              execute(value);
              return yield* Effect.fail("left lookup failed");
            }),
          );
          const result = yield* pipe(
            value,
            InclusiveOr.mapLeftEffect(mapper),
            Effect.result,
          );
          expect(result).toStrictEqual(
            value._tag === "RightOnly"
              ? Result.succeed(value)
              : Result.fail("left lookup failed"),
          );
          expect(mapper.mock.calls).toStrictEqual(
            value._tag === "RightOnly" ? [] : [[warning]],
          );
          expect(execute.mock.calls).toStrictEqual(
            value._tag === "RightOnly" ? [] : [[warning]],
          );
        }
      }),
    );
  });
  describe("flatMapLeftEffect", () => {
    it.effect(
      "replaces all variants with every effectful mapper-result variant",
      () =>
        Effect.gen(function* () {
          for (const value of variants) {
            const replacements: InclusiveOr.InclusiveOr<string, string>[] = [
              InclusiveOr.LeftOnly({ left: "Missing name" }),
              InclusiveOr.RightOnly({ right: "lee@example.com" }),
              InclusiveOr.LeftAndRight({
                left: "Name trimmed",
                right: "lee@example.com",
              }),
            ];
            for (const replacement of replacements) {
              const execute = vi.fn<
                (value: string) => InclusiveOr.InclusiveOr<string, string>
              >(() => replacement);
              const mapper = vi.fn((value: string) =>
                Effect.sync(() => execute(value)),
              );
              const original = { ...value };
              const effect = pipe(value, InclusiveOr.flatMapLeftEffect(mapper));
              expect(execute).not.toHaveBeenCalled();
              const result = yield* effect;
              // A both-sides input loses its original opposite payload.
              expect(result).toStrictEqual(
                value._tag === "RightOnly" ? value : replacement,
              );
              expect(mapper.mock.calls).toStrictEqual(
                value._tag === "RightOnly" ? [] : [[warning]],
              );
              expect(execute.mock.calls).toStrictEqual(
                value._tag === "RightOnly" ? [] : [[warning]],
              );
              expect(value).toStrictEqual(original);
            }
          }
        }),
    );
    it.effect("fails only when left is present in all variants", () =>
      Effect.gen(function* () {
        for (const value of variants) {
          const execute = vi.fn<(value: string) => undefined>(() => undefined);
          const mapper = vi.fn((value: string) =>
            Effect.gen(function* () {
              execute(value);
              return yield* Effect.fail("left lookup failed");
            }),
          );
          const result = yield* pipe(
            value,
            InclusiveOr.flatMapLeftEffect(mapper),
            Effect.result,
          );
          expect(result).toStrictEqual(
            value._tag === "RightOnly"
              ? Result.succeed(value)
              : Result.fail("left lookup failed"),
          );
          expect(mapper.mock.calls).toStrictEqual(
            value._tag === "RightOnly" ? [] : [[warning]],
          );
          expect(execute.mock.calls).toStrictEqual(
            value._tag === "RightOnly" ? [] : [[warning]],
          );
        }
      }),
    );
  });
  describe("mapRightEffect", () => {
    it.effect("maps only the present right of all variants", () =>
      Effect.gen(function* () {
        for (const value of variants) {
          const execute = vi.fn((value: string) => value.toUpperCase());
          const mapper = vi.fn((value: string) =>
            Effect.sync(() => execute(value)),
          );
          const original = { ...value };
          const effect = pipe(value, InclusiveOr.mapRightEffect(mapper));
          expect(execute).not.toHaveBeenCalled();
          const result = yield* effect;
          expect(result).toStrictEqual(
            {
              LeftOnly: InclusiveOr.LeftOnly({ left: warning }),
              RightOnly: InclusiveOr.RightOnly({ right: email.toUpperCase() }),
              LeftAndRight: InclusiveOr.LeftAndRight({
                left: warning,
                right: email.toUpperCase(),
              }),
            }[value._tag],
          );
          expect(mapper.mock.calls).toStrictEqual(
            value._tag === "LeftOnly" ? [] : [[email]],
          );
          expect(execute.mock.calls).toStrictEqual(
            value._tag === "LeftOnly" ? [] : [[email]],
          );
          expect(value).toStrictEqual(original);
        }
      }),
    );
    it.effect("fails only when right is present in all variants", () =>
      Effect.gen(function* () {
        for (const value of variants) {
          const execute = vi.fn<(value: string) => undefined>(() => undefined);
          const mapper = vi.fn((value: string) =>
            Effect.gen(function* () {
              execute(value);
              return yield* Effect.fail("right lookup failed");
            }),
          );
          const result = yield* pipe(
            value,
            InclusiveOr.mapRightEffect(mapper),
            Effect.result,
          );
          expect(result).toStrictEqual(
            value._tag === "LeftOnly"
              ? Result.succeed(value)
              : Result.fail("right lookup failed"),
          );
          expect(mapper.mock.calls).toStrictEqual(
            value._tag === "LeftOnly" ? [] : [[email]],
          );
          expect(execute.mock.calls).toStrictEqual(
            value._tag === "LeftOnly" ? [] : [[email]],
          );
        }
      }),
    );
  });
  describe("flatMapRightEffect", () => {
    it.effect(
      "replaces all variants with every effectful mapper-result variant",
      () =>
        Effect.gen(function* () {
          for (const value of variants) {
            const replacements: InclusiveOr.InclusiveOr<string, string>[] = [
              InclusiveOr.LeftOnly({ left: "Missing name" }),
              InclusiveOr.RightOnly({ right: "lee@example.com" }),
              InclusiveOr.LeftAndRight({
                left: "Name trimmed",
                right: "lee@example.com",
              }),
            ];
            for (const replacement of replacements) {
              const execute = vi.fn<
                (value: string) => InclusiveOr.InclusiveOr<string, string>
              >(() => replacement);
              const mapper = vi.fn((value: string) =>
                Effect.sync(() => execute(value)),
              );
              const original = { ...value };
              const effect = pipe(
                value,
                InclusiveOr.flatMapRightEffect(mapper),
              );
              expect(execute).not.toHaveBeenCalled();
              const result = yield* effect;
              // A both-sides input loses its original opposite payload.
              expect(result).toStrictEqual(
                value._tag === "LeftOnly" ? value : replacement,
              );
              expect(mapper.mock.calls).toStrictEqual(
                value._tag === "LeftOnly" ? [] : [[email]],
              );
              expect(execute.mock.calls).toStrictEqual(
                value._tag === "LeftOnly" ? [] : [[email]],
              );
              expect(value).toStrictEqual(original);
            }
          }
        }),
    );
    it.effect("fails only when right is present in all variants", () =>
      Effect.gen(function* () {
        for (const value of variants) {
          const execute = vi.fn<(value: string) => undefined>(() => undefined);
          const mapper = vi.fn((value: string) =>
            Effect.gen(function* () {
              execute(value);
              return yield* Effect.fail("right lookup failed");
            }),
          );
          const result = yield* pipe(
            value,
            InclusiveOr.flatMapRightEffect(mapper),
            Effect.result,
          );
          expect(result).toStrictEqual(
            value._tag === "LeftOnly"
              ? Result.succeed(value)
              : Result.fail("right lookup failed"),
          );
          expect(mapper.mock.calls).toStrictEqual(
            value._tag === "LeftOnly" ? [] : [[email]],
          );
          expect(execute.mock.calls).toStrictEqual(
            value._tag === "LeftOnly" ? [] : [[email]],
          );
        }
      }),
    );
  });
  describe("zip", () => {
    test.each([
      {
        name: "unmatched warning",
        warnings: [warning, "Missing email"],
        contacts: [email],
        expected: [`Save ${email}: ${warning}`, "Problem: Missing email"],
      },
      {
        name: "unmatched contact",
        warnings: [warning],
        contacts: [email, "lee@example.com"],
        expected: [`Save ${email}: ${warning}`, "Save lee@example.com"],
      },
    ])(
      "collects transformed callback results with an $name in both call styles",
      ({ warnings, contacts, expected }) => {
        const callback = (value: InclusiveOr.InclusiveOr<string, string>) =>
          InclusiveOr.match(value, {
            LeftOnly: ({ left }) => `Problem: ${left}`,
            RightOnly: ({ right }) => `Save ${right}`,
            LeftAndRight: ({ left, right }) => `Save ${right}: ${left}`,
          });
        const direct = InclusiveOr.zip(warnings, contacts, callback);
        const piped = pipe(warnings, InclusiveOr.zip(contacts, callback));
        expect(direct).toStrictEqual(expected);
        expect(piped).toStrictEqual(expected);
        expect(piped).toStrictEqual(direct);
      },
    );
    const cases = [
      {
        name: "equal lengths",
        warnings: [warning, "Missing name"],
        contacts: [email, "lee@example.com"],
        expected: [
          both,
          InclusiveOr.LeftAndRight({
            left: "Missing name",
            right: "lee@example.com",
          }),
        ],
      },
      {
        name: "singletons",
        warnings: [warning],
        contacts: [email],
        expected: [both],
      },
      {
        name: "longer warnings",
        warnings: [warning, "Missing name"],
        contacts: [email],
        expected: [both, InclusiveOr.LeftOnly({ left: "Missing name" })],
      },
      {
        name: "longer contacts",
        warnings: [warning],
        contacts: [email, "lee@example.com"],
        expected: [both, InclusiveOr.RightOnly({ right: "lee@example.com" })],
      },
      { name: "both empty", warnings: [], contacts: [], expected: [] },
      {
        name: "empty warnings",
        warnings: [],
        contacts: [email],
        expected: [right],
      },
      {
        name: "empty contacts",
        warnings: [warning],
        contacts: [],
        expected: [left],
      },
      {
        name: "undefined warning",
        warnings: [undefined],
        contacts: [email],
        expected: [InclusiveOr.LeftAndRight({ left: undefined, right: email })],
      },
      {
        name: "undefined contact",
        warnings: [warning],
        contacts: [undefined],
        expected: [
          InclusiveOr.LeftAndRight({ left: warning, right: undefined }),
        ],
      },
      {
        name: "both undefined",
        warnings: [undefined],
        contacts: [undefined],
        expected: [
          InclusiveOr.LeftAndRight({ left: undefined, right: undefined }),
        ],
      },
      {
        name: "undefined warning tail",
        warnings: [warning, undefined],
        contacts: [email],
        expected: [both, InclusiveOr.LeftOnly({ left: undefined })],
      },
      {
        name: "undefined contact tail",
        warnings: [warning],
        contacts: [email, undefined],
        expected: [both, InclusiveOr.RightOnly({ right: undefined })],
      },
      {
        name: "undefined warning without contacts",
        warnings: [undefined],
        contacts: [],
        expected: [InclusiveOr.LeftOnly({ left: undefined })],
      },
      {
        name: "undefined contact without warnings",
        warnings: [],
        contacts: [undefined],
        expected: [InclusiveOr.RightOnly({ right: undefined })],
      },
    ];
    test.each(cases)(
      "$name: bounds determine presence and both call styles agree",
      ({ warnings, contacts, expected }) => {
        const callback = vi.fn(
          (
            value: InclusiveOr.InclusiveOr<
              string | undefined,
              string | undefined
            >,
          ) => value,
        );
        const originalWarnings = [...warnings];
        const originalContacts = [...contacts];
        const direct = InclusiveOr.zip(warnings, contacts, callback);
        expect(direct).toStrictEqual(expected);
        expect(callback.mock.calls).toStrictEqual(
          expected.map((value) => [value]),
        );
        callback.mockClear();
        const piped = pipe(warnings, InclusiveOr.zip(contacts, callback));
        expect(piped).toStrictEqual(direct);
        expect(callback.mock.calls).toStrictEqual(
          expected.map((value) => [value]),
        );
        // Assert the original arrays after checking both outputs.
        expect(warnings).toStrictEqual(originalWarnings);
        expect(contacts).toStrictEqual(originalContacts);
      },
    );
  });
  describe("orUndefined", () => {
    test.each(variants)(
      "fills missing sides of $_tag with undefined",
      (value) => {
        expect(pipe(value, InclusiveOr.orUndefined)).toStrictEqual(
          InclusiveOr.LeftAndRight({
            left: value._tag === "RightOnly" ? undefined : warning,
            right: value._tag === "LeftOnly" ? undefined : email,
          }),
        );
      },
    );
    test.each([null, undefined])("preserves present %s", (value) => {
      expect(
        pipe(
          InclusiveOr.LeftAndRight({ left: value, right: value }),
          InclusiveOr.orUndefined,
        ),
      ).toStrictEqual(InclusiveOr.LeftAndRight({ left: value, right: value }));
    });
  });
});
