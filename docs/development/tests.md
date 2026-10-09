# Tests

> Provenance: the exhaustive-coverage baseline is effect-extras's own prior rule; the runtime-edge-case
> and dual-call-style requirements below are direct operator direction, extending it rather than
> patching it on.

Exhaustive coverage per public function. This is non-negotiable: these utilities are consumed by every
layer above them, they outlive the surrounding code, and they have no domain context to specify them
other than their tests. **The tests are the spec.** Tests use `@effect/vitest`.

A helper's test file is complete only when all three of the following hold.

## Happy path and every edge case

Every helper is tested on its normal use and on every edge case: empty, single element, boundaries, and
each branch. Type-level correctness is tested too, where the helper's whole point is type narrowing.

## Runtime edge cases the types reject

Some tests deliberately pass input that wouldn't compile — `null` or `undefined` where a value is
required, a wrong-shaped object, an out-of-range literal — and assert that the runtime result is
sensible. Consumers can reach a helper from untyped or loosely typed code (a `.js` call site, an `any`
upstream, a deserialized payload), and these tests pin what happens then.

Suppress the type error with `// @ts-expect-error - <reason naming the case>`, never `@ts-ignore`: the
lint config (typescript-eslint `strict`) rejects `@ts-ignore` outright and requires a reason on
`@ts-expect-error`. Unlike `@ts-ignore`, `@ts-expect-error` also fails the build the day the call
legitimately starts compiling, so the suppression can't quietly outlive its cause. This is a sanctioned
use, not a forbidden shortcut — see [no type assertions](./effect-patterns.md#no-type-assertions).

`src/StructX.test.ts` already uses this form:

```ts
test("key missing — returns empty object", () => {
  expect(
    pickSome(
      // @ts-expect-error - missing key
      record,
      "missing",
    ),
  ).toStrictEqual({});
});
```

## Both call styles

Every `dual` helper has tests that call it **both** data-first and data-last (inside `pipe`), asserting
that both forms return the same result. A helper that only exercises one calling convention hasn't
proven the other overload works.

```ts
test("data-first and data-last agree", () => {
  const dataFirst = withPrefix(id, "x:");
  const dataLast = pipe(id, withPrefix("x:"));
  expect(dataFirst).toStrictEqual(dataLast);
});
```

## Pinning "input left unmutated"

When a test exists only to prove the input wasn't mutated in place, assert the real output first
(even though another test already covers its value), then re-assert on `input` with a comment
calling out that the second assertion targets the original reference, not the result. A lone
`expect(input).toStrictEqual(...)` with no call to the helper's output reads as if the helper is
supposed to transform `input` itself, which is confusing on a first read.

## Prefer `vi.fn()` over hand-rolled call recorders

To assert how many times a callback ran, with what arguments, and in what order, use `vi.fn()` and
inspect `.mock.calls` — don't hand-roll the same bookkeeping with a local array and manual
`.push(...)` calls. `vi.fn()` is the project's existing test-runner primitive for this.

## Working with existing tests

> Provenance: StoryCut's AGENTS.md "Working with existing tests", on a point the operator's rule and
> ampm are both silent on.

When changing a helper's behavior:

1. Read the existing tests covering it first.
2. Update the assertions that changed because the behavior changed, with a comment explaining _why_ —
   don't silently re-baseline an expectation.
3. Add tests for any previously-uncovered case the change introduces.
4. Run `pnpm test` and confirm everything passes.
