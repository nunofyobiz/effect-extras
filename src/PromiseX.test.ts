import { describe, expect, test, vi } from "vitest";
import { asVoid } from "./PromiseX.js";

describe("promise", () => {
  describe("asVoid", () => {
    test("successful promise returning a value", async () => {
      expect.assertions(1);

      const voidedPromise = asVoid(Promise.resolve(42));

      await expect(voidedPromise).resolves.toBe(undefined);
    });

    test("discards a falsy resolved value", async () => {
      expect.assertions(1);

      const voidedPromise = asVoid(Promise.resolve(0));

      await expect(voidedPromise).resolves.toBe(undefined);
    });

    test("discards a resolved object", async () => {
      expect.assertions(1);

      const voidedPromise = asVoid(Promise.resolve({ id: 1 }));

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

    test("passes the original rejection reason through", async () => {
      expect.assertions(1);

      const reason = { reason: "failed" };

      await expect(asVoid(Promise.reject(reason))).rejects.toBe(reason);
    });

    test.each([false, "", null, undefined, Number.NaN, -0, 0n])(
      "discards the fulfilled value %s",
      async (value) => {
        expect.assertions(1);

        await expect(asVoid(Promise.resolve(value))).resolves.toBe(undefined);
      },
    );

    test.each([
      new Error("save failed"),
      "save failed",
      42,
      false,
      0n,
      Symbol("save failed"),
      null,
      undefined,
    ])("preserves the exact rejection reason %s", async (reason) => {
      expect.assertions(1);

      await expect(asVoid(Promise.reject(reason))).rejects.toBe(reason);
    });

    test("stays pending until the input fulfills", async () => {
      expect.assertions(6);

      let fulfill: (value: string) => void = () => {
        throw new Error("promise executor did not run");
      };
      const input = new Promise<string>((resolve) => {
        fulfill = resolve;
      });
      const output = asVoid(input);
      const onFulfilled = vi.fn();
      const onRejected = vi.fn();
      const observed = output.then(onFulfilled, onRejected);

      // Drain queued microtasks while the input is still under our control.
      await Promise.resolve();
      await Promise.resolve();
      expect(onFulfilled).not.toHaveBeenCalled();
      expect(onRejected).not.toHaveBeenCalled();

      fulfill("settings saved");
      await expect(output).resolves.toBe(undefined);
      await observed;
      expect(onFulfilled).toHaveBeenCalledExactlyOnceWith(undefined);
      expect(onRejected).not.toHaveBeenCalled();
      await expect(input).resolves.toBe("settings saved");
    });

    test("stays pending until the input rejects", async () => {
      expect.assertions(5);

      let reject: (reason: unknown) => void = () => {
        throw new Error("promise executor did not run");
      };
      const input = new Promise<string>((_resolve, rejectInput) => {
        reject = rejectInput;
      });
      const output = asVoid(input);
      const onFulfilled = vi.fn();
      const onRejected = vi.fn();
      const observed = output.then(onFulfilled, onRejected);

      await Promise.resolve();
      await Promise.resolve();
      expect(onFulfilled).not.toHaveBeenCalled();
      expect(onRejected).not.toHaveBeenCalled();

      const reason = new Error("save failed");
      reject(reason);
      await expect(output).rejects.toBe(reason);
      await observed;
      expect(onRejected).toHaveBeenCalledExactlyOnceWith(reason);
      expect(onFulfilled).not.toHaveBeenCalled();
    });

    test("bare null throws synchronously", () => {
      expect(() => {
        // @ts-expect-error - bare null is not a Promise container
        asVoid(null);
      }).toThrow(TypeError);
    });

    test("bare undefined throws synchronously", () => {
      expect(() => {
        // @ts-expect-error - bare undefined is not a Promise container
        asVoid(undefined);
      }).toThrow(TypeError);
    });
  });
});
