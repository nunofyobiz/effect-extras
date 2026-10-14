/**
 * Helpers for working with native `Promise`s.
 *
 * @since 0.0.0
 */
/**
 * Discards a `Promise`'s fulfilled value, returning a `Promise<void>` that
 * fulfills with `undefined` only after the input fulfills. If the input rejects,
 * the returned promise rejects with the same reason unchanged.
 *
 * Useful when you await a promise only for its side effect and want the result
 * type to reflect that nothing meaningful is produced — for example when an API
 * expects a `Promise<void>` or when narrowing a value-bearing promise to keep
 * call sites from accidentally depending on the fulfilled value.
 *
 * @example
 * ```ts
 * import { PromiseX } from "@nunofyobiz/effect-extras"
 *
 * const saveSettings = async (settings: { theme: string }) => ({
 *   ...settings,
 *   saved: true,
 * })
 *
 * const run = async (): Promise<void> => {
 *   // Wait for saving to finish; this caller does not need the saved record.
 *   const result = await PromiseX.asVoid(saveSettings({ theme: "dark" }))
 *   assert.deepStrictEqual(result, undefined)
 *
 *   // Discarding the saved value still preserves a failed save's exact error.
 *   const failure = new Error("Settings could not be saved")
 *   await assert.rejects(
 *     PromiseX.asVoid(Promise.reject(failure)),
 *     (reason: unknown) => reason === failure,
 *   )
 * }
 *
 * void run()
 * ```
 *
 * @category conversions
 * @since 0.0.0
 */
export const asVoid = <T>(promise: Promise<T>): Promise<void> =>
  promise.then(() => undefined);
