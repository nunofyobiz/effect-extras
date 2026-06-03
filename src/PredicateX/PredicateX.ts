import { Predicate, String } from "effect";
import { dual } from "effect/Function";

export const matchRefine = dual<
  <A, B extends A, C>(
    predicate: Predicate.Refinement<A, B>,
    handlers: {
      whenFalse: () => C;
      whenTrue: (value: B) => C;
    },
  ) => (value: A) => C,
  <A, B extends A, C>(
    value: A,
    predicate: Predicate.Refinement<A, B>,
    handlers: { whenFalse: () => C; whenTrue: (value: B) => C },
  ) => C
>(
  3,
  <A, B extends A, C>(
    value: A,
    predicate: Predicate.Refinement<A, B>,
    handlers: { whenFalse: () => C; whenTrue: (value: B) => C },
  ): C => (predicate(value) ? handlers.whenTrue(value) : handlers.whenFalse()),
);

export function isNonEmptyString(value: unknown): value is string {
  return (
    Predicate.isNotNullish(value) &&
    Predicate.isString(value) &&
    String.isNonEmpty(value)
  );
}
