import { Option, pipe } from "effect";
import { describe, expect, test, vi } from "vitest";
import {
  fromNullableOption,
  ifSome,
  inspectSome,
  mapSomeOrNull,
  mapSomeOrUndefined,
  tupleOf,
} from "./OptionX.js";

describe("Option utils", () => {
  describe("tupleOf", () => {
    test("both Some → Some([a, b])", () => {
      const direct = tupleOf(Option.some(1), Option.some("a"));
      const piped = pipe(Option.some(1), tupleOf(Option.some("a")));
      expect(direct).toStrictEqual(Option.some([1, "a"]));
      expect(piped).toStrictEqual(direct);
    });

    test("first None → None", () => {
      const direct = tupleOf(Option.none<number>(), Option.some("a"));
      const piped = pipe(Option.none<number>(), tupleOf(Option.some("a")));
      expect(direct).toStrictEqual(Option.none());
      expect(piped).toStrictEqual(direct);
    });

    test("second None → None", () => {
      const direct = tupleOf(Option.some(1), Option.none<string>());
      const piped = pipe(Option.some(1), tupleOf(Option.none<string>()));
      expect(direct).toStrictEqual(Option.none());
      expect(piped).toStrictEqual(direct);
    });

    test("both None → None", () => {
      const direct = tupleOf(Option.none<number>(), Option.none<string>());
      const piped = pipe(Option.none<number>(), tupleOf(Option.none<string>()));
      expect(direct).toStrictEqual(Option.none());
      expect(piped).toStrictEqual(direct);
    });

    test("data-last (piped) keeps the piped value first", () => {
      expect(pipe(Option.some(1), tupleOf(Option.some("a")))).toStrictEqual(
        Option.some([1, "a"]),
      );
    });

    test("data-last (piped) short-circuits on None", () => {
      expect(
        pipe(Option.none<number>(), tupleOf(Option.some("a"))),
      ).toStrictEqual(Option.none());
    });
  });

  describe("ifSome", () => {
    test("some", () => {
      const mockIfSome = vi.fn<() => void>();
      const pipedCallback = vi.fn<() => void>();

      const result = ifSome(Option.some("value"), mockIfSome);
      const piped = pipe(Option.some("value"), ifSome(pipedCallback));

      expect(result).toBe(undefined);
      expect(piped).toBe(result);
      expect(mockIfSome).toHaveBeenCalledTimes(1);
      expect(mockIfSome).toHaveBeenNthCalledWith(1, "value");
      expect(pipedCallback).toHaveBeenCalledTimes(1);
      expect(pipedCallback.mock.calls).toStrictEqual(mockIfSome.mock.calls);
    });

    test("none", () => {
      const mockIfSome = vi.fn<() => void>();
      const pipedCallback = vi.fn<() => void>();

      const result = ifSome(Option.none(), mockIfSome);
      const piped = pipe(Option.none(), ifSome(pipedCallback));

      expect(result).toBe(undefined);
      expect(piped).toBe(result);
      expect(mockIfSome).not.toHaveBeenCalled();
      expect(pipedCallback).not.toHaveBeenCalled();
      expect(pipedCallback.mock.calls).toStrictEqual(mockIfSome.mock.calls);
    });

    test("data-last (piped)", () => {
      const mockIfSome = vi.fn<() => void>();

      const result = pipe(Option.some("value"), ifSome(mockIfSome));

      expect(result).toBe(undefined);
      expect(mockIfSome).toHaveBeenCalledTimes(1);
      expect(mockIfSome).toHaveBeenNthCalledWith(1, "value");
    });

    test("some with function that tries to return a value", () => {
      const mockIfSome = vi
        .fn<() => string>()
        .mockReturnValue("some return value");
      const pipedCallback = vi
        .fn<() => string>()
        .mockReturnValue("other return");

      const result = ifSome(Option.some("value"), mockIfSome);
      const piped = pipe(Option.some("value"), ifSome(pipedCallback));

      expect(result).toBe(undefined);
      expect(piped).toBe(result);
      expect(mockIfSome).toHaveBeenCalledTimes(1);
      expect(mockIfSome).toHaveBeenNthCalledWith(1, "value");
      expect(pipedCallback).toHaveBeenCalledTimes(1);
      expect(pipedCallback.mock.calls).toStrictEqual(mockIfSome.mock.calls);
    });

    test("none skips an undefined callback from untyped code", () => {
      const input = Option.none();
      // @ts-expect-error - undefined callback is rejected but never invoked for None
      const direct = ifSome(input, undefined);
      // @ts-expect-error - piped undefined callback is rejected but skipped for None
      const piped = pipe(input, ifSome(undefined));
      expect(direct).toBeUndefined();
      expect(piped).toBe(direct);
    });
  });

  describe("inspectSome", () => {
    test("some", () => {
      const mockInspectSome = vi.fn<() => void>();
      const pipedCallback = vi.fn<() => void>();
      const input = Option.some("value");

      const result = inspectSome(input, mockInspectSome);
      const piped = pipe(input, inspectSome(pipedCallback));

      expect(result).toStrictEqual(Option.some("value"));
      expect(result).toBe(input);
      expect(piped).toBe(input);
      expect(mockInspectSome).toHaveBeenCalledTimes(1);
      expect(mockInspectSome).toHaveBeenCalledWith("value");
      expect(pipedCallback).toHaveBeenCalledTimes(1);
      expect(pipedCallback.mock.calls).toStrictEqual(
        mockInspectSome.mock.calls,
      );
    });

    test("none", () => {
      const mockInspectSome = vi.fn<() => void>();
      const pipedCallback = vi.fn<() => void>();
      const input = Option.none();

      const result = inspectSome(input, mockInspectSome);
      const piped = pipe(input, inspectSome(pipedCallback));

      expect(result).toStrictEqual(Option.none());
      expect(result).toBe(input);
      expect(piped).toBe(input);
      expect(mockInspectSome).not.toHaveBeenCalled();
      expect(pipedCallback).not.toHaveBeenCalled();
      expect(pipedCallback.mock.calls).toStrictEqual(
        mockInspectSome.mock.calls,
      );
    });

    test("some with function that tries to return a value", () => {
      const mockInspectSome = vi
        .fn<() => string>()
        .mockReturnValue("some return value");
      const pipedCallback = vi
        .fn<() => string>()
        .mockReturnValue("other return");
      const input = Option.some("value");

      const result = inspectSome(input, mockInspectSome);
      const piped = pipe(input, inspectSome(pipedCallback));

      expect(result).toStrictEqual(Option.some("value"));
      expect(result).toBe(input);
      expect(piped).toBe(input);
      expect(mockInspectSome).toHaveBeenCalledTimes(1);
      expect(mockInspectSome).toHaveBeenCalledWith("value");
      expect(pipedCallback).toHaveBeenCalledTimes(1);
      expect(pipedCallback.mock.calls).toStrictEqual(
        mockInspectSome.mock.calls,
      );
    });

    test("data-last (piped) taps without breaking the chain", () => {
      const observer = vi.fn<(value: number) => number>().mockReturnValue(99);

      const result = pipe(
        Option.some(1),
        inspectSome(observer),
        Option.map((value) => value + 1),
      );

      expect(result).toStrictEqual(Option.some(2));
      expect(observer).toHaveBeenCalledTimes(1);
      expect(observer).toHaveBeenCalledWith(1);
    });

    test("none preserves identity with an undefined callback from untyped code", () => {
      const input = Option.none();
      // @ts-expect-error - undefined observer is rejected but never invoked for None
      const direct = inspectSome(input, undefined);
      // @ts-expect-error - piped undefined observer is rejected but skipped for None
      const piped = pipe(input, inspectSome(undefined));
      expect(direct).toBe(input);
      expect(piped).toBe(input);
    });
  });

  describe("fromNullableOption", () => {
    test("some", () => {
      expect(fromNullableOption(Option.some(1))).toStrictEqual(Option.some(1));
    });

    test("null", () => {
      expect(fromNullableOption(null)).toStrictEqual(Option.none());
    });

    test("undefined", () => {
      expect(fromNullableOption(undefined)).toStrictEqual(Option.none());
    });

    test("preserves Some values that are falsy", () => {
      const zero = Option.some(0);
      const emptyString = Option.some("");
      const falseValue = Option.some(false);
      const notANumber = Option.some(Number.NaN);

      expect(fromNullableOption(zero)).toBe(zero);
      expect(fromNullableOption(emptyString)).toBe(emptyString);
      expect(fromNullableOption(falseValue)).toBe(falseValue);
      expect(fromNullableOption(notANumber)).toBe(notANumber);
    });

    test("preserves existing None and Some with nullish payloads", () => {
      const none = Option.none();
      const nullValue = Option.some(null);
      const undefinedValue = Option.some(undefined);

      expect(fromNullableOption(none)).toBe(none);
      expect(fromNullableOption(nullValue)).toBe(nullValue);
      expect(fromNullableOption(undefinedValue)).toBe(undefinedValue);
    });
  });

  describe("mapSomeOrNull", () => {
    test("some", () => {
      expect(
        pipe(
          Option.some(1),
          mapSomeOrNull((v) => v + 1),
        ),
      ).toBe(2);
    });

    test("none", () => {
      expect(
        pipe(
          Option.none(),
          mapSomeOrNull((v) => v + 1),
        ),
      ).toBeNull();
    });

    test("works data-first or data-last", () => {
      const directMapper = vi.fn((value: number) => value + 1);
      const pipedMapper = vi.fn((value: number) => value + 1);
      const input = Option.some(1);
      const direct = mapSomeOrNull(input, directMapper);
      const piped = pipe(input, mapSomeOrNull(pipedMapper));

      expect(direct).toBe(2);
      expect(piped).toBe(direct);
      expect(directMapper).toHaveBeenCalledTimes(1);
      expect(directMapper).toHaveBeenCalledWith(1);
      expect(pipedMapper).toHaveBeenCalledTimes(1);
      expect(pipedMapper.mock.calls).toStrictEqual(directMapper.mock.calls);
    });

    test("none returns null without invoking either mapper", () => {
      const directMapper = vi.fn((value: number) => value + 1);
      const pipedMapper = vi.fn((value: number) => value + 1);
      const input = Option.none<number>();
      const direct = mapSomeOrNull(input, directMapper);
      const piped = pipe(input, mapSomeOrNull(pipedMapper));

      expect(direct).toBeNull();
      expect(piped).toBe(direct);
      expect(directMapper).not.toHaveBeenCalled();
      expect(pipedMapper).not.toHaveBeenCalled();
      expect(pipedMapper.mock.calls).toStrictEqual(directMapper.mock.calls);
    });

    test.each([0, "", false, Number.NaN, null, undefined])(
      "preserves mapped %s in both call styles",
      (mapped) => {
        const directMapper = vi
          .fn<(value: string) => typeof mapped>()
          .mockReturnValue(mapped);
        const pipedMapper = vi
          .fn<(value: string) => typeof mapped>()
          .mockReturnValue(mapped);
        const input = Option.some("value");
        const direct = mapSomeOrNull(input, directMapper);
        const piped = pipe(input, mapSomeOrNull(pipedMapper));

        expect(direct).toBe(mapped);
        expect(piped).toBe(direct);
        expect(directMapper).toHaveBeenCalledTimes(1);
        expect(directMapper).toHaveBeenCalledWith("value");
        expect(pipedMapper).toHaveBeenCalledTimes(1);
        expect(pipedMapper.mock.calls).toStrictEqual(directMapper.mock.calls);
      },
    );

    test("none returns null with an undefined mapper from untyped code", () => {
      const input = Option.none();
      // @ts-expect-error - undefined mapper is rejected but never invoked for None
      const direct = mapSomeOrNull(input, undefined);
      // @ts-expect-error - piped undefined mapper is rejected but skipped for None
      const piped = pipe(input, mapSomeOrNull(undefined));
      expect(direct).toBeNull();
      expect(piped).toBe(direct);
    });
  });

  describe("mapSomeOrUndefined", () => {
    test("some → mapped value", () => {
      expect(mapSomeOrUndefined(Option.some(1), (v) => v + 1)).toBe(2);
    });

    test("none → undefined", () => {
      expect(
        mapSomeOrUndefined(Option.none<number>(), (v) => v + 1),
      ).toBeUndefined();
    });

    test("works data-first or data-last", () => {
      const directMapper = vi.fn((value: number) => value + 1);
      const pipedMapper = vi.fn((value: number) => value + 1);
      const input = Option.some(1);
      const direct = mapSomeOrUndefined(input, directMapper);
      const piped = pipe(input, mapSomeOrUndefined(pipedMapper));

      expect(direct).toBe(2);
      expect(piped).toBe(direct);
      expect(directMapper).toHaveBeenCalledTimes(1);
      expect(directMapper).toHaveBeenCalledWith(1);
      expect(pipedMapper).toHaveBeenCalledTimes(1);
      expect(pipedMapper.mock.calls).toStrictEqual(directMapper.mock.calls);
    });

    test("none returns undefined without invoking either mapper", () => {
      const directMapper = vi.fn((value: number) => value + 1);
      const pipedMapper = vi.fn((value: number) => value + 1);
      const input = Option.none<number>();
      const direct = mapSomeOrUndefined(input, directMapper);
      const piped = pipe(input, mapSomeOrUndefined(pipedMapper));

      expect(direct).toBeUndefined();
      expect(piped).toBe(direct);
      expect(directMapper).not.toHaveBeenCalled();
      expect(pipedMapper).not.toHaveBeenCalled();
      expect(pipedMapper.mock.calls).toStrictEqual(directMapper.mock.calls);
    });

    test.each([0, "", false, Number.NaN, null, undefined])(
      "preserves mapped %s in both call styles",
      (mapped) => {
        const directMapper = vi
          .fn<(value: string) => typeof mapped>()
          .mockReturnValue(mapped);
        const pipedMapper = vi
          .fn<(value: string) => typeof mapped>()
          .mockReturnValue(mapped);
        const input = Option.some("value");
        const direct = mapSomeOrUndefined(input, directMapper);
        const piped = pipe(input, mapSomeOrUndefined(pipedMapper));

        expect(direct).toBe(mapped);
        expect(piped).toBe(direct);
        expect(directMapper).toHaveBeenCalledTimes(1);
        expect(directMapper).toHaveBeenCalledWith("value");
        expect(pipedMapper).toHaveBeenCalledTimes(1);
        expect(pipedMapper.mock.calls).toStrictEqual(directMapper.mock.calls);
      },
    );

    test("none returns undefined with an undefined mapper from untyped code", () => {
      const input = Option.none();
      // @ts-expect-error - undefined mapper is rejected but never invoked for None
      const direct = mapSomeOrUndefined(input, undefined);
      // @ts-expect-error - piped undefined mapper is rejected but skipped for None
      const piped = pipe(input, mapSomeOrUndefined(undefined));
      expect(direct).toBeUndefined();
      expect(piped).toBe(direct);
    });
  });
});
