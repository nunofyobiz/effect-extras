import { describe, expect, test } from "vitest";
import { asVoid } from "./PromiseX.js";

describe("promise", () => {
  describe("asVoid", () => {
    test("successful promise returning a value", async () => {
      expect.assertions(1);

      const voidedPromise = asVoid(Promise.resolve(42));

      await expect(voidedPromise).resolves.toBe(undefined);
    });

    test("successful void", async () => {
      expect.assertions(1);

      const voidedPromise = asVoid(
        new Promise((resolve) => {
          resolve(undefined);
        }),
      );

      await expect(voidedPromise).resolves.toBe(undefined);
    });

    test("failed promise", async () => {
      expect.assertions(1);

      const voidedPromise = asVoid(Promise.reject(new Error("error")));

      await expect(voidedPromise).rejects.toThrow("error");
    });
  });
});
