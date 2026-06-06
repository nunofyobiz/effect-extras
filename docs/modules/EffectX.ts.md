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
  - [fromOptionOrElse](#fromoptionorelse)
- [sequencing](#sequencing)
  - [flattenOption](#flattenoption)
  - [tryUntil](#tryuntil)

---

# conversions

## fromOptionOrElse

Converts an `Option` to an `Effect`, mapping the `None` case to a caller-chosen
error via the `onNone` thunk.

Equivalent to `Effect.mapError(Effect.fromOption(option), onNone)`: it bridges
the `NoSuchElementError` that `Effect.fromOption` produces to the caller's own
error type, so callers never have to handle `NoSuchElementError`. This fills
the v4 gap where `Effect.mapError` no longer accepts an `Option` directly —
instead of
`pipe(option, Effect.fromOption, Effect.mapError(() => new MyError()))`, write
`pipe(option, EffectX.fromOptionOrElse(() => new MyError()))`. The `onNone`
thunk runs only when the `Option` is `None`.

**Signature**

```ts
export declare const fromOptionOrElse: {
  <E>(onNone: () => E): <A>(option: Option.Option<A>) => Effect.Effect<A, E>
  <A, E>(option: Option.Option<A>, onNone: () => E): Effect.Effect<A, E>
}
```

**Example**

```ts
import { Effect, Option, Result, pipe } from "effect"
import { EffectX } from "@nunofyobiz/effect-extras"

// data-first
const some = EffectX.fromOptionOrElse(Option.some(42), () => "missing")
assert.deepStrictEqual(Effect.runSync(Effect.result(some)), Result.succeed(42))

// data-last (piped) — None maps to the chosen error
const none = pipe(
  Option.none<number>(),
  EffectX.fromOptionOrElse(() => "missing")
)
assert.deepStrictEqual(Effect.runSync(Effect.result(none)), Result.fail("missing"))
```

Added in v0.0.0

# sequencing

## flattenOption

Flattens an `Effect` that succeeds with an `Option` into an `Effect` that
fails with `onNone()` when the `Option` is `None`.

When the wrapped `Option` is `Some(value)` the effect succeeds with `value`;
when it is `None` the effect fails with the error produced by the `onNone`
thunk. An existing failure of the source effect is preserved untouched, so the
result's error channel is the union of the original error and the `None`
error.

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

const some = EffectX.flattenOption(Effect.succeed(Option.some(1)), () => "missing")
assert.deepStrictEqual(Effect.runSync(Effect.result(some)), Result.succeed(1))

const none = EffectX.flattenOption(Effect.succeed(Option.none<number>()), () => "missing")
assert.deepStrictEqual(Effect.runSync(Effect.result(none)), Result.fail("missing"))
```

Added in v0.0.0

## tryUntil

Repeatedly calls a synchronous `try` thunk until its result satisfies the
`until` refinement, sleeping `sleepDuration` between attempts and failing with
a `TimeoutError` once `maxDuration` elapses.

The thunk is evaluated immediately; if its first result already passes the
refinement the effect succeeds without any delay. Otherwise it polls on the
`sleepDuration` interval (defaulting to 200ms — the threshold below which a
delay reads as "instant" to a user) until either the predicate holds (the
effect succeeds with the narrowed `B` value) or `maxDuration` is exceeded (the
effect fails with a `Cause.TimeoutError`). Use it to await an external,
non-effectful condition such as a flag flipped by a callback.

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
import { Duration, Effect } from "effect"
import { EffectX } from "@nunofyobiz/effect-extras"

// First attempt already matches, so it resolves immediately.
const effect = EffectX.tryUntil({
  try: () => 1,
  until: (value: number): value is number => value === 1,
  sleepDuration: Duration.millis(100),
  maxDuration: Duration.seconds(1)
})

assert.deepStrictEqual(Effect.runSync(effect), 1)
```

Added in v0.0.0
