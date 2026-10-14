import { it } from "@effect/vitest";
import { Effect, pipe } from "effect";
import { describe, expect, vi } from "vitest";
import { getOrElseSetGet } from "./MapX.js";

describe("Map utils", () => {
  describe("getOrElseSetGet", () => {
    describe.each([false, true])(
      "direct and piped misses and hits agree (populated: %s)",
      (populated) => {
        it.effect("populates and reuses the same stored objects", () =>
          Effect.sync(() => {
            const existing = { name: "Notebook" };
            const entries: [string, { name: string }][] = populated
              ? [["notebook", existing]]
              : [];
            const directMap = new Map(entries);
            const pipedMap = new Map(entries);
            const directFallback = vi.fn(() => ({ name: "Coffee mug" }));
            const pipedFallback = vi.fn(() => ({ name: "Coffee mug" }));

            const direct = getOrElseSetGet(directMap, "mug", directFallback);
            const piped = pipe(pipedMap, getOrElseSetGet("mug", pipedFallback));

            expect(direct).toStrictEqual({ name: "Coffee mug" });
            expect(piped).toStrictEqual(direct);
            expect(direct).toBe(directMap.get("mug"));
            expect(piped).toBe(pipedMap.get("mug"));
            expect(directMap).toStrictEqual(
              new Map([...entries, ["mug", direct]]),
            );
            expect(pipedMap).toStrictEqual(directMap);
            expect(directMap.get("notebook")).toBe(entries[0]?.[1]);
            expect(pipedMap.get("notebook")).toBe(entries[0]?.[1]);
            expect(directFallback).toHaveBeenCalledExactlyOnceWith();
            expect(pipedFallback).toHaveBeenCalledExactlyOnceWith();

            const directHitFallback = vi.fn(() => ({
              name: "Replacement mug",
            }));
            const pipedHitFallback = vi.fn(() => ({ name: "Replacement mug" }));
            expect(getOrElseSetGet(directMap, "mug", directHitFallback)).toBe(
              direct,
            );
            expect(
              pipe(pipedMap, getOrElseSetGet("mug", pipedHitFallback)),
            ).toBe(piped);
            expect(directHitFallback).not.toHaveBeenCalled();
            expect(pipedHitFallback).not.toHaveBeenCalled();
            expect(directMap).toStrictEqual(
              new Map([...entries, ["mug", direct]]),
            );
            expect(pipedMap).toStrictEqual(directMap);
          }),
        );
      },
    );

    it.effect("returns the value stored by an object fallback", () =>
      Effect.sync(() => {
        const map = new Map<string, string[]>();
        const value = getOrElseSetGet(map, "a", () => []);

        expect(value).toBe(map.get("a"));
        value.push("item");
        expect(map.get("a")).toEqual(["item"]);
      }),
    );

    describe.each([null, undefined])(
      "direct and piped misses store and return a nullish fallback: %s",
      (value) => {
        it.effect("stores the result and calls each fallback once", () =>
          Effect.sync(() => {
            const directMap = new Map<string, null | undefined>();
            const pipedMap = new Map<string, null | undefined>();
            const directFallback = vi.fn(() => value);
            const pipedFallback = vi.fn(() => value);

            const direct = getOrElseSetGet(directMap, "a", directFallback);
            const piped = pipe(pipedMap, getOrElseSetGet("a", pipedFallback));

            expect(direct).toBe(value);
            expect(piped).toBe(direct);
            expect(directMap.has("a")).toBe(true);
            expect(pipedMap.has("a")).toBe(true);
            expect(directMap.get("a")).toBe(value);
            expect(pipedMap.get("a")).toBe(value);
            expect(directMap).toStrictEqual(new Map([["a", value]]));
            expect(pipedMap).toStrictEqual(directMap);
            expect(directFallback).toHaveBeenCalledExactlyOnceWith();
            expect(pipedFallback).toHaveBeenCalledExactlyOnceWith();
          }),
        );
      },
    );

    describe.each([null, undefined])(
      "direct and piped hits throw for stored nullish values: %s",
      (value) => {
        it.effect("throws equivalent errors without mutating either map", () =>
          Effect.sync(() => {
            const entries: [string, string | null | undefined][] = [
              ["a", value],
              ["other", "untouched"],
            ];
            const directMap = new Map(entries);
            const pipedMap = new Map(entries);
            const directFallback = vi.fn(() => "fallback");
            const pipedFallback = vi.fn(() => "fallback");
            const directCall = vi.fn(() =>
              getOrElseSetGet(directMap, "a", directFallback),
            );
            const pipedCall = vi.fn(() =>
              pipe(
                pipedMap,
                getOrElseSetGet<string, string | null | undefined>(
                  "a",
                  pipedFallback,
                ),
              ),
            );

            expect(directCall).toThrow(new Error("Value is nullable: a"));
            expect(pipedCall).toThrow(new Error("Value is nullable: a"));
            expect(directCall.mock.results[0]?.value).toBeInstanceOf(Error);
            expect(pipedCall.mock.results[0]?.value).toBeInstanceOf(Error);
            expect(pipedCall.mock.results[0]?.value).toStrictEqual(
              directCall.mock.results[0]?.value,
            );
            expect(directFallback).not.toHaveBeenCalled();
            expect(pipedFallback).not.toHaveBeenCalled();
            expect(directMap).toStrictEqual(new Map(entries));
            expect(pipedMap).toStrictEqual(directMap);
          }),
        );
      },
    );

    describe.each([0, false, "", Number.NaN])(
      "direct and piped hits return stored falsy values unchanged: %s",
      (value) => {
        it.effect(
          "returns the stored value without calling either fallback",
          () =>
            Effect.sync(() => {
              const directMap = new Map([["a", value]]);
              const pipedMap = new Map([["a", value]]);
              const directFallback = vi.fn(() => value);
              const pipedFallback = vi.fn(() => value);

              const direct = getOrElseSetGet(directMap, "a", directFallback);
              const piped = pipe(pipedMap, getOrElseSetGet("a", pipedFallback));

              expect(direct).toBe(value);
              expect(piped).toBe(direct);
              expect(directFallback).not.toHaveBeenCalled();
              expect(pipedFallback).not.toHaveBeenCalled();
              expect(directMap).toStrictEqual(new Map([["a", value]]));
              expect(pipedMap).toStrictEqual(directMap);
            }),
        );
      },
    );

    describe.each([false, true])(
      "direct and piped throwing fallbacks preserve the map (populated: %s)",
      (populated) => {
        it.effect(
          "propagates the same error and leaves both maps unchanged",
          () =>
            Effect.sync(() => {
              const existing = { name: "Notebook" };
              const entries: [string, { name: string }][] = populated
                ? [["notebook", existing]]
                : [];
              const directMap = new Map(entries);
              const pipedMap = new Map(entries);
              const error = new Error("Catalogue unavailable");
              const directFallback = vi.fn(() => {
                throw error;
              });
              const pipedFallback = vi.fn(() => {
                throw error;
              });
              const directCall = vi.fn(() =>
                getOrElseSetGet(directMap, "mug", directFallback),
              );
              const pipedCall = vi.fn(() =>
                pipe(
                  pipedMap,
                  getOrElseSetGet<string, { name: string }>(
                    "mug",
                    pipedFallback,
                  ),
                ),
              );

              expect(directCall).toThrow(error);
              expect(pipedCall).toThrow(error);
              expect(directCall.mock.results[0]?.value).toBe(error);
              expect(pipedCall.mock.results[0]?.value).toBe(error);
              expect(directFallback).toHaveBeenCalledExactlyOnceWith();
              expect(pipedFallback).toHaveBeenCalledExactlyOnceWith();
              expect(directMap.has("mug")).toBe(false);
              expect(pipedMap.has("mug")).toBe(false);
              expect(directMap).toStrictEqual(new Map(entries));
              expect(pipedMap).toStrictEqual(directMap);
              expect(directMap.get("notebook")).toBe(entries[0]?.[1]);
              expect(pipedMap.get("notebook")).toBe(entries[0]?.[1]);
            }),
        );
      },
    );

    describe.each([null, undefined])(
      "rejects a nullish map in both call styles: %s",
      (map) => {
        it.effect("throws TypeError without calling either fallback", () =>
          Effect.sync(() => {
            const directFallback = vi.fn(() => "fallback");
            const pipedFallback = vi.fn(() => "fallback");

            expect(() => {
              // @ts-expect-error - null and undefined are invalid maps from untyped callers
              getOrElseSetGet(map, "a", directFallback);
            }).toThrow(TypeError);
            expect(() => {
              // @ts-expect-error - a piped nullish input is not a Map
              pipe(map, getOrElseSetGet("a", pipedFallback));
            }).toThrow(TypeError);
            expect(directFallback).not.toHaveBeenCalled();
            expect(pipedFallback).not.toHaveBeenCalled();
          }),
        );
      },
    );
  });
});
