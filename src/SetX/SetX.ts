import { dual } from "effect/Function";

export const safelyMutate = dual<
  <A>(mutate: (set: Set<A>) => Set<A>) => (set: Set<A>) => Set<A>,
  <A>(set: Set<A>, mutate: (set: Set<A>) => Set<A>) => Set<A>
>(2, <A>(set: Set<A>, mutate: (set: Set<A>) => Set<A>): Set<A> => {
  const copy = new Set(set);
  return mutate(copy);
});

export const add = dual<
  <A>(value: A) => (set: Set<A>) => Set<A>,
  <A>(set: Set<A>, value: A) => Set<A>
>(
  2,
  <A>(set: Set<A>, value: A): Set<A> =>
    set.has(value) ? set : new Set(set).add(value),
);

export const remove = dual<
  <A>(value: A) => (set: Set<A>) => Set<A>,
  <A>(set: Set<A>, value: A) => Set<A>
>(2, <A>(set: Set<A>, value: A): Set<A> => {
  if (set.has(value)) {
    const newSet = new Set(set);
    newSet.delete(value);
    return newSet;
  }
  return set;
});

export const toggle = dual<
  <A>(value: A) => (set: Set<A>) => Set<A>,
  <A>(set: Set<A>, value: A) => Set<A>
>(
  2,
  <A>(set: Set<A>, value: A): Set<A> =>
    set.has(value) ? remove(set, value) : add(set, value),
);
