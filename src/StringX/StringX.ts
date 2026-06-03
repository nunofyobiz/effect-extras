import { dual } from "effect/Function";

/**
 * Prepends `start` to `string_`. v4's `String` module has no native
 * `prepend` (only `concat`), so we keep this as a pipeable helper.
 */
export const prepend = dual<
  (start: string) => (string_: string) => string,
  (string_: string, start: string) => string
>(2, (string_: string, start: string): string => `${start}${string_}`);

/**
 * Wraps `string_` between `start` and `end`. No v4 native equivalent.
 */
export const surround = dual<
  (start: string, end: string) => (string_: string) => string,
  (string_: string, start: string, end: string) => string
>(
  3,
  (string_: string, start: string, end: string): string =>
    `${start}${string_}${end}`,
);

/**
 * Prepends `start` to `string_` unless `string_` already starts with it.
 * Idempotent — `ensurePrepend("foo", "foo")` returns `"foo"`, not `"foofoo"`.
 */
export const ensurePrepend = dual<
  (start: string) => (string_: string) => string,
  (string_: string, start: string) => string
>(2, (string_: string, start: string): string => {
  if (string_.startsWith(start)) {
    return string_;
  }

  return `${start}${string_}`;
});
