import {
  Number as EffectNumber,
  Match,
  Order,
  Ordering,
  Predicate,
} from "effect";
import { dual } from "effect/Function";
import { dedent } from "ts-dedent";

/**
 * Throw an `Error` if `value` is `null` or `undefined`, otherwise narrow it.
 * Re-exported as `nn` from the module barrel for use in string interpolations
 * (see CLAUDE.md "nn — non-nullable assertion shorthand").
 */
export const fromNullableOrThrow = <A>(
  value: A,
  variableName?: string,
): NonNullable<A> => {
  if (Predicate.isNotNullish(value)) {
    return value;
  }
  throw new Error(
    dedent`Value is nullable: ${value}${Predicate.isNotNullish(variableName) ? ` (variable name: ${variableName})` : ""}`,
  );
};

export const match = dual<
  <A, B>(handlers: {
    whenNullable: () => B;
    whenNotNullable: (value: NonNullable<A>) => B;
  }) => (value: A) => B,
  <A, B>(
    value: A,
    handlers: {
      whenNullable: () => B;
      whenNotNullable: (value: NonNullable<A>) => B;
    },
  ) => B
>(
  2,
  <A, B>(
    value: A,
    {
      whenNullable,
      whenNotNullable,
    }: { whenNullable: () => B; whenNotNullable: (value: NonNullable<A>) => B },
  ): B =>
    Predicate.isNotNullish(value) ? whenNotNullable(value) : whenNullable(),
);

export const map = dual<
  <A, B>(
    map: (a: NonNullable<A>) => B,
  ) => (a: A) => B | (null & A) | (undefined & A),
  <A, B>(
    a: A,
    map: (a: NonNullable<A>) => B,
  ) => B | (null & A) | (undefined & A)
>(
  2,
  <A, B>(
    a: A,
    map: (a: NonNullable<A>) => B,
  ): B | (null & A) | (undefined & A) => {
    if (Predicate.isNotNullish(a)) {
      return map(a);
    }

    if (Predicate.isNullish(a)) {
      return a;
    }

    throw new Error(dedent`Value is neither nullable nor non-nullable: ${a}`);
  },
);

export const lift =
  <A, B>(map: (a: A) => B) =>
  (a: A | null | undefined): B | null | undefined => {
    if (Predicate.isNullish(a)) {
      return a;
    }

    return map(a);
  };

export const nullableOrder = dual<
  (
    behavior: "value-null" | "null-value",
  ) => <A>(order: Order.Order<A>) => Order.Order<A | null>,
  <A>(
    order: Order.Order<A>,
    behavior: "value-null" | "null-value",
  ) => Order.Order<A | null>
>(
  2,
  <A>(
    order: Order.Order<A>,
    behavior: "value-null" | "null-value",
  ): Order.Order<A | null> => {
    // Prepare to sort them based on their nullability
    const { nullableSortCategory, valueSortCategory } = Match.value(
      behavior,
    ).pipe(
      Match.when("value-null", () => ({
        nullableSortCategory: 1,
        valueSortCategory: 0,
      })),
      Match.when("null-value", () => ({
        nullableSortCategory: 0,
        valueSortCategory: 1,
      })),
      Match.exhaustive,
    );

    return (a: A | null, b: A | null): Ordering.Ordering => {
      // Right off the bat, if they are both defined just return the regular ordering
      if (Predicate.isNotNullish(a) && Predicate.isNotNullish(b)) {
        return order(a, b);
      }

      // Otherwise figure out which category each value is
      const aCategory = Predicate.isNotNullish(a)
        ? valueSortCategory
        : nullableSortCategory;

      const bCategory = Predicate.isNotNullish(b)
        ? valueSortCategory
        : nullableSortCategory;

      return EffectNumber.sign(aCategory - bCategory);
    };
  },
);
