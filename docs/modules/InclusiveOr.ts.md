---
title: InclusiveOr.ts
nav_order: 7
parent: Modules
---

## InclusiveOr overview

A value carrying a left payload, a right payload, or both at once.
Use InclusiveOr when problems can accompany a usable result.

Shared example scenarios:

- Sign-up email: left contains cleanup or validation messages; right contains
  the usable email, such as maya@example.com. Removing surrounding whitespace
  can produce both a warning and an email that can still be saved.
- Spreadsheet import: left contains a row's import problems; right contains
  its usable contact record. For zip, pair index-aligned problem entries and
  contact entries from the same rows. Pairing is positional, not a join by ID.

WarnResult reuses these scenarios unchanged: warnings = left, success = right.

Added in v0.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [combinators](#combinators)
  - [zip](#zip)
- [constructors](#constructors)
  - [LeftAndRight](#leftandright)
  - [LeftOnly](#leftonly)
  - [RightOnly](#rightonly)
  - [WithLeft](#withleft)
  - [WithRight](#withright)
  - [fromNullables](#fromnullables)
  - [optionFromNullables](#optionfromnullables)
- [getters](#getters)
  - [leftOption](#leftoption)
  - [leftOrElse](#leftorelse)
  - [leftOrUndefined](#leftorundefined)
  - [orElse](#orelse)
  - [orUndefined](#orundefined)
  - [rightOption](#rightoption)
  - [rightOrElse](#rightorelse)
  - [rightOrUndefined](#rightorundefined)
- [guards](#guards)
  - [is](#is)
- [mapping](#mapping)
  - [mapBoth](#mapboth)
  - [mapLeft](#mapleft)
  - [mapRight](#mapright)
- [models](#models)
  - [InclusiveOr (type alias)](#inclusiveor-type-alias)
  - [LeftAndRight (type alias)](#leftandright-type-alias)
  - [LeftOnly (type alias)](#leftonly-type-alias)
  - [RightOnly (type alias)](#rightonly-type-alias)
  - [WithLeft (type alias)](#withleft-type-alias)
  - [WithRight (type alias)](#withright-type-alias)
- [pattern matching](#pattern-matching)
  - [match](#match)
  - [matchLeft](#matchleft)
  - [matchRight](#matchright)
- [sequencing](#sequencing)
  - [flatMapLeft](#flatmapleft)
  - [flatMapLeftEffect](#flatmaplefteffect)
  - [flatMapRight](#flatmapright)
  - [flatMapRightEffect](#flatmaprighteffect)
  - [mapBothEffect](#mapbotheffect)
  - [mapLeftEffect](#maplefteffect)
  - [mapRightEffect](#maprighteffect)

---

# combinators

## zip

Pairs two arrays by index and passes each pair to a callback as an InclusiveOr.
Use it when unmatched tails must be kept: both entries produce LeftAndRight,
only the first produces LeftOnly, and only the second produces RightOnly.
Presence depends on array bounds, so an explicit undefined entry is present.
This is positional pairing, not a join by identifier. Both empty inputs return
an empty array without calling the callback.

**Signature**

```ts
export declare const zip: {
  <A, B, C>(array2: readonly B[], f: (inclusiveOr: InclusiveOr<A, B>) => C): (array1: readonly A[]) => C[]
  <A, B, C>(array1: readonly A[], array2: readonly B[], f: (inclusiveOr: InclusiveOr<A, B>) => C): C[]
}
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { pipe } from "effect"

// These spreadsheet lists refer to the same rows in the same order.
const problems = [["Name is missing"], ["Email is missing"]]
const contacts = [{ email: "maya@example.com" }]
const keepPair = (row: InclusiveOr.InclusiveOr<string[], { email: string }>) => row
// Row one has problems and a contact; row two has only problems.
const paired = InclusiveOr.zip(problems, contacts, keepPair)
assert.deepStrictEqual(paired, [
  InclusiveOr.LeftAndRight({ left: ["Name is missing"], right: { email: "maya@example.com" } }),
  InclusiveOr.LeftOnly({ left: ["Email is missing"] })
])
// The piped form keeps the same positional pairs and unmatched tail.
assert.deepStrictEqual(pipe(problems, InclusiveOr.zip(contacts, keepPair)), paired)
```

Added in v0.0.0

# constructors

## LeftAndRight

Creates a value carrying both payloads. Use it to keep problems alongside a usable
result. Both supplied payloads are preserved, even if they are nullish.

**Signature**

```ts
export declare const LeftAndRight: <A, B>(args: {
  readonly left: A
  readonly right: B
}) => Data.TaggedEnum.Value<Data.TaggedEnum.Kind<InclusiveOrDefinition, A, B>, "LeftAndRight">
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

const warnings = ["Surrounding whitespace removed"]
const email = "maya@example.com"
// Save the cleaned email and retain the message explaining the cleanup.
const result = InclusiveOr.LeftAndRight({ left: warnings, right: email })
assert.deepStrictEqual(result, { _tag: "LeftAndRight", left: warnings, right: email })
```

Added in v0.0.0

## LeftOnly

Creates a value carrying only a left payload. Use it to report problems when there
is no usable result. The supplied payload is preserved, even if it is nullish.

**Signature**

```ts
export declare const LeftOnly: <A, B>(args: {
  readonly left: A
}) => Data.TaggedEnum.Value<Data.TaggedEnum.Kind<InclusiveOrDefinition, A, B>, "LeftOnly">
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

// A missing email gives the form a problem without a value to save.
const result = InclusiveOr.LeftOnly({ left: ["Email is required"] })
assert.deepStrictEqual(result, { _tag: "LeftOnly", left: ["Email is required"] })
```

Added in v0.0.0

## RightOnly

Creates a value carrying only a right payload. Use it for a usable result without
problems. The supplied payload is preserved, even if it is nullish.

**Signature**

```ts
export declare const RightOnly: <A, B>(args: {
  readonly right: B
}) => Data.TaggedEnum.Value<Data.TaggedEnum.Kind<InclusiveOrDefinition, A, B>, "RightOnly">
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

// The email was already clean, so save it without warnings.
const result = InclusiveOr.RightOnly({ right: "maya@example.com" })
assert.deepStrictEqual(result, { _tag: "RightOnly", right: "maya@example.com" })
```

Added in v0.0.0

## WithLeft

Creates a value with a mandatory left payload and an optional right companion.
Use it when problems are known but usable data might be absent. A null or undefined
companion produces LeftOnly; any other companion produces LeftAndRight. The
mandatory left is preserved even when nullish.

**Signature**

```ts
export declare const WithLeft: <L, R>({ left, right }: { left: L; right?: R | undefined }) => WithLeft<L, R>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

const warnings = ["Surrounding whitespace removed"]
const email = "maya@example.com"
// The warning remains whether or not the cleaned email is available.
assert.deepStrictEqual(
  InclusiveOr.WithLeft({ left: warnings, right: email }),
  InclusiveOr.LeftAndRight({ left: warnings, right: email })
)
assert.deepStrictEqual(InclusiveOr.WithLeft({ left: warnings }), InclusiveOr.LeftOnly({ left: warnings }))
```

Added in v0.0.0

## WithRight

Creates a value with a mandatory right payload and an optional left companion.
Use it when usable data is known but problems might be absent. A null or undefined
companion produces RightOnly; any other companion produces LeftAndRight. The
mandatory right is preserved even when nullish.

**Signature**

```ts
export declare const WithRight: <L, R>({ left, right }: { left?: L | undefined; right: R }) => WithRight<L, R>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

const warnings = ["Surrounding whitespace removed"]
const email = "maya@example.com"
// A clean email has no warning companion; a cleaned email has both sides.
assert.deepStrictEqual(InclusiveOr.WithRight({ right: email }), InclusiveOr.RightOnly({ right: email }))
assert.deepStrictEqual(
  InclusiveOr.WithRight({ left: warnings, right: email }),
  InclusiveOr.LeftAndRight({ left: warnings, right: email })
)
```

Added in v0.0.0

## fromNullables

Creates an InclusiveOr from possibly missing payloads, using a lazy fallback when
both are absent. Use it when an absent pair needs a replacement value rather than
None. Null and undefined are absent; other values are kept. Without a custom
fallback, an absent pair throws Error("Both left and right are nullable").

**Signature**

```ts
export declare const fromNullables: <L, R>({
  left,
  right,
  orElse
}: {
  left?: L | null | undefined
  right?: R | null | undefined
  orElse?: () => InclusiveOr<L, R>
}) => InclusiveOr<L, R>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

// A blank sign-up field has neither a cleaned email nor a cleanup warning.
// Supply a validation problem only when both inputs are absent.
const result = InclusiveOr.fromNullables({
  left: null,
  right: undefined,
  orElse: () => InclusiveOr.LeftOnly({ left: ["Email is required"] })
})
assert.deepStrictEqual(result, InclusiveOr.LeftOnly({ left: ["Email is required"] }))
```

Added in v0.0.0

## optionFromNullables

Creates an optional InclusiveOr from two possibly missing payloads. Use it when
neither side is guaranteed: null and undefined count as absent, and both absent
produce None. Present values, including false, zero and empty strings, are kept.

**Signature**

```ts
export declare const optionFromNullables: <L, R>({
  left,
  right
}: {
  left?: L | null | undefined
  right?: R | null | undefined
}) => Option.Option<InclusiveOr<L, R>>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { Option } from "effect"

const warnings = ["Surrounding whitespace removed"]
const email = "maya@example.com"
// Keep the available email even when no cleanup warning was recorded.
assert.deepStrictEqual(
  InclusiveOr.optionFromNullables({ left: null, right: email }),
  Option.some(InclusiveOr.RightOnly({ right: email }))
)
// With neither a warning nor an email there is no InclusiveOr to construct.
assert.deepStrictEqual(InclusiveOr.optionFromNullables({ left: null, right: undefined }), Option.none())
```

Added in v0.0.0

# getters

## leftOption

Reads the left payload as Some, or returns None if that side is missing. Use it
to compose optional problems with Option helpers. A present null or undefined
payload is still Some.

**Signature**

```ts
export declare const leftOption: <L, R>(inclusiveOr: InclusiveOr<L, R>) => Option.Option<L>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { Option, pipe } from "effect"

// Keep the cleanup warning available for optional display.
const result = InclusiveOr.LeftOnly({ left: ["Surrounding whitespace removed"] })
assert.deepStrictEqual(pipe(result, InclusiveOr.leftOption), Option.some(["Surrounding whitespace removed"]))
// An email alone has no problems.
assert.deepStrictEqual(
  pipe(InclusiveOr.RightOnly({ right: "maya@example.com" }), InclusiveOr.leftOption),
  Option.none()
)
```

Added in v0.0.0

## leftOrElse

Reads the left payload, calling a lazy fallback only when that side is missing.
Use it to get problems with a default in one step. A present null or undefined
payload does not invoke the fallback.

**Signature**

```ts
export declare const leftOrElse: <A>(orElseReturn: () => A) => <L, R>(inclusiveOr: InclusiveOr<L, R>) => L | A
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { pipe } from "effect"

// A clean email has no warning list; use an empty list for the form display.
const warnings = pipe(
  InclusiveOr.RightOnly({ right: "maya@example.com" }),
  InclusiveOr.leftOrElse((): string[] => [])
)
assert.deepStrictEqual(warnings, [])
```

Added in v0.0.0

## leftOrUndefined

Reads the left payload, returning undefined if that side is missing. Use it
when problems can be absent and no default is needed. Present nullish payloads
are preserved.

**Signature**

```ts
export declare const leftOrUndefined: <L, R>(
  inclusiveOr:
    | { readonly _tag: "LeftOnly"; readonly left: L }
    | { readonly _tag: "RightOnly"; readonly right: R }
    | { readonly _tag: "LeftAndRight"; readonly left: L; readonly right: R }
) => L | undefined
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { pipe } from "effect"

// There are no warnings to display for this clean email.
assert.strictEqual(pipe(InclusiveOr.RightOnly({ right: "maya@example.com" }), InclusiveOr.leftOrUndefined), undefined)
```

Added in v0.0.0

## orElse

Fills whichever side is missing using its lazy fallback, producing LeftAndRight.
Use it when the next step needs both payloads. Only a missing side invokes a
fallback; a present null or undefined payload is preserved.

**Signature**

```ts
export declare const orElse: <L2, R2>({
  orElseLeft,
  orElseRight
}: {
  orElseLeft: () => L2
  orElseRight: () => R2
}) => <L, R>(inclusiveOr: InclusiveOr<L, R>) => LeftAndRight<L | L2, R | R2>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { pipe } from "effect"

const result = InclusiveOr.RightOnly({ right: "maya@example.com" })
// Supply an empty warning list for an email that needed no cleanup.
const complete = pipe(
  result,
  InclusiveOr.orElse({
    orElseLeft: (): string[] => [],
    orElseRight: () => "draft@example.com"
  })
)
assert.deepStrictEqual(complete, InclusiveOr.LeftAndRight({ left: [], right: "maya@example.com" }))
```

Added in v0.0.0

## orUndefined

Fills missing sides with undefined, producing LeftAndRight. Use it to read or
destructure both keys without branching on the tag. Present nullish payloads are
preserved.

**Signature**

```ts
export declare const orUndefined: <L, R>(
  inclusiveOr:
    | { readonly _tag: "LeftOnly"; readonly left: L }
    | { readonly _tag: "RightOnly"; readonly right: R }
    | { readonly _tag: "LeftAndRight"; readonly left: L; readonly right: R }
) => LeftAndRight<L | undefined, R | undefined>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { pipe } from "effect"

// The clean email has no warning list; expose that absence as undefined.
const complete = pipe(InclusiveOr.RightOnly({ right: "maya@example.com" }), InclusiveOr.orUndefined)
assert.deepStrictEqual(complete, InclusiveOr.LeftAndRight({ left: undefined, right: "maya@example.com" }))
```

Added in v0.0.0

## rightOption

Reads the right payload as Some, or returns None if that side is missing. Use it
to compose optional usable data with Option helpers. A present null or undefined
payload is still Some.

**Signature**

```ts
export declare const rightOption: <L, R>(inclusiveOr: InclusiveOr<L, R>) => Option.Option<R>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { Option, pipe } from "effect"

// Keep the usable email available for optional saving.
const result = InclusiveOr.RightOnly({ right: "maya@example.com" })
assert.deepStrictEqual(pipe(result, InclusiveOr.rightOption), Option.some("maya@example.com"))
// Problems alone have no usable email.
assert.deepStrictEqual(
  pipe(InclusiveOr.LeftOnly({ left: ["Email is required"] }), InclusiveOr.rightOption),
  Option.none()
)
```

Added in v0.0.0

## rightOrElse

Reads the right payload, calling a lazy fallback only when that side is missing.
Use it to get usable data with a default in one step. A present null or undefined
payload does not invoke the fallback.

**Signature**

```ts
export declare const rightOrElse: <A>(orElseReturn: () => A) => <L, R>(inclusiveOr: InclusiveOr<L, R>) => R | A
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { pipe } from "effect"

// A form with only a validation problem needs a draft email for its preview.
const email = pipe(
  InclusiveOr.LeftOnly({ left: ["Email is required"] }),
  InclusiveOr.rightOrElse(() => "draft@example.com")
)
assert.strictEqual(email, "draft@example.com")
```

Added in v0.0.0

## rightOrUndefined

Reads the right payload, returning undefined if that side is missing. Use it
when usable data can be absent and no default is needed. Present nullish payloads
are preserved.

**Signature**

```ts
export declare const rightOrUndefined: <L, R>(
  inclusiveOr:
    | { readonly _tag: "LeftOnly"; readonly left: L }
    | { readonly _tag: "RightOnly"; readonly right: R }
    | { readonly _tag: "LeftAndRight"; readonly left: L; readonly right: R }
) => R | undefined
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { pipe } from "effect"

// A missing email problem has no usable email to preview.
assert.strictEqual(pipe(InclusiveOr.LeftOnly({ left: ["Email is required"] }), InclusiveOr.rightOrUndefined), undefined)
```

Added in v0.0.0

# guards

## is

Checks a value's tag and narrows its type to that variant. Use it before reading a
side that is not available on every variant; it also accepts unknown inputs.

**Signature**

```ts
export declare const is: <Tag>(tag: Tag) => {
  <T extends Data.TaggedEnum.Kind<InclusiveOrDefinition, any, any, any, any>>(u: T): u is T & { readonly _tag: Tag }
  (u: unknown): u is Extract<Data.TaggedEnum.Kind<InclusiveOrDefinition>, { readonly _tag: Tag }>
}
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { pipe } from "effect"

const warnings = ["Surrounding whitespace removed"]
const email = "maya@example.com"
const result = InclusiveOr.LeftAndRight({ left: warnings, right: email })
// Recognise a cleaned email that has accompanying warnings.
assert.strictEqual(pipe(result, InclusiveOr.is("LeftAndRight")), true)
assert.strictEqual(InclusiveOr.is("LeftOnly")(result), false)
```

Added in v0.0.0

# mapping

## mapBoth

Transforms each present payload and keeps the original tag. Use it when problems
and usable data each need a new representation. A missing side never calls its
mapper; the original value is left unchanged.

**Signature**

```ts
export declare const mapBoth: <L1, R1, L2, R2>({
  mapLeft,
  mapRight
}: {
  mapLeft: (left: L1) => L2
  mapRight: (right: R1) => R2
}) => (inclusiveOr: InclusiveOr<L1, R1>) => InclusiveOr<L2, R2>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { pipe } from "effect"

const warnings = ["Surrounding whitespace removed"]
const email = "maya@example.com"
const result = InclusiveOr.LeftAndRight({ left: warnings, right: email })
// Turn warnings into display text and the email into a contact record.
const mapped = pipe(
  result,
  InclusiveOr.mapBoth({
    mapLeft: (messages: string[]) => messages.join("; "),
    mapRight: (email: string) => ({ email })
  })
)
assert.deepStrictEqual(
  mapped,
  InclusiveOr.LeftAndRight({
    left: "Surrounding whitespace removed",
    right: { email: "maya@example.com" }
  })
)
```

Added in v0.0.0

## mapLeft

Transforms the left payload, keeping any right payload and the tag.
Use it to prepare problem messages without changing usable data.
When left is absent, its mapper is not called.

**Signature**

```ts
export declare const mapLeft: <L1, L2>(
  mapLeft: (left: L1) => L2
) => <R>(inclusiveOr: InclusiveOr<L1, R>) => InclusiveOr<L2, R>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { pipe } from "effect"

const warnings = ["Surrounding whitespace removed"]
const email = "maya@example.com"
const result = InclusiveOr.LeftAndRight({ left: warnings, right: email })
// Prepare one display message while retaining the email.
const mapped = pipe(
  result,
  InclusiveOr.mapLeft((messages: string[]) => messages.join("; "))
)
assert.deepStrictEqual(
  mapped,
  InclusiveOr.LeftAndRight({
    left: "Surrounding whitespace removed",
    right: email
  })
)
```

Added in v0.0.0

## mapRight

Transforms the right payload, keeping any left payload and the tag.
Use it to prepare usable data without changing its problems.
When right is absent, its mapper is not called.

**Signature**

```ts
export declare const mapRight: <R1, R2>(
  mapRight: (right: R1) => R2
) => <L>(inclusiveOr: InclusiveOr<L, R1>) => InclusiveOr<L, R2>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { pipe } from "effect"

const warnings = ["Surrounding whitespace removed"]
const email = "maya@example.com"
const result = InclusiveOr.LeftAndRight({ left: warnings, right: email })
// Prepare a contact record while retaining the cleanup warnings.
const mapped = pipe(
  result,
  InclusiveOr.mapRight((email: string) => ({ email }))
)
assert.deepStrictEqual(
  mapped,
  InclusiveOr.LeftAndRight({
    left: warnings,
    right: { email: "maya@example.com" }
  })
)
```

Added in v0.0.0

# models

## InclusiveOr (type alias)

A value with a left payload, a right payload, or both. Use it when an operation can
produce problems and a usable result together, such as saving a cleaned form field.

**Signature**

```ts
export type InclusiveOr<L, R> = Data.TaggedEnum<{
  LeftOnly: {
    readonly left: L
  }

  RightOnly: {
    readonly right: R
  }

  LeftAndRight: {
    readonly left: L
    readonly right: R
  }
}>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

const warnings = ["Surrounding whitespace removed"]
const email = "maya@example.com"
// Cleaning the sign-up field produced an email and a warning.
const result: InclusiveOr.InclusiveOr<string[], string> = InclusiveOr.LeftAndRight({ left: warnings, right: email })
assert.deepStrictEqual(result, { _tag: "LeftAndRight", left: warnings, right: email })
```

Added in v0.0.0

## LeftAndRight (type alias)

A value that carries both payloads. Use this type when problems accompany a result
that is still usable.

**Signature**

```ts
export type LeftAndRight<L, R> = InclusiveOr<L, R> & {
  _tag: "LeftAndRight"
}
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

const warnings = ["Surrounding whitespace removed"]
const email = "maya@example.com"
// Keep the cleanup warning alongside the email that can be saved.
const result: InclusiveOr.LeftAndRight<string[], string> = InclusiveOr.LeftAndRight({ left: warnings, right: email })
assert.deepStrictEqual(result, { _tag: "LeftAndRight", left: warnings, right: email })
```

Added in v0.0.0

## LeftOnly (type alias)

A value that carries only a left payload. Use this type for problems that have no
usable result yet.

**Signature**

```ts
export type LeftOnly<L> = InclusiveOr<L, never> & {
  _tag: "LeftOnly"
}
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

// The sign-up email is missing, so there is nothing to save.
const result: InclusiveOr.LeftOnly<string[]> = InclusiveOr.LeftOnly({ left: ["Email is required"] })
assert.deepStrictEqual(result.left, ["Email is required"])
```

Added in v0.0.0

## RightOnly (type alias)

A value that carries only a right payload. Use this type for a usable result with
no accompanying problems.

**Signature**

```ts
export type RightOnly<R> = InclusiveOr<never, R> & {
  _tag: "RightOnly"
}
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

// This sign-up email needs no cleanup.
const result: InclusiveOr.RightOnly<string> = InclusiveOr.RightOnly({ right: "maya@example.com" })
assert.deepStrictEqual(result.right, "maya@example.com")
```

Added in v0.0.0

## WithLeft (type alias)

Either a left-only value or a value with both sides. Use this type when problems
are always available but a usable result may be missing.

**Signature**

```ts
export type WithLeft<L, R> = LeftOnly<L> | LeftAndRight<L, R>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

// The form always has a validation message; an email may become available later.
const result: InclusiveOr.WithLeft<string[], string> = InclusiveOr.LeftOnly({ left: ["Email is required"] })
assert.deepStrictEqual(result.left, ["Email is required"])
```

Added in v0.0.0

## WithRight (type alias)

Either a right-only value or a value with both sides. Use this type when a usable
result is always available but accompanying problems may be missing.

**Signature**

```ts
export type WithRight<L, R> = RightOnly<R> | LeftAndRight<L, R>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

// The cleaned email can be saved whether or not cleanup produced warnings.
const result: InclusiveOr.WithRight<string[], string> = InclusiveOr.RightOnly({ right: "maya@example.com" })
assert.deepStrictEqual(result.right, "maya@example.com")
```

Added in v0.0.0

# pattern matching

## match

Chooses one of three handlers from the value's tag and returns that handler's
result. Use it when each combination of problems and usable data needs its own
handling. It supports both direct and piped calls.

**Signature**

```ts
export declare const match: {
  <A, B, C, D, Cases>(
    cases: Cases
  ): (
    self: Data.TaggedEnum.Kind<InclusiveOrDefinition, A, B, C, D>
  ) => Unify<ReturnType<Cases["LeftOnly" | "RightOnly" | "LeftAndRight"]>>
  <A, B, C, D, Cases>(
    self:
      | { readonly _tag: "LeftOnly"; readonly left: A }
      | { readonly _tag: "RightOnly"; readonly right: B }
      | { readonly _tag: "LeftAndRight"; readonly left: A; readonly right: B },
    cases: Cases
  ): Unify<ReturnType<Cases["LeftOnly" | "RightOnly" | "LeftAndRight"]>>
}
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { pipe } from "effect"

const warnings = ["Surrounding whitespace removed"]
const email = "maya@example.com"
const result = InclusiveOr.LeftAndRight({ left: warnings, right: email })
const describe = {
  LeftOnly: ({ left }: InclusiveOr.LeftOnly<string[]>) => left.join("; "),
  RightOnly: ({ right }: InclusiveOr.RightOnly<string>) => `Save ${right}`,
  LeftAndRight: ({ left, right }: InclusiveOr.LeftAndRight<string[], string>) => `Save ${right}: ${left.join("; ")}`
}
// Show both the cleaned email and the reason it changed.
assert.strictEqual(pipe(result, InclusiveOr.match(describe)), "Save maya@example.com: Surrounding whitespace removed")
assert.strictEqual(InclusiveOr.match(result, describe), pipe(result, InclusiveOr.match(describe)))
```

Added in v0.0.0

## matchLeft

Handles values according to whether a left payload exists. Use it to display
problems regardless of whether usable data also exists. LeftOnly and LeftAndRight
pass their left to Left; RightOnly passes its right to RightOnly.

**Signature**

```ts
export declare const matchLeft: <L, R, A>({
  Left,
  RightOnly
}: {
  Left: (left: L) => A
  RightOnly: (right: R) => A
}) => (inclusiveOr: InclusiveOr<L, R>) => A
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { pipe } from "effect"

const warnings = ["Surrounding whitespace removed"]
const email = "maya@example.com"
const result = InclusiveOr.LeftAndRight({ left: warnings, right: email })
// Display the cleanup warning even though the email can still be saved.
const message = pipe(
  result,
  InclusiveOr.matchLeft({
    Left: (messages: string[]) => messages.join("; "),
    RightOnly: (email: string) => `Ready to save ${email}`
  })
)
assert.strictEqual(message, "Surrounding whitespace removed")
```

Added in v0.0.0

## matchRight

Handles values according to whether a right payload exists. Use it to process
usable data regardless of accompanying problems. RightOnly and LeftAndRight pass
their right to Right; LeftOnly passes its left to LeftOnly.

**Signature**

```ts
export declare const matchRight: <L, R, A>({
  LeftOnly,
  Right
}: {
  LeftOnly: (left: L) => A
  Right: (right: R) => A
}) => (inclusiveOr: InclusiveOr<L, R>) => A
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { pipe } from "effect"

const warnings = ["Surrounding whitespace removed"]
const email = "maya@example.com"
const result = InclusiveOr.LeftAndRight({ left: warnings, right: email })
// Prepare the usable email for saving despite the cleanup warning.
const message = pipe(
  result,
  InclusiveOr.matchRight({
    LeftOnly: (messages: string[]) => messages.join("; "),
    Right: (email: string) => `Save ${email}`
  })
)
assert.strictEqual(message, "Save maya@example.com")
```

Added in v0.0.0

# sequencing

## flatMapLeft

Replaces the whole value with a mapper's InclusiveOr when left exists.
Use it when rechecking problems can change which sides are available.
The original opposite payload is discarded, including on LeftAndRight; it is
not accumulated. Values without left pass through.

**Signature**

```ts
export declare const flatMapLeft: <L1, L2, R2>(
  mapLeft: (left: L1) => InclusiveOr<L2, R2>
) => <R1>(inclusiveOr: InclusiveOr<L1, R1>) => InclusiveOr<L2, R1 | R2>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { pipe } from "effect"

// An imported contact is usable, but rechecking its missing name rejects the row.
const row = InclusiveOr.LeftAndRight({
  left: ["Name is missing"],
  right: { email: "maya@example.com" }
})
const checked = pipe(
  row,
  InclusiveOr.flatMapLeft((problems: string[]) =>
    InclusiveOr.LeftOnly({ left: problems.map((problem) => `Unresolved: ${problem}`) })
  )
)
// The new problems-only result replaces the entire row, including its contact.
assert.deepStrictEqual(checked, InclusiveOr.LeftOnly({ left: ["Unresolved: Name is missing"] }))
```

Added in v0.0.0

## flatMapLeftEffect

Replaces the whole value with an effectful mapper's InclusiveOr when left exists.
Use it when rechecking problems can change which sides are available.
The original opposite payload is discarded, including on LeftAndRight; it is
not accumulated. Values without left pass through in a successful Effect. A mapper failure fails the result.

**Signature**

```ts
export declare const flatMapLeftEffect: <L1, L2, R2, EL, RL>(
  mapLeft: (left: L1) => Effect.Effect<InclusiveOr<L2, R2>, EL, RL>
) => <R1>(inclusiveOr: InclusiveOr<L1, R1>) => Effect.Effect<InclusiveOr<L2, R1 | R2>, EL, RL>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { Effect, pipe } from "effect"

// An imported contact is usable, but rechecking its missing name rejects the row.
const row = InclusiveOr.LeftAndRight({
  left: ["Name is missing"],
  right: { email: "maya@example.com" }
})
const checked = pipe(
  row,
  InclusiveOr.flatMapLeftEffect((problems: string[]) =>
    Effect.succeed(InclusiveOr.LeftOnly({ left: problems.map((problem) => `Unresolved: ${problem}`) }))
  )
)
// The new problems-only result replaces the entire row, including its contact.
assert.deepStrictEqual(Effect.runSync(checked), InclusiveOr.LeftOnly({ left: ["Unresolved: Name is missing"] }))
```

Added in v0.0.0

## flatMapRight

Replaces the whole value with a mapper's InclusiveOr when right exists.
Use it when processing usable data can change which sides are available.
The original opposite payload is discarded, including on LeftAndRight; it is
not accumulated. Values without right pass through.

**Signature**

```ts
export declare const flatMapRight: <L2, R1, R2>(
  mapRight: (right: R1) => InclusiveOr<L2, R2>
) => <L1>(inclusiveOr: InclusiveOr<L1, R1>) => InclusiveOr<L1 | L2, R2>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { pipe } from "effect"

const warnings = ["Surrounding whitespace removed"]
const email = "maya@example.com"
const result = InclusiveOr.LeftAndRight({ left: warnings, right: email })
// Rechecking the cleaned email produces a fresh result with no problems.
const checked = pipe(
  result,
  InclusiveOr.flatMapRight((email: string) => InclusiveOr.RightOnly({ right: { email } }))
)
// The original cleanup warning is discarded rather than accumulated.
assert.deepStrictEqual(checked, InclusiveOr.RightOnly({ right: { email: "maya@example.com" } }))
```

Added in v0.0.0

## flatMapRightEffect

Replaces the whole value with an effectful mapper's InclusiveOr when right exists.
Use it when processing usable data can change which sides are available.
The original opposite payload is discarded, including on LeftAndRight; it is
not accumulated. Values without right pass through in a successful Effect. A mapper failure fails the result.

**Signature**

```ts
export declare const flatMapRightEffect: <L2, R1, R2, ER, RR>(
  mapRight: (right: R1) => Effect.Effect<InclusiveOr<L2, R2>, ER, RR>
) => <L1>(inclusiveOr: InclusiveOr<L1, R1>) => Effect.Effect<InclusiveOr<L1 | L2, R2>, ER, RR>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { Effect, pipe } from "effect"

const warnings = ["Surrounding whitespace removed"]
const email = "maya@example.com"
const result = InclusiveOr.LeftAndRight({ left: warnings, right: email })
// Rechecking the cleaned email produces a fresh result with no problems.
const checked = pipe(
  result,
  InclusiveOr.flatMapRightEffect((email: string) => Effect.succeed(InclusiveOr.RightOnly({ right: { email } })))
)
// The original cleanup warning is discarded rather than accumulated.
assert.deepStrictEqual(Effect.runSync(checked), InclusiveOr.RightOnly({ right: { email: "maya@example.com" } }))
```

Added in v0.0.0

## mapBothEffect

Transforms each present payload with an Effect and keeps the original tag. Use it
when preparing problems and usable data requires effectful work. On a both-sides
value, the left effect runs before the right; failure stops execution and fails
the result. Missing sides never call their mapper.

**Signature**

```ts
export declare const mapBothEffect: <L1, R1, L2, R2, EL, ER, RL, RR>({
  mapLeft,
  mapRight
}: {
  mapLeft: (left: L1) => Effect.Effect<L2, EL, RL>
  mapRight: (right: R1) => Effect.Effect<R2, ER, RR>
}) => (inclusiveOr: InclusiveOr<L1, R1>) => Effect.Effect<InclusiveOr<L2, R2>, EL | ER, RL | RR>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { Effect, pipe } from "effect"

const warnings = ["Surrounding whitespace removed"]
const email = "maya@example.com"
const result = InclusiveOr.LeftAndRight({ left: warnings, right: email })
// Prepare warning text first, then prepare the contact record.
const mapped = pipe(
  result,
  InclusiveOr.mapBothEffect({
    mapLeft: (messages: string[]) => Effect.succeed(messages.join("; ")),
    mapRight: (email: string) => Effect.succeed({ email })
  })
)
assert.deepStrictEqual(
  Effect.runSync(mapped),
  InclusiveOr.LeftAndRight({
    left: "Surrounding whitespace removed",
    right: { email: "maya@example.com" }
  })
)
```

Added in v0.0.0

## mapLeftEffect

Transforms the left payload with an Effect, keeping any right payload and the tag.
Use it to prepare problem messages without changing usable data.
When left is absent, its mapper is not called. A mapper failure fails the result.

**Signature**

```ts
export declare const mapLeftEffect: <L1, L2, EL, RL>(
  mapLeft: (left: L1) => Effect.Effect<L2, EL, RL>
) => <R>(inclusiveOr: InclusiveOr<L1, R>) => Effect.Effect<InclusiveOr<L2, R>, EL, RL>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { Effect, pipe } from "effect"

const warnings = ["Surrounding whitespace removed"]
const email = "maya@example.com"
const result = InclusiveOr.LeftAndRight({ left: warnings, right: email })
// Prepare one display message while retaining the email.
const mapped = pipe(
  result,
  InclusiveOr.mapLeftEffect((messages: string[]) => Effect.succeed(messages.join("; ")))
)
assert.deepStrictEqual(
  Effect.runSync(mapped),
  InclusiveOr.LeftAndRight({
    left: "Surrounding whitespace removed",
    right: email
  })
)
```

Added in v0.0.0

## mapRightEffect

Transforms the right payload with an Effect, keeping any left payload and the tag.
Use it to prepare usable data without changing its problems.
When right is absent, its mapper is not called. A mapper failure fails the result.

**Signature**

```ts
export declare const mapRightEffect: <R1, R2, ER, RR>(
  mapRight: (right: R1) => Effect.Effect<R2, ER, RR>
) => <L>(inclusiveOr: InclusiveOr<L, R1>) => Effect.Effect<InclusiveOr<L, R2>, ER, RR>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { Effect, pipe } from "effect"

const warnings = ["Surrounding whitespace removed"]
const email = "maya@example.com"
const result = InclusiveOr.LeftAndRight({ left: warnings, right: email })
// Prepare a contact record while retaining the cleanup warnings.
const mapped = pipe(
  result,
  InclusiveOr.mapRightEffect((email: string) => Effect.succeed({ email }))
)
assert.deepStrictEqual(
  Effect.runSync(mapped),
  InclusiveOr.LeftAndRight({
    left: warnings,
    right: { email: "maya@example.com" }
  })
)
```

Added in v0.0.0
