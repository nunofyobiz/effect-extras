# Effect patterns

Conventions for _how_ to write Effect code here. Apply them on every change that touches Effect, not
just net-new files — consistency is what lets the utilities read as one library.

## Match over if/else

Use `Match.value` / `Match.valueTags` / `Match.tagsExhaustive` instead of `if/else` chains or
`switch`. `Match.exhaustive` makes the compiler enforce exhaustiveness — add a variant to a union
and every match site fails to compile until it handles the new case.

```ts
import { Match } from "effect";

// Discriminated union — exhaustive over the tag
const summary = Match.value(these).pipe(
  Match.tag("Both", (both) => `both ${both.left}/${both.right}`),
  Match.tag("This", (self) => `this ${self.left}`),
  Match.tag("That", (that) => `that ${that.right}`),
  Match.exhaustive,
);

// Plain values
const exitCode = Match.value(status).pipe(
  Match.when("clean", () => 0),
  Match.when("drift", () => 1),
  Match.exhaustive,
);
```

Short ternaries and `??` are fine: `const name = config.name ?? "unnamed"`. For the success/failure
split on an Effect, `Effect.matchEffect` is the Effect-level equivalent.

## Predicates for type checks

Use predicates from Effect modules instead of manual `=== null`, `typeof`, or `.length > 0`:

```ts
import { Predicate, String, Number, Array } from "effect";

if (Predicate.isNotNullish(value)) { ... } // not: value != null
if (Predicate.isString(value)) { ... } //     not: typeof value === "string"
if (String.isNonEmpty(str)) { ... } //        not: str.length > 0
if (Array.isArrayNonEmpty(arr)) { ... } //    not: arr.length > 0
if (Number.isNumber(n)) { ... } //            not: typeof n === "number"
```

A compound predicate worth reusing (an `isNonEmptyString` combining `isNotNullish`, `isString`, and
`String.isNonEmpty`) belongs in `PredicateX` when it clears the
[canonical admission test](./what-belongs-here.md). A second call site is strong evidence, while a
useful generic name or clear expectation of cross-project reuse can also justify exporting it.

## Dual functions

When a new or changed helper takes a data argument plus other arguments, use `dual` from
`effect/Function` (not `Function.dual()`). Declare the **data-last** (piped) overload first, then
**data-first**:

```ts
import { dual } from "effect/Function";

export const withPrefix = dual<
  (prefix: string) => (id: string) => string, // data-last: pipe(id, withPrefix("x:"))
  (id: string, prefix: string) => string //      data-first: withPrefix(id, "x:")
>(
  2, // arity of the data-first overload
  (id, prefix) => `${prefix}${id}`,
);
```

This lets helpers sit naturally in a consumer's `pipe` chain _and_ be called directly. See
[What belongs here](./what-belongs-here.md#names-and-modules) for whether a helper belongs, where it
lives, and how to name it.

## Data-first vs `pipe`

Prefer **data-first** for single calls; use `pipe()` only when chaining 2+ operations.

```ts
// Good — data-first for single calls
Option.getOrElse(option, () => fallback);
Effect.map(effect, fn);

// Good — pipe for chains of 2+
pipe(
  option,
  Option.filter(predicate),
  Option.getOrElse(() => fallback),
);

// Bad — pipe wrapping a single call
pipe(
  option,
  Option.getOrElse(() => fallback),
);

// Good — pass a curried function directly (no wrapper lambda)
Option.flatMap(option, Schema.decodeUnknownOption(MyId));

// Bad — unnecessary lambda wrapping a single function call
Option.flatMap(option, (value) => Schema.decodeUnknownOption(MyId)(value));
```

## `Result` over custom discriminated unions

When a function returns "success or one of N typed failures", reach for `Result<A, E>` instead of a
hand-rolled discriminated union — it unlocks Effect's combinators (`Result.map`, `Result.match`,
`Result.getOrElse`) over manual `_tag` checks.

**Use `Result` when:** the success case carries data you want to transform and the failures are
finite and tagged. **A custom union is fine when** 3+ variants are all "equal" with no clear
success/failure split.

```ts
import { Result, Match } from "effect";

Result.match(parsed, {
  onSuccess: (value) => render(value),
  onFailure: Match.type<ParseError | RangeError>().pipe(
    Match.tag("ParseError", (error) => reportParse(error)),
    Match.tag("RangeError", (error) => reportRange(error)),
    Match.exhaustive,
  ),
});
```

## Quick reference

| Instead of                        | Use                                        |
| --------------------------------- | ------------------------------------------ |
| `if/else` chains                  | `Match.value` / `Match.valueTags`          |
| `=== null`                        | `Predicate.isNull`                         |
| `!= null`                         | `Predicate.isNotNullish`                   |
| `typeof x === "string"`           | `Predicate.isString`                       |
| `str.length > 0`                  | `String.isNonEmpty(str)`                   |
| `arr.length > 0`                  | `Array.isArrayNonEmpty(arr)`               |
| `{ key: maybeUndefined }`         | `StructX.defined("key", maybeUndefined)`   |
| Custom `_tag` discriminated union | `Result<A, E>` + `Result.match`            |
| Inline `Array.prototype.sort`     | `Array.sort(arr, order)` — see Sort orders |

> `tsconfig.base.json` sets `exactOptionalPropertyTypes: true` (required by Effect Schema), so
> spreading `{ key: undefined }` into an object whose key is `key?: T` is a type error — the property
> must be _absent_, not present-but-undefined. `StructX` (`defined`, `filterDefined`, `some`) is the
> canonical fix.

## No type assertions

The `as` keyword is **avoided** outside of `as const`. When you reach for a cast, the right answer is
one of:

- `Schema.decode(...)` — for runtime-validated narrowing
- `Match.value(...)` with exhaustive cases — for discriminated unions
- a `Predicate.is*` refinement function — for type guards
- a `parseX(...): Effect<X, ParseError>` boundary function — for parsing external input

If none of those work, that's a sign the shape is wrong — discuss before reaching for `as`. The
strict ESLint config already bans `any` and unused eslint-disable directives, so casts are one of the
few escape hatches left; treat reaching for one as a design smell.

**The one sanctioned suppression.** A test that deliberately calls a helper with input its types
reject — proving what happens when untyped or loosely typed calling code reaches it — may suppress the
resulting type error with `// @ts-expect-error - <reason naming the case>`. That is not a workaround
for a design smell; it is the test asserting a real runtime behavior the types otherwise hide. Never
`@ts-ignore`: it has no trailing-reason requirement and keeps "working" even after the call starts
compiling for real, so a stale suppression never surfaces. See
[Tests — runtime edge cases the types reject](./tests.md#runtime-edge-cases-the-types-reject).

## Time

One clock, and it is Effect's. Read time with `Clock.currentTimeMillis` (or `DateTime.now`) inside an
Effect, never `Date.now()` / `new Date()`; represent a duration with `Duration` and an instant with
`DateTime`, never a raw number of milliseconds or a `Date`. `Duration.seconds(15)` reads as "15
seconds" at the call site and is unit-safe to add or compare; `15_000` reads as "fifteen thousand" with
the unit left to the reader, and adding two such numbers silently assumes they share a unit.

Convert to a primitive only at a non-Effect boundary — handing a value to `setTimeout`, JSON, or
another library that takes milliseconds: `Duration.toMillis(d)`, `DateTime.toEpochMillis(t)`. Thread
the `Duration`/`DateTime` value through everywhere else; don't convert early just because a later step
is easier to write with a number.

> Provenance: ampm's
> [`docs/development/code-conventions.md`](https://github.com/nunofyobiz/ampm) "Time" rule, trimmed to
> drop its diagnostics-ratchet enforcement and its Postgres-driver and domain-layer exemptions — neither
> applies to a published library with no database boundary. Where ampm's rule left no gap,
> effect-clue's "Use `Duration` and `DateTime` for time" was not separately needed.

## Sort orders

Use Effect's `Order` module for type-safe, composable sorting — never an inline `Array.prototype.sort`
comparator.

### Named orders vs inline

If an ordering is a logical, reusable property of a type, define it as a named `Order.Order<T>` export
(PascalCase strategy name; add an `Asc`/`Desc` suffix only when both directions are exported). For a
one-off, sort inline:

```ts
import { Array, Order } from "effect";

const sorted = Array.sort(
  items,
  Order.mapInput(Order.String, (item: Item) => item.path),
);
```

### Key helpers

| Helper                              | Use case                              |
| ----------------------------------- | ------------------------------------- |
| `Order.mapInput(base, extract)`     | Sort objects by a field               |
| `Order.combine(primary, secondary)` | Multi-key sort (two orders)           |
| `Order.combineAll([o1, o2, …])`     | Multi-key sort (more than two orders) |
| `Order.flip(order)`                 | Flip ascending to descending          |
| `Array.sort(array, order)`          | Sort by a single order                |
| `Array.sortBy(o1, o2, …)`           | Sort by multiple orders combined      |

Specialized order helpers — ranking enum-like values (`OrderX.rankedEnum`) or pushing nulls last —
belong in `OrderX` / `NonNullableX` only when they clear the
[canonical admission test](./what-belongs-here.md). Leave a one-off inline; an inline use alone is
not enough evidence to add a public helper.
