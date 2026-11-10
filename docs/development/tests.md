# Tests

> Provenance: the exhaustive-coverage baseline is effect-extras's own prior rule; the runtime-edge-case
> and dual-call-style requirements below are direct operator direction, extending it rather than
> patching it on.

Exhaustive coverage per public function. This is non-negotiable: these utilities are consumed by every
layer above them, they outlive the surrounding code, and they have no domain context to specify them
other than their tests. **The tests are the spec.** Tests use `@effect/vitest`.

## Measuring one module's coverage

Replace both `<Module>` placeholders with the module name (for example, `StructX`) before running:

```sh
pnpm vitest run --coverage --coverage.include=src/<Module>.ts src/<Module>.test.ts
```

The source include selects the module to measure; the test-file filter ensures only its own tests
contribute coverage. Without that filter, another module's tests can reach this module through a
bridge and hide missing cases in its own test file. The text coverage report prints in the terminal,
and the HTML report is written to the git-ignored `coverage/` directory (`coverage/index.html`).
Vitest 5's text reporter summarizes fully covered files rather than listing a source row for each one.

This direct `pnpm vitest` command is allowed with flags: `.claude/settings.json` permits
`pnpm vitest *`, and [AGENTS.md](../../AGENTS.md#permission-prompt-posture) sanctions
`pnpm vitest run <file>`. The "run project scripts verbatim" rule still applies to scripts such as
`pnpm test`; it does not forbid this direct invocation or authorize wrappers, environment-variable
prefixes, pipes, redirects, or extra flags on project scripts.

No numeric coverage threshold is enforced locally or in CI. The expected minimum is **100% of lines,
branches, functions, and statements from the module's own test file**. A reviewer then judges
exhaustiveness against the behavioral requirements below: happy paths and every edge case, runtime
inputs the types reject, and both call styles for dual helpers. Coverage finds untested code; it does
not prove the tests are complete.

`test.todo` and `it.todo` placeholders assert nothing and never count toward this bar. A test file
with a remaining placeholder for a public helper is incomplete.

`/* v8 ignore */` coverage directives never satisfy the bar: reaching 100% by excluding code does not
meet exhaustive coverage. Code that tests cannot reach must be removed or refactored, or raised with
the operator for an explicit ruling. This guide does not authorize coverage-suppression comments.

Delegation also limits what a green report proves. WarnResult delegates to InclusiveOr, where the
branching lives, so executing WarnResult's wrappers can reach 100% with few cases. That is not evidence
that every accepted input variant is tested: WarnResult's tests must still pin every variant each
helper accepts. InclusiveOr must independently reach the coverage minimum through its own test file.

A helper's test file is complete only when it meets this coverage minimum and all three behavioral
requirements below.

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
