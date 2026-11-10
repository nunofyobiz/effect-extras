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
`effect/Function` (not `Function.dual()`). For new helpers, declare the **data-last** (piped)
overload first, then **data-first**. The arity counts the data-first arguments.

Prefer the type-argument form for a straightforward pair of call signatures. Generic function types
work here too; genericity alone does not require a different declaration form:

```ts
import { Predicate } from "effect";
import { dual } from "effect/Function";

type NullableHandlers<A, B> = {
  whenNotNullable: (value: NonNullable<A>) => B;
  whenNullable: () => B;
};

export const matchNullable = dual<
  <A, B>(handlers: NullableHandlers<A, B>) => (value: A) => B,
  <A, B>(value: A, handlers: NullableHandlers<A, B>) => B
>(
  2,
  <A, B>(value: A, handlers: NullableHandlers<A, B>): B =>
    Predicate.isNotNullish(value)
      ? handlers.whenNotNullable(value)
      : handlers.whenNullable(),
);
```

Use a const annotated with an overload object when a longer overload set, per-overload documentation,
or an existing published declaration is clearer that way. The same fully checked implementation can
be written in this form (using `NullableHandlers`, `Predicate`, and `dual` above):

```ts
export const matchNullableAnnotated: {
  <A, B>(handlers: NullableHandlers<A, B>): (value: A) => B;
  <A, B>(value: A, handlers: NullableHandlers<A, B>): B;
} = dual(
  2,
  <A, B>(value: A, handlers: NullableHandlers<A, B>): B =>
    Predicate.isNotNullish(value)
      ? handlers.whenNotNullable(value)
      : handlers.whenNullable(),
);
```

An existing published helper keeps its overload order: reordering changes the published type
declaration. `FormDataX.decodeSync` intentionally keeps its data-first overload first for this reason.
Both forms require a fully type-checked implementation; see [No type assertions](#no-type-assertions)
for generic narrowing limitations and rejected workarounds.

This lets helpers sit naturally in a consumer's `pipe` chain _and_ be called directly. See
[What belongs here](./what-belongs-here.md#names-and-modules) for whether a helper belongs, where it
lives, and how to name it.

## Data-first vs `pipe`

Prefer **data-first** for single calls when the operation provides that form; use `pipe()` for chains
of 2+ operations. When an Effect built-in is data-last only, write even a single call as
`pipe(value, BuiltIn(args))`. For example, `String.padStart` in the installed Effect version has no
data-first form; `NumberX.padLeftZeroes` uses this exception.

```ts
import { Effect, Option, Schema, String, pipe } from "effect";

// Good — data-first for single calls
Option.getOrElse(option, () => fallback);
Effect.map(effect, fn);

// Good — pipe for a single data-last-only built-in
pipe("7", String.padStart(3, "0"));

// Good — pipe for chains of 2+
pipe(
  option,
  Option.filter(predicate),
  Option.getOrElse(() => fallback),
);

// Bad — pipe wrapping a single call that has a data-first form
pipe(
  option,
  Option.getOrElse(() => fallback),
);

// Good — pass a curried function directly when overload inference is unaffected
Option.flatMap(option, Schema.decodeUnknownOption(MyId));

// Bad — unnecessary lambda when overload inference is unaffected
Option.flatMap(option, (value) => Schema.decodeUnknownOption(MyId)(value));
```

Passing an overloaded function point-free (as a bare reference) can make TypeScript resolve to its
last overload and silently widen the result type. A wrapper lambda is required when it preserves the
intended overload inference. Give it a one-line comment explaining why, as in the `WarnResult` bridge
pattern below, where `fromInclusiveOr` has variant-specific overloads:

```ts
// The lambda preserves the bridge's variant-specific overload inference.
const result = Effect.map(effectOfBoth, (io) => fromInclusiveOr(io));
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

## Schema utilities — SchemaX fills v4 gaps

v4 removed some convenience methods from `Schema.Struct`. `SchemaX` (from this package) provides
replacements:

```ts
SchemaX.pick(Source, "a", "b"); // v3 had Source.pick("a", "b")
SchemaX.omit(Source, "c"); // v3 had Source.omit("c")
SchemaX.partial(Source); // v3 had Schema.partial(Source)
```

These are the canonical way to subset or partial-ize a `Schema.Struct` in this codebase.

> Provenance: adapted from StoryCut's `docs/architecture/effect-patterns.md` "Schema utilities —
> SchemaX fills v4 gaps". Dropped the CRUD-repository sentence (app-specific) and `pickPartial`-less
> wording to match this package's actual `SchemaX.pick` / `omit` / `partial` signatures, checked
> against `src/SchemaX.ts` and `effect@4.0.2`.

## Effect operator renames (v3 → v4)

| v3                                         | v4                                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `Effect.catchAll`                          | `Effect.catch`                                                                              |
| `Effect.catchAllCause`                     | `Effect.catchCause`                                                                         |
| `Effect.catchSome`                         | `Effect.catchFilter`                                                                        |
| `Effect.tapBoth({ onSuccess, onFailure })` | `Effect.tap(onSuccess)` + `Effect.tapError(onFailure)` (`tapBoth` removed)                  |
| `Effect.fork`                              | `Effect.forkChild`                                                                          |
| `Effect.either`                            | `Effect.result`                                                                             |
| `Cause.TimeoutException`                   | `Cause.TimeoutError`                                                                        |
| `cause._tag === "Fail"`                    | `cause.reasons.find((r) => r._tag === "Fail")` (`Cause` holds a flat `reasons` array in v4) |

`Effect.catchTag` now takes an array as the first argument when matching multiple tags:
`Effect.catchTag(["TagA", "TagB"], handler)` (v3 was variadic).

> Provenance: adapted from StoryCut's `docs/architecture/effect-patterns.md` "Effect operator renames
> (v3 → v4)". Every row checked against `node_modules/effect@4.0.2`'s `Effect.d.ts` and `Cause.d.ts`.
> Dropped `Effect.tryMapPromise` — its v4 replacement is a multi-line `Effect.flatMap` + `tryPromise`
> expression, not a one-to-one rename worth a table row — and the Next.js-specific rows StoryCut's
> source doesn't carry in this generic section anyway.

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

When `Match.value` / `Match.when` cannot narrow a generic, not-yet-narrowed type parameter,
prefer a type-checked `Predicate` refinement with a short ternary. The refinement narrows the generic
value, and the explicit generic parameters and return type let the compiler check both branches:

```ts
import { Predicate } from "effect";

const matchValue = <A, B>(
  value: A,
  handlers: {
    whenNotNullable: (value: NonNullable<A>) => B;
    whenNullable: () => B;
  },
): B =>
  Predicate.isNotNullish(value)
    ? handlers.whenNotNullable(value)
    : handlers.whenNullable();
```

A non-exported overloaded implementation whose implementation signature uses `unknown`, leaving its
body unchecked against the public generic overloads, is **not accepted** as an alternative to `as`.
It hides a cast just as an assertion does. The existing `matchNullable` / `mapNullable`
implementations behind `NonNullableX.match` / `NonNullableX.map`, and `matchRefineValue` behind
`PredicateX.matchRefine`, are not a precedent.

If none of the fully type-checked approaches works, stop and ask the operator for an explicit decision
before reaching for `as` or an unchecked implementation signature. There is no general escape hatch.
The strict ESLint config already bans `any` and unused eslint-disable directives; reaching for a cast
remains a design smell.

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
