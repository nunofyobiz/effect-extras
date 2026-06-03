import { Option, Predicate, pipe } from "effect";
import { dual } from "effect/Function";

export const tupleOf = dual<
  <A>(a: Option.Option<A>) => <B>(b: Option.Option<B>) => Option.Option<[A, B]>,
  <A, B>(a: Option.Option<A>, b: Option.Option<B>) => Option.Option<[A, B]>
>(
  2,
  <A, B>(a: Option.Option<A>, b: Option.Option<B>): Option.Option<[A, B]> =>
    Option.flatMap(a, (a) => Option.map(b, (b) => [a, b])),
);

/**
 * Short hand for for an "if" statement on Options
 */
export const ifSome = dual<
  <A>(ifSome: (value: A) => void) => (self: Option.Option<A>) => void,
  <A>(self: Option.Option<A>, ifSome: (value: A) => void) => void
>(2, <A>(self: Option.Option<A>, ifSome: (value: A) => void): void => {
  Option.match(self, {
    onSome: (value) => {
      ifSome(value);
      // Don't return anything
    },
    onNone: () => {
      // Do nothing
    },
  });
});

export const inspectSome = dual<
  <A>(
    function_: (value: A) => void,
  ) => (self: Option.Option<A>) => Option.Option<A>,
  <A>(self: Option.Option<A>, function_: (value: A) => void) => Option.Option<A>
>(
  2,
  <A>(
    self: Option.Option<A>,
    function_: (value: A) => void,
  ): Option.Option<A> => {
    ifSome(self, function_);
    return self;
  },
);

export const fromNullableOption = <A>(
  nullableOption: Option.Option<A> | null | undefined,
): Option.Option<A> =>
  Predicate.isNotNullish(nullableOption) ? nullableOption : Option.none();

/**
 * Useful shorthand for something we might do a lot in React components
 *
 * Eg.
 * ```tsx
 * {optionMapSomeOrNull(optionalValue, value => (
 *  <SomeComponent value={value} />
 * ))}
 * ```
 *
 * This util is exactly a replacement for the following, which is a little more verbose:
 * ```tsx
 * {Option.match(optionalValue, {
 *  onNone: () => null,
 *
 *  onSome: (value) => (
 *   <SomeComponent value={value} />
 *  )
 * })}
 * ```
 */
export const mapSomeOrNull = dual<
  <A, B>(map: (a: A) => B) => (self: Option.Option<A>) => B | null,
  <A, B>(self: Option.Option<A>, map: (a: A) => B) => B | null
>(2, <A, B>(self: Option.Option<A>, map: (a: A) => B): B | null =>
  pipe(self, Option.map(map), Option.getOrNull),
);

/**
 * Similar to {@link mapSomeOrNull}, but returns undefined instead of null
 * Could be used interchangeably in React components.
 */
export const mapSomeOrUndefined = dual<
  <A, B>(map: (a: A) => B) => (self: Option.Option<A>) => B | undefined,
  <A, B>(self: Option.Option<A>, map: (a: A) => B) => B | undefined
>(2, <A, B>(self: Option.Option<A>, map: (a: A) => B): B | undefined =>
  pipe(self, Option.map(map), Option.getOrUndefined),
);
