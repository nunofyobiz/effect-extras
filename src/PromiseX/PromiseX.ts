/**
 * Run a Promise for its side effect and ignore its resolved value.
 */
export const asVoid = <T>(promise: Promise<T>): Promise<void> =>
  promise.then(() => undefined);
