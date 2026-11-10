---
title: EffectX.ts
nav_order: 5
parent: Modules
---

## EffectX overview

Generic, framework-agnostic extensions to Effect's `Effect` module.

Added in v0.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [conversions](#conversions)
  - [~~fromOptionOrElse~~](#fromoptionorelse)
- [sequencing](#sequencing)
  - [flattenOption](#flattenoption)
  - [tryUntil](#tryuntil)

---

# conversions

## ~~fromOptionOrElse~~

Converts an `Option` to an `Effect`, mapping the `None` case to a caller-chosen
error via the `onNone` thunk.

**Signature**

```ts
export declare const fromOptionOrElse: {
  <E>(onNone: () => E): <A>(option: Option.Option<A>) => Effect.Effect<A, E>
  <A, E>(option: Option.Option<A>, onNone: () => E): Effect.Effect<A, E>
}
```

**Example**

```ts
import { Effect, Option, Result } from "effect"

const some = Effect.fromOption(Option.some(42), () => "missing")
assert.deepStrictEqual(Effect.runSync(Effect.result(some)), Result.succeed(42))

const none = Effect.fromOption(Option.none<number>(), () => "missing")
assert.deepStrictEqual(Effect.runSync(Effect.result(none)), Result.fail("missing"))
```

Added in v0.0.0

# sequencing

## flattenOption

Requires a value from an effectful optional lookup, failing with `onNone()`
when the lookup returns `None`. Use it when a missing value should stop the
computation rather than remain optional.

When the wrapped `Option` is `Some(value)` the effect succeeds with `value`;
when it is `None` the effect fails with the error produced by the `onNone`
thunk. `onNone` runs only when a `None` result is executed, once per execution;
it is not called during construction, for `Some`, or for a source failure.
Existing source failures are preserved. A throwing `onNone` becomes an
execution defect rather than a typed failure.

**Signature**

```ts
export declare const flattenOption: (<A, E1, E2, R>(
  onNone: () => E2
) => (effect: Effect.Effect<Option.Option<A>, E1, R>) => Effect.Effect<A, E1 | E2, R>) &
  (<A, E1, E2, R>(effect: Effect.Effect<Option.Option<A>, E1, R>, onNone: () => E2) => Effect.Effect<A, E1 | E2, R>)
```

**Example**

```ts
import { Effect, Option, Result } from "effect"
import { EffectX } from "@nunofyobiz/effect-extras"

// A saved theme becomes a required setting without changing its value.
const theme = EffectX.flattenOption(Effect.succeed(Option.some("dark")), () => "No saved theme")
assert.deepStrictEqual(Effect.runSync(Effect.result(theme)), Result.succeed("dark"))

// A missing setting produces the chosen error only when the effect runs.
const missingTheme = EffectX.flattenOption(Effect.succeed(Option.none<string>()), () => "No saved theme")
assert.deepStrictEqual(Effect.runSync(Effect.result(missingTheme)), Result.fail("No saved theme"))
```

Added in v0.0.0

## tryUntil

Reads a synchronous value until it becomes usable, returning the value
narrowed by `until`. Use it to wait for a non-effectful condition, such as a
value saved by a callback.

Both `try` and `until` run immediately when this helper is called. If the
first value matches, the returned effect succeeds with that captured value
on every execution without polling. Otherwise, each execution starts the
timeout and delayed attempts, spaced by `sleepDuration` (200ms by default).
Polling stops on a match or fails with `Cause.TimeoutError` at `maxDuration`.
Callback throws during the initial attempt escape synchronously; throws
during delayed attempts become execution defects, not timeout failures.

**Signature**

```ts
export declare const tryUntil: <A, B extends A>({
  try: doTry,
  until: isDone,
  sleepDuration,
  maxDuration
}: {
  try: () => A
  until: Predicate.Refinement<A, B>
  sleepDuration?: Duration.Duration
  maxDuration: Duration.Duration
}) => Effect.Effect<B, Cause.TimeoutError, never>
```

**Example**

```ts
import { Duration, Effect, Predicate } from "effect"
import { EffectX } from "@nunofyobiz/effect-extras"

// The display name is already saved, so construction captures it immediately.
const readSavedName = (): string | undefined => "Sam"
const displayName = EffectX.tryUntil({
  try: readSavedName,
  until: Predicate.isString,
  maxDuration: Duration.seconds(1)
})

// Reusing the effect returns the captured name without reading or waiting again.
assert.deepStrictEqual(Effect.runSync(displayName), "Sam")
assert.deepStrictEqual(Effect.runSync(displayName), "Sam")
```

Added in v0.0.0
