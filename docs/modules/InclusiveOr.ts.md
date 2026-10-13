---
title: InclusiveOr.ts
nav_order: 7
parent: Modules
---

## InclusiveOr overview

A value carrying a left payload, a right payload, or both at once.
Use InclusiveOr when at least one of two independent pieces of data must be
available. Its three variants exclude the state where neither side exists;
left and right have no built-in priority or error/success meaning.

Named example scenarios:

- Contact lookup: fetch an email address and a phone number for the same person.
  Left contains the email, such as maya@example.com; right contains the phone,
  such as +1-415-555-0136. Either detail is useful on its own, and both can be
  retained together. If neither is found, Option.none() represents no contact
  result outside InclusiveOr.
- Contact list pairing: pair email and phone lists for the same people in the
  same order. zip keeps unmatched tails; pairing is positional, not a join by ID.

WarnResult assigns warnings and success to its sides. Use it for those roles.

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

Pairs two arrays by index and collects the callback's result for each InclusiveOr.
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

// These contact lists refer to the same people in the same order.
const emails = ["maya@example.com", "lee@example.com"]
const phones = ["+1-415-555-0136"]
const toContact = (pair: InclusiveOr.InclusiveOr<string, string>) => ({
  email: pipe(pair, InclusiveOr.leftOrUndefined),
  phone: pipe(pair, InclusiveOr.rightOrUndefined)
})
// Maya has both details; the unmatched second entry contains only Lee's email.
const contacts = InclusiveOr.zip(emails, phones, toContact)
assert.deepStrictEqual(contacts, [
  { email: "maya@example.com", phone: "+1-415-555-0136" },
  { email: "lee@example.com", phone: undefined }
])
// The piped form produces the same contact records and unmatched tail.
assert.deepStrictEqual(pipe(emails, InclusiveOr.zip(phones, toContact)), contacts)
```

Added in v0.0.0

# constructors

## LeftAndRight

Creates a value carrying both payloads.
Use it when both pieces of data are available, such as a fetched email address
and phone number. Both payloads are retained, even if they are nullish.

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

// Both lookups found contact details; retain them together.
const contact = InclusiveOr.LeftAndRight({ left: "maya@example.com", right: "+1-415-555-0136" })
assert.deepStrictEqual(contact, {
  _tag: "LeftAndRight",
  left: "maya@example.com",
  right: "+1-415-555-0136"
})
```

Added in v0.0.0

## LeftOnly

Creates a value carrying only a left payload. Use it when only the first
piece of data is available, such as an email address without a phone number.
The supplied payload is preserved, even if it is nullish.

**Signature**

```ts
export declare const LeftOnly: <A, B>(args: {
  readonly left: A
}) => Data.TaggedEnum.Value<Data.TaggedEnum.Kind<InclusiveOrDefinition, A, B>, "LeftOnly">
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

// The lookup found Maya's email address but no phone number.
const contact = InclusiveOr.LeftOnly({ left: "maya@example.com" })
assert.deepStrictEqual(contact, { _tag: "LeftOnly", left: "maya@example.com" })
```

Added in v0.0.0

## RightOnly

Creates a value carrying only a right payload. Use it when only the second
piece of data is available, such as a phone number without an email address.
The supplied payload is preserved, even if it is nullish.

**Signature**

```ts
export declare const RightOnly: <A, B>(args: {
  readonly right: B
}) => Data.TaggedEnum.Value<Data.TaggedEnum.Kind<InclusiveOrDefinition, A, B>, "RightOnly">
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

// The lookup found Maya's phone number but no email address.
const contact = InclusiveOr.RightOnly({ right: "+1-415-555-0136" })
assert.deepStrictEqual(contact, { _tag: "RightOnly", right: "+1-415-555-0136" })
```

Added in v0.0.0

## WithLeft

Creates a value with a mandatory left payload and an optional right companion.
Use it when the email address is known but the phone number might be absent.
A null or undefined companion produces LeftOnly; any other companion produces
LeftAndRight. The mandatory left is preserved even when nullish.

**Signature**

```ts
export declare const WithLeft: <L, R>({ left, right }: { left: L; right?: R | undefined }) => WithLeft<L, R>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

const email = "maya@example.com"
const phone = "+1-415-555-0136"
// Keep the fetched email address, whether or not the other lookup found data.
assert.deepStrictEqual(
  InclusiveOr.WithLeft({ left: "maya@example.com" }),
  InclusiveOr.LeftOnly({ left: "maya@example.com" })
)
assert.deepStrictEqual(
  InclusiveOr.WithLeft({ left: email, right: phone }),
  InclusiveOr.LeftAndRight({ left: email, right: phone })
)
```

Added in v0.0.0

## WithRight

Creates a value with a mandatory right payload and an optional left companion.
Use it when the phone number is known but the email address might be absent.
A null or undefined companion produces RightOnly; any other companion produces
LeftAndRight. The mandatory right is preserved even when nullish.

**Signature**

```ts
export declare const WithRight: <L, R>({ left, right }: { left?: L | undefined; right: R }) => WithRight<L, R>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

const email = "maya@example.com"
const phone = "+1-415-555-0136"
// Keep the fetched phone number, whether or not the other lookup found data.
assert.deepStrictEqual(
  InclusiveOr.WithRight({ right: "+1-415-555-0136" }),
  InclusiveOr.RightOnly({ right: "+1-415-555-0136" })
)
assert.deepStrictEqual(
  InclusiveOr.WithRight({ left: email, right: phone }),
  InclusiveOr.LeftAndRight({ left: email, right: phone })
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

// Neither lookup found data; fall back to a locally saved email address.
const savedEmail = "maya@example.com"
const contact = InclusiveOr.fromNullables({
  left: null,
  right: undefined,
  orElse: () => InclusiveOr.LeftOnly({ left: savedEmail })
})
assert.deepStrictEqual(contact, InclusiveOr.LeftOnly({ left: savedEmail }))
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

// The email lookup found nothing, but the phone lookup found a number.
assert.deepStrictEqual(
  InclusiveOr.optionFromNullables({ left: null, right: "+1-415-555-0136" }),
  Option.some(InclusiveOr.RightOnly({ right: "+1-415-555-0136" }))
)
// With neither detail, there is no contact result to construct.
assert.deepStrictEqual(InclusiveOr.optionFromNullables({ left: null, right: undefined }), Option.none())
```

Added in v0.0.0

# getters

## leftOption

Reads the left payload as Some, or returns None if that side is missing. Use it
to compose an optional email address with Option helpers. A present null or
undefined payload is still Some.

**Signature**

```ts
export declare const leftOption: <L, R>(inclusiveOr: InclusiveOr<L, R>) => Option.Option<L>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { Option, pipe } from "effect"

// Keep the email address available for an optional contact link.
const contact = InclusiveOr.LeftOnly({ left: "maya@example.com" })
assert.deepStrictEqual(pipe(contact, InclusiveOr.leftOption), Option.some("maya@example.com"))
// The other detail alone provides no email address.
assert.deepStrictEqual(pipe(InclusiveOr.RightOnly({ right: "+1-415-555-0136" }), InclusiveOr.leftOption), Option.none())
```

Added in v0.0.0

## leftOrElse

Reads the left payload, calling a lazy fallback only when that side is missing.
Use it to get an email address with a default in one step. A present null or
undefined payload does not invoke the fallback.

**Signature**

```ts
export declare const leftOrElse: <A>(orElseReturn: () => A) => <L, R>(inclusiveOr: InclusiveOr<L, R>) => L | A
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { pipe } from "effect"

// The lookup lacks an email address; read it from saved contact details.
const saved = "maya@example.com"
const detail = pipe(
  InclusiveOr.RightOnly({ right: "+1-415-555-0136" }),
  InclusiveOr.leftOrElse(() => saved)
)
assert.strictEqual(detail, saved)
```

Added in v0.0.0

## leftOrUndefined

Reads the left payload, returning undefined if that side is missing. Use it
when an email address can be absent and no default is needed. Present nullish
payloads are preserved.

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

// This contact has no email address to display.
assert.strictEqual(pipe(InclusiveOr.RightOnly({ right: "+1-415-555-0136" }), InclusiveOr.leftOrUndefined), undefined)
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

const contact = InclusiveOr.LeftOnly({ left: "maya@example.com" })
const savedPhone = "+1-415-555-0136"
// Keep the fetched email and fill in the phone from locally saved details.
const complete = pipe(
  contact,
  InclusiveOr.orElse({
    orElseLeft: () => "saved@example.com",
    orElseRight: () => savedPhone
  })
)
assert.deepStrictEqual(
  complete,
  InclusiveOr.LeftAndRight({
    left: "maya@example.com",
    right: "+1-415-555-0136"
  })
)
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

// The lookup found only an email; expose the missing phone as undefined.
const contact = pipe(InclusiveOr.LeftOnly({ left: "maya@example.com" }), InclusiveOr.orUndefined)
assert.deepStrictEqual(contact, InclusiveOr.LeftAndRight({ left: "maya@example.com", right: undefined }))
```

Added in v0.0.0

## rightOption

Reads the right payload as Some, or returns None if that side is missing. Use it
to compose an optional phone number with Option helpers. A present null or
undefined payload is still Some.

**Signature**

```ts
export declare const rightOption: <L, R>(inclusiveOr: InclusiveOr<L, R>) => Option.Option<R>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { Option, pipe } from "effect"

// Keep the phone number available for an optional contact link.
const contact = InclusiveOr.RightOnly({ right: "+1-415-555-0136" })
assert.deepStrictEqual(pipe(contact, InclusiveOr.rightOption), Option.some("+1-415-555-0136"))
// The other detail alone provides no phone number.
assert.deepStrictEqual(pipe(InclusiveOr.LeftOnly({ left: "maya@example.com" }), InclusiveOr.rightOption), Option.none())
```

Added in v0.0.0

## rightOrElse

Reads the right payload, calling a lazy fallback only when that side is missing.
Use it to get a phone number with a default in one step. A present null or
undefined payload does not invoke the fallback.

**Signature**

```ts
export declare const rightOrElse: <A>(orElseReturn: () => A) => <L, R>(inclusiveOr: InclusiveOr<L, R>) => R | A
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"
import { pipe } from "effect"

// The lookup lacks a phone number; read it from saved contact details.
const saved = "+1-415-555-0136"
const detail = pipe(
  InclusiveOr.LeftOnly({ left: "maya@example.com" }),
  InclusiveOr.rightOrElse(() => saved)
)
assert.strictEqual(detail, saved)
```

Added in v0.0.0

## rightOrUndefined

Reads the right payload, returning undefined if that side is missing. Use it
when a phone number can be absent and no default is needed. Present nullish
payloads are preserved.

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

// This contact has no phone number to display.
assert.strictEqual(pipe(InclusiveOr.LeftOnly({ left: "maya@example.com" }), InclusiveOr.rightOrUndefined), undefined)
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

const contact = InclusiveOr.LeftAndRight({
  left: "maya@example.com",
  right: "+1-415-555-0136"
})
// Recognise a contact with both an email address and a phone number.
assert.strictEqual(pipe(contact, InclusiveOr.is("LeftAndRight")), true)
assert.strictEqual(InclusiveOr.is("LeftOnly")(contact), false)
```

Added in v0.0.0

# mapping

## mapBoth

Transforms each present payload and keeps the original tag. Use it when both
email addresses and phone numbers need a new representation. A missing side
never calls its mapper; the original value is left unchanged.

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

const contact = InclusiveOr.LeftAndRight({
  left: "maya@example.com",
  right: "+1-415-555-0136"
})
// Turn each available contact detail into a link.
const links = pipe(
  contact,
  InclusiveOr.mapBoth({
    mapLeft: (email: string) => `mailto:${email}`,
    mapRight: (phone: string) => `tel:${phone}`
  })
)
assert.deepStrictEqual(
  links,
  InclusiveOr.LeftAndRight({
    left: "mailto:maya@example.com",
    right: "tel:+1-415-555-0136"
  })
)
```

Added in v0.0.0

## mapLeft

Transforms the left payload, keeping any right payload and the tag.
Use it to prepare an email link without changing the phone detail.
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

const contact = InclusiveOr.LeftAndRight({
  left: "maya@example.com",
  right: "+1-415-555-0136"
})
// Prepare an email link while retaining the phone detail.
const mapped = pipe(
  contact,
  InclusiveOr.mapLeft((email: string) => `mailto:${email}`)
)
assert.deepStrictEqual(
  mapped,
  InclusiveOr.LeftAndRight({
    left: "mailto:maya@example.com",
    right: "+1-415-555-0136"
  })
)
```

Added in v0.0.0

## mapRight

Transforms the right payload, keeping any left payload and the tag.
Use it to prepare a phone link without changing the email detail.
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

const contact = InclusiveOr.LeftAndRight({
  left: "maya@example.com",
  right: "+1-415-555-0136"
})
// Prepare a phone link while retaining the email detail.
const mapped = pipe(
  contact,
  InclusiveOr.mapRight((phone: string) => `tel:${phone}`)
)
assert.deepStrictEqual(
  mapped,
  InclusiveOr.LeftAndRight({
    right: "tel:+1-415-555-0136",
    left: "maya@example.com"
  })
)
```

Added in v0.0.0

# models

## InclusiveOr (type alias)

A value with a left payload, a right payload, or both. Use it when at least one
of two independent pieces of data must be available, such as a fetched email
address or phone number. There is no variant with neither side.

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
import { Option } from "effect"

type ContactDetails = InclusiveOr.InclusiveOr<string, string>
// Assemble the results of independent email and phone lookups.
const fromLookups = (email: string | null, phone: string | null): Option.Option<ContactDetails> =>
  InclusiveOr.optionFromNullables({ left: email, right: phone })
const email = "maya@example.com"
const phone = "+1-415-555-0136"
// Either detail is enough; when both are found, retain both.
assert.deepStrictEqual(fromLookups(email, null), Option.some(InclusiveOr.LeftOnly({ left: email })))
assert.deepStrictEqual(fromLookups(null, phone), Option.some(InclusiveOr.RightOnly({ right: phone })))
assert.deepStrictEqual(fromLookups(email, phone), Option.some(InclusiveOr.LeftAndRight({ left: email, right: phone })))
// Neither found is represented outside InclusiveOr, which has no such variant.
assert.deepStrictEqual(fromLookups(null, null), Option.none())
```

Added in v0.0.0

## LeftAndRight (type alias)

A value that carries both payloads.
Use it when both pieces of data are available, such as a fetched email address
and phone number. Both payloads are retained, even if they are nullish.

**Signature**

```ts
export type LeftAndRight<L, R> = InclusiveOr<L, R> & {
  _tag: "LeftAndRight"
}
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

// Both lookups found contact details; retain them together.
const contact: InclusiveOr.LeftAndRight<string, string> = InclusiveOr.LeftAndRight({
  left: "maya@example.com",
  right: "+1-415-555-0136"
})
assert.deepStrictEqual(contact, {
  _tag: "LeftAndRight",
  left: "maya@example.com",
  right: "+1-415-555-0136"
})
```

Added in v0.0.0

## LeftOnly (type alias)

A value that carries only a left payload. Use this type when only the first
piece of data is available, such as an email address without a phone number.

**Signature**

```ts
export type LeftOnly<L> = InclusiveOr<L, never> & {
  _tag: "LeftOnly"
}
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

// The lookup found Maya's email address but no phone number.
const contact: InclusiveOr.LeftOnly<string> = InclusiveOr.LeftOnly({ left: "maya@example.com" })
assert.strictEqual(contact.left, "maya@example.com")
```

Added in v0.0.0

## RightOnly (type alias)

A value that carries only a right payload. Use this type when only the second
piece of data is available, such as a phone number without an email address.

**Signature**

```ts
export type RightOnly<R> = InclusiveOr<never, R> & {
  _tag: "RightOnly"
}
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

// The lookup found Maya's phone number but no email address.
const contact: InclusiveOr.RightOnly<string> = InclusiveOr.RightOnly({ right: "+1-415-555-0136" })
assert.strictEqual(contact.right, "+1-415-555-0136")
```

Added in v0.0.0

## WithLeft (type alias)

Either a left-only value or a value with both sides. Use this type when the
email address is always available but the phone number may be missing.

**Signature**

```ts
export type WithLeft<L, R> = LeftOnly<L> | LeftAndRight<L, R>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

// A fetched email address guarantees one way to reach Maya.
const contact: InclusiveOr.WithLeft<string, string> = InclusiveOr.LeftOnly({ left: "maya@example.com" })
assert.strictEqual(contact.left, "maya@example.com")
```

Added in v0.0.0

## WithRight (type alias)

Either a right-only value or a value with both sides. Use this type when the
phone number is always available but the email address may be missing.

**Signature**

```ts
export type WithRight<L, R> = RightOnly<R> | LeftAndRight<L, R>
```

**Example**

```ts
import { InclusiveOr } from "@nunofyobiz/effect-extras"

// A fetched phone number guarantees one way to reach Maya.
const contact: InclusiveOr.WithRight<string, string> = InclusiveOr.RightOnly({ right: "+1-415-555-0136" })
assert.strictEqual(contact.right, "+1-415-555-0136")
```

Added in v0.0.0

# pattern matching

## match

Chooses one of three handlers from the value's tag and returns that handler's
result. Use it when each combination of available data needs its own handling.
It supports both direct and piped calls.

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

const contact = InclusiveOr.LeftAndRight({
  left: "maya@example.com",
  right: "+1-415-555-0136"
})
const describe = {
  LeftOnly: ({ left }: InclusiveOr.LeftOnly<string>) => `Email: ${left}`,
  RightOnly: ({ right }: InclusiveOr.RightOnly<string>) => `Phone: ${right}`,
  LeftAndRight: ({ left, right }: InclusiveOr.LeftAndRight<string, string>) => `Email: ${left}; phone: ${right}`
}
// A contact with both details displays both ways to reach Maya.
assert.strictEqual(pipe(contact, InclusiveOr.match(describe)), "Email: maya@example.com; phone: +1-415-555-0136")
assert.strictEqual(InclusiveOr.match(contact, describe), pipe(contact, InclusiveOr.match(describe)))
```

Added in v0.0.0

## matchLeft

Handles values according to whether a left payload exists. Use it to work with
an email address whenever one is available, including when a phone number also
exists. LeftOnly and LeftAndRight pass their left to Left; RightOnly passes its
right to RightOnly.

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

const contact = InclusiveOr.LeftAndRight({
  left: "maya@example.com",
  right: "+1-415-555-0136"
})
// Offer an email link when available, otherwise offer a phone link.
const link = pipe(
  contact,
  InclusiveOr.matchLeft({
    Left: (email: string) => `mailto:${email}`,
    RightOnly: (phone: string) => `tel:${phone}`
  })
)
assert.strictEqual(link, "mailto:maya@example.com")
```

Added in v0.0.0

## matchRight

Handles values according to whether a right payload exists. Use it to work with
a phone number whenever one is available, including when an email address also
exists. RightOnly and LeftAndRight pass their right to Right; LeftOnly passes
its left to LeftOnly.

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

const contact = InclusiveOr.LeftAndRight({
  left: "maya@example.com",
  right: "+1-415-555-0136"
})
// Offer a phone link when available, otherwise offer an email link.
const link = pipe(
  contact,
  InclusiveOr.matchRight({
    LeftOnly: (email: string) => `mailto:${email}`,
    Right: (phone: string) => `tel:${phone}`
  })
)
assert.strictEqual(link, "tel:+1-415-555-0136")
```

Added in v0.0.0

# sequencing

## flatMapLeft

Replaces the whole value with a mapper's InclusiveOr when left exists.
Use it when processing an email detail produces a fresh contact result.
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

const contact = InclusiveOr.LeftAndRight({
  left: "maya@example.com",
  right: "+1-415-555-0136"
})
// Create a fresh email-only contact card from the available email.
const card = pipe(
  contact,
  InclusiveOr.flatMapLeft((email: string) => InclusiveOr.LeftOnly({ left: { email } }))
)
// This is a replacement: the original phone is not merged into the card.
assert.deepStrictEqual(card, InclusiveOr.LeftOnly({ left: { email: "maya@example.com" } }))
```

Added in v0.0.0

## flatMapLeftEffect

Replaces the whole value with an effectful mapper's InclusiveOr when left exists.
Use it when processing an email detail produces a fresh contact result.
The original opposite payload is discarded, including on LeftAndRight; it is
not accumulated. Values without left pass through in a successful Effect. A mapper
failure fails the result.

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

const contact = InclusiveOr.LeftAndRight({
  left: "maya@example.com",
  right: "+1-415-555-0136"
})
// Create a fresh email-only contact card from the available email.
const card = pipe(
  contact,
  InclusiveOr.flatMapLeftEffect((email: string) => Effect.succeed(InclusiveOr.LeftOnly({ left: { email } })))
)
// This is a replacement: the original phone is not merged into the card.
assert.deepStrictEqual(Effect.runSync(card), InclusiveOr.LeftOnly({ left: { email: "maya@example.com" } }))
```

Added in v0.0.0

## flatMapRight

Replaces the whole value with a mapper's InclusiveOr when right exists.
Use it when processing a phone detail produces a fresh contact result.
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

const contact = InclusiveOr.LeftAndRight({
  left: "maya@example.com",
  right: "+1-415-555-0136"
})
// Create a fresh phone-only contact card from the available phone.
const card = pipe(
  contact,
  InclusiveOr.flatMapRight((phone: string) => InclusiveOr.RightOnly({ right: { phone } }))
)
// This is a replacement: the original email is not merged into the card.
assert.deepStrictEqual(card, InclusiveOr.RightOnly({ right: { phone: "+1-415-555-0136" } }))
```

Added in v0.0.0

## flatMapRightEffect

Replaces the whole value with an effectful mapper's InclusiveOr when right exists.
Use it when processing a phone detail produces a fresh contact result.
The original opposite payload is discarded, including on LeftAndRight; it is
not accumulated. Values without right pass through in a successful Effect. A mapper
failure fails the result.

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

const contact = InclusiveOr.LeftAndRight({
  left: "maya@example.com",
  right: "+1-415-555-0136"
})
// Create a fresh phone-only contact card from the available phone.
const card = pipe(
  contact,
  InclusiveOr.flatMapRightEffect((phone: string) => Effect.succeed(InclusiveOr.RightOnly({ right: { phone } })))
)
// This is a replacement: the original email is not merged into the card.
assert.deepStrictEqual(Effect.runSync(card), InclusiveOr.RightOnly({ right: { phone: "+1-415-555-0136" } }))
```

Added in v0.0.0

## mapBothEffect

Transforms each present payload with an Effect and keeps the original tag.
Use it when preparing contact details requires effectful work. On a both-sides
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

const contact = InclusiveOr.LeftAndRight({
  left: "maya@example.com",
  right: "+1-415-555-0136"
})
// Prepare the email link first, then the phone link.
const links = pipe(
  contact,
  InclusiveOr.mapBothEffect({
    mapLeft: (email: string) => Effect.succeed(`mailto:${email}`),
    mapRight: (phone: string) => Effect.succeed(`tel:${phone}`)
  })
)
assert.deepStrictEqual(
  Effect.runSync(links),
  InclusiveOr.LeftAndRight({
    left: "mailto:maya@example.com",
    right: "tel:+1-415-555-0136"
  })
)
```

Added in v0.0.0

## mapLeftEffect

Transforms the left payload with an Effect, keeping any right payload and the tag.
Use it to prepare an email link without changing the phone detail.
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

const contact = InclusiveOr.LeftAndRight({
  left: "maya@example.com",
  right: "+1-415-555-0136"
})
// Prepare an email link while retaining the phone detail.
const mapped = pipe(
  contact,
  InclusiveOr.mapLeftEffect((email: string) => Effect.succeed(`mailto:${email}`))
)
assert.deepStrictEqual(
  Effect.runSync(mapped),
  InclusiveOr.LeftAndRight({
    left: "mailto:maya@example.com",
    right: "+1-415-555-0136"
  })
)
```

Added in v0.0.0

## mapRightEffect

Transforms the right payload with an Effect, keeping any left payload and the tag.
Use it to prepare a phone link without changing the email detail.
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

const contact = InclusiveOr.LeftAndRight({
  left: "maya@example.com",
  right: "+1-415-555-0136"
})
// Prepare a phone link while retaining the email detail.
const mapped = pipe(
  contact,
  InclusiveOr.mapRightEffect((phone: string) => Effect.succeed(`tel:${phone}`))
)
assert.deepStrictEqual(
  Effect.runSync(mapped),
  InclusiveOr.LeftAndRight({
    right: "tel:+1-415-555-0136",
    left: "maya@example.com"
  })
)
```

Added in v0.0.0
