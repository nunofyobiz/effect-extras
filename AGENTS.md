# effect-extras — agent guide

`CLAUDE.md` is a symlink to this file. Source of truth.

When you update this file, **rewrite the affected section cohesively** — don't append patches to
the bottom. The next reader (human or agent) should be able to scan a section top-to-bottom and
understand it without archaeology.

---

## What this repo is

`@nunofyobiz/effect-extras` is a **single published npm package** of generic, framework-agnostic
extensions to the [Effect](https://effect.website) standard library — the `*X` modules (`ArrayX`,
`OptionX`, `RecordX`, `StructX`, …). Other projects depend on it; `effect` is its only peer
dependency.

The defining constraint: **no app, no framework, no domain code lives here.** Everything is pure,
generic, and universal. That constraint is the product — guard it.

> [!IMPORTANT]
> **The single most important section in this guide is [What belongs here](#what-belongs-here).** It
> is the prime directive that governs _every_ change an agent makes in this repo: before you add,
> modify, or extract any utility, confirm it belongs. When that section conflicts with convenience —
> or with anything else written here — it wins. If you read nothing else, read it.

## Package manager

**pnpm only.** Never npm, never yarn, never bun. The lockfile is `pnpm-lock.yaml`.

If `pnpm` is not found, escalate in this exact order — do not chain them:

1. Run the command as-is. If it works, stop.
2. Run `nvm use` (reads `.nvmrc`). Try again.
3. Run `source ~/.nvm/nvm.sh && nvm use`. Try again.
4. Only if all three fail, ask the user.

Do **not** prepend `cd /path/to/repo` to pnpm commands — pnpm respects the current working
directory, and chaining `cd && pnpm` triggers permission prompts unnecessarily.

## Node version

Pinned in `.nvmrc` to **24.15.0** for development. The published `engines.node` floor is `>=22`,
and CI typechecks + tests on Node **22 and 24** to keep that promise honest. Don't raise the floor
without an open discussion.

## Verification ritual

Before claiming a task done, run **`pnpm check-all`**. It runs, in order:

1. `pnpm tc` — `tsc --noEmit` (src + tests)
2. `pnpm lint` — ESLint flat config (formatting included via `eslint-plugin-prettier`; no separate
   Prettier step)
3. `pnpm test` — Vitest (`@effect/vitest`)
4. `pnpm build` — `tsup` (ESM + bundled `.d.ts`)
5. `pnpm knip` — unused files / exports / deps
6. `pnpm docgen` — `@effect/docgen`: type-checks every JSDoc `@example` (via `tsx`) and regenerates
   the API docs under `docs/` from the source

While iterating, run the individual checks (faster). CI mirrors these as one job per check, plus:
`commitlint` on PR commits, a `renovate-config-validator --strict` job, and a `publish --dry-run`
that catches `files` / `exports` misconfigurations before a real release. The `docgen` CI job runs
read-only (`contents: read`): it regenerates the docs and then fails on `git diff --exit-code docs/`
if the committed `docs/` drifted — it never writes back or opens PRs. Keeping `docs/` current is the
author's job locally (the pre-commit hook automates it; see below), so the committed docs that
GitHub Pages serves always match the source.

## What belongs here

**This is the most important section in this guide — the prime directive for any work in this
repo.** It is the whole job of the package and the one decision you'll make most often. The package's
entire value is its restraint: a "utils" grab-bag that accretes whatever is convenient is worse than
no package at all. So before you add, change, or extract anything, it must clear this bar. A utility
belongs here only if **all** of these hold:

1. **It is not already in Effect.** If `effect` (or an `@effect/*` package) already does it, use
   that. The built-in modules (`Array`, `Option`, `Record`, `Predicate`, `String`, `Number`,
   `Order`, `Result`, `Match`, `Struct`, …) are wide — check the [docs](https://effect.website)
   first.
2. **It is generic and pure.** Operates on type parameters (`<A>`), no side effects, no mutations,
   and would make sense in a project that shares nothing with yours.
3. **It carries zero app knowledge.** It never references a business domain or data model
   (`Project`, `User`, `Timeline`, …) and never encodes product rules. **This is the hard line** —
   domain-shaped helpers live in the app that owns the domain.
4. **A thin wrapper around Effect built-ins must earn its place.** Only add one when it is
   _meaningfully useful_ **and** _universal_. If a one-liner at the call site is just as clear,
   don't wrap it.

```mermaid
flowchart TD
    A([Candidate utility]) --> B{Does Effect already<br/>provide it?}
    B -- Yes --> R1[/Use Effect directly —<br/>do not add it here/]
    B -- No --> C{Does it encode any app's<br/>business logic or data model?}
    C -- Yes --> R2[/Belongs in that app —<br/>this package is domain-free/]
    C -- No --> D{Generic over &lt;A&gt;, pure,<br/>and reusable across<br/>unrelated projects?}
    D -- No --> R2
    D -- Yes --> E{Just a thin wrapper around<br/>an Effect built-in?}
    E -- No --> OK([Add it: a real gap in<br/>Effect's surface])
    E -- Yes --> F{Meaningfully useful<br/>AND universal?}
    F -- No --> R3[/Skip it: a call-site<br/>one-liner is clearer/]
    F -- Yes --> OK
```

**Does NOT belong:** anything tied to a domain model / DB row / API shape / product copy; anything
importing a framework or assuming a runtime; a wrapper that just renames an Effect function or
saves one obvious line; or a control-flow combinator Effect already ships (`sequence`, `when`,
`unless`). Extend Effect's _data_ surface, not its control flow.

When unsure, leave it at the call site. A helper graduates into this package the moment a
**second, unrelated** call site wants the same generic shape — not before.

## The `*X` module + barrel pattern

Each module is a directory under `src/`:

```
src/
  ArrayX/
    ArrayX.ts         # implementation
    ArrayX.test.ts    # exhaustive tests
    index.ts          # export * as ArrayX from "./ArrayX";
  …
  index.ts            # root barrel: export { ArrayX } from "./ArrayX"; (one line per module)
```

- The folder `index.ts` does a **namespace re-export**: `export * as ArrayX from "./ArrayX";`.
- The root `src/index.ts` re-exports each namespace by name. A module with a top-level named export
  (e.g. `NonNullableX`'s `nn`) lists it too: `export { NonNullableX, nn } from "./NonNullableX";`.
- Modules import each other by **relative path** (`import { RecordX } from "../RecordX";`) — never
  by the package name. That's why no `src/` file references `@nunofyobiz/effect-extras`.
- Adding a module = new `src/FooX/` folder (impl + test + `index.ts`) + one line in `src/index.ts`.

## Effect v4 conventions

This package targets **Effect v4** (`effect@beta`), its sole peer dependency. A few v4-isms to keep
straight when copying snippets from older Effect docs:

- **`Result` replaced `Either`.** `Either.right(x)` → `Result.success(x)`; `Either.left(e)` →
  `Result.failure(e)`. There is no `Either` alias in v4.
- **Schema checks compose with `.check(...)`**, not piped refinements:
  `Schema.Number.check(Schema.greaterThan(0))`, not `Schema.Number.pipe(Schema.positive())`.
- **Don't re-implement Effect's control-flow combinators.** Effect ships `Effect.if`, `Effect.when`,
  `Effect.unless`, `Effect.forEach`, `Effect.all` — use them. This package extends Effect's **data**
  surface (`ArrayX`, `RecordX`, `StructX`, …), never its control flow.

## Effect patterns

Conventions for _how_ to write Effect code here. Apply them on every change that touches Effect, not
just net-new files — consistency is what lets the utilities read as one library.

### Match over if/else

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

### Predicates for type checks

Use predicates from Effect modules instead of manual `=== null`, `typeof`, or `.length > 0`:

```ts
import { Predicate, String, Number, Array } from "effect";

if (Predicate.isNotNullable(value)) { ... } // not: value != null
if (Predicate.isString(value)) { ... } //      not: typeof value === "string"
if (String.isNonEmpty(str)) { ... } //         not: str.length > 0
if (Array.isNonEmptyArray(arr)) { ... } //     not: arr.length > 0
if (Number.isFinite(n)) { ... }
```

A compound predicate worth reusing (an `isNonEmptyString` combining `isNotNullable`, `isString`, and
`String.isNonEmpty`) is exactly what `PredicateX` is for — create it the first time a second call
site wants it.

### Dual functions

When a function supports both piped and direct call styles, use `dual` from `effect/Function` (not
`Function.dual()`). Declare the **data-last** (piped) overload first, then **data-first**:

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

Most helpers here that take a "data" argument are `dual` — that's what lets them sit naturally in a
consumer's `pipe` chain _and_ be called directly.

### Data-first vs `pipe`

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

### `Result` over custom discriminated unions

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

### Quick reference

| Instead of                        | Use                                        |
| --------------------------------- | ------------------------------------------ |
| `if/else` chains                  | `Match.value` / `Match.valueTags`          |
| `=== null`                        | `Predicate.isNull`                         |
| `!= null`                         | `Predicate.isNotNullable`                  |
| `typeof x === "string"`           | `Predicate.isString`                       |
| `str.length > 0`                  | `String.isNonEmpty(str)`                   |
| `arr.length > 0`                  | `Array.isNonEmptyArray(arr)`               |
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

## FP mindset

This package _is_ the FP-mindset layer for its consumers: compose logic from generic utilities that
operate on generic data structures, so calling code declares _what_ to do while the utilities handle
_how_ to manipulate the data. Writing those utilities well is the entire job of the repo.

### Spotting reuse opportunities

A `pipe()` chain is a structural declaration: each step names an operation on a named data shape.
Reading chains this way — and applying the same lens to any loop, `reduce`, imperative accumulator,
or complex conditional — is how new utilities are discovered. Before writing inline transformation
logic, ask in order:

1. **Does Effect already cover this?** `Array`, `Option`, `Record`, `Predicate`, `String`, `Number`,
   `Order`, `Result`, `Match`, `Struct`, `Tuple`, `HashMap`, `HashSet`, … are wide and well-tested.
   Check the [Effect docs](https://effect.website/) when unsure.
2. **Does an existing `*X` module already do it?** (See "Check existing utilities first" below.)
3. **Can the logic be a generic utility another call site could reuse?**

If yes to any: use or extract it.

### Extracting from a pipe

When a cluster of 2–3 consecutive steps forms a recognizable transformation, that cluster is a
utility waiting to be named:

1. **Name it in the abstract** — strip the domain nouns; describe what the steps do to the data shape
   ("filter to present items, then group by key").
2. **Check Effect and the `*X` modules** — does an equivalent exist? If so, use it.
3. **If not, extract it** — a generic, `dual`-compatible function in the right `*X` module; replace
   the inline steps with one call; add exhaustive tests.

This is how the utility layer grows: not by upfront design, but by recognizing structure already
present in a pipe and giving it a name. (Not in tension with "don't re-implement Effect's control-flow
combinators" — that bans duplicating Effect's _control flow_; this is about _data-shape_ utilities,
which are the point of the repo.)

### Where utilities live

- **`effect`** (the library) — the first place to look. If `Array.foo` already does it, use it.
- **This package** — the shared home for generic Effect-extension `*X` modules. A helper belongs here
  only if it clears the [What belongs here](#what-belongs-here) bar (generic, pure, no domain
  knowledge).
- A helper used by only one consumer can start local to that consumer and graduate here the moment a
  **second, unrelated** consumer wants it.

### Check existing utilities first

Before writing a new helper, check whether one of the existing modules already covers it: `ArrayX`,
`BigIntX`, `BooleanX`, `DurationX`, `EffectX`, `FormDataX`, `MapX`, `NonNullableX` (+ `nn`),
`NumberX`, `OptionX`, `OrderX`, `PredicateX`, `PromiseX`, `RecordX`, `ResultX`, `SchemaX`, `SetX`,
`StringX`, `StructX`, `These`. The [README Modules table](./README.md#modules) summarizes what each
covers.

### Designing a good utility

1. **Generic type parameters** — operate on `<A>`, not concrete types.
2. **Pure functions** — no side effects, no mutations.
3. **Support `dual`** when the utility takes a pipeable data argument.
4. **Follow the module/barrel pattern** — `FooX/FooX.ts` + `FooX/index.ts` namespace re-export + a
   line in `src/index.ts`.
5. **Exhaustive test coverage** — every public function, every branch, edge cases (empty,
   single-element, boundary), and type-level correctness where the utility's whole point is type
   narrowing. Non-negotiable: these helpers are consumed by every layer above them, they outlive the
   surrounding code, and their tests are the only spec they have.

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
  Order.mapInput(Order.string, (item: Item) => item.path),
);
```

### Key helpers

| Helper                              | Use case                              |
| ----------------------------------- | ------------------------------------- |
| `Order.mapInput(base, extract)`     | Sort objects by a field               |
| `Order.combine(primary, secondary)` | Multi-key sort (two orders)           |
| `Order.combineAll([o1, o2, …])`     | Multi-key sort (more than two orders) |
| `Order.reverse(order)`              | Flip ascending to descending          |
| `Array.sort(array, order)`          | Sort by a single order                |
| `Array.sortBy(o1, o2, …)`           | Sort by multiple orders combined      |

Specialized order helpers — ranking enum-like values (`OrderX.rankedEnum`) or pushing nulls last —
live in `OrderX` / `NonNullableX`. That's this repo's job in miniature: the moment you reach for one
inline, it belongs in a module instead.

## Tests

Exhaustive coverage per public function — every branch, edge cases (empty, single-element,
boundary), and type-level correctness where the helper's whole point is type narrowing. This is
non-negotiable: these utilities are consumed by every layer above them, they outlive the
surrounding code, and they have no domain context to specify them other than their tests. **The
tests are the spec.** Tests use `@effect/vitest`.

## Commits and PRs

- **Conventional Commits**, enforced by commitlint (body lines ≤ 200 chars for bot compatibility).
  Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`, `style`, `ci`, `build`.
  "Visible to a consumer of the library" is the lens for `feat`/`fix`; tooling/CI/deps are `chore`.
- **Atomic commits** — one cohesive change each; the package builds green on every commit.
- On an **unmerged feature branch**, amending / squashing / reordering is standing permission —
  keep the history clean. Update an open PR with `git push --force-with-lease` (never bare
  `--force`). Once a commit reaches `main`, it's history.
- Run `pnpm check-all` before pushing. PR title is itself a Conventional Commit.
- Skills: [`create-commit`](.claude/skills/create-commit), [`verify-commit`](.claude/skills/verify-commit),
  [`push-pr`](.claude/skills/push-pr), [`rebase-main`](.claude/skills/rebase-main).

**Pre-commit hooks (husky + lint-staged).** `pnpm install` runs the `prepare` script (`husky`),
which wires up two git hooks:

- **pre-commit** first regenerates the API docs when non-test `src/**/*.ts` is staged — it runs
  `pnpm docgen` and `git add docs/` so every source change commits up-to-date `docs/` (and a broken
  `@example` blocks the commit, the same gate CI enforces). Then it runs `lint-staged` — ESLint
  `--fix` (with the Prettier integration) on staged JS/TS, and `prettier --write` on staged
  Markdown / YAML / JSON5 / CSS. The `src` guard keeps docs-free commits fast (docgen is a
  whole-project, ~6–7s run).
- **commit-msg** runs `commitlint` against [commitlint.config.ts](./commitlint.config.ts) to enforce
  Conventional Commits.

If a hook blocks a commit, read the output, fix the surfaced issue, re-stage, and commit again —
don't bypass with `--no-verify`. CI re-runs commitlint on PRs as a backstop.

## Versioning & releasing (Changesets)

Single package, standard semver. Pick the bump per this table — cite the rule when running
`pnpm changeset`:

| Change                                                                                   | Bump      |
| ---------------------------------------------------------------------------------------- | --------- |
| Breaking change to a public export, or a widened/raised `effect` peer range              | **major** |
| New public helper, new `*X` module, or other backward-compatible capability              | **minor** |
| Bug fix, docs, internal refactor, or a dep bump with no consumer-visible behavior change | **patch** |

When in doubt, pick the higher one. Flow: `pnpm changeset` → merge to `main` → the **Release**
workflow opens a "Version Packages" PR → merging it publishes to npm with provenance. Never
`npm publish` by hand; the workflow carries the audit trail and provenance. Skill:
[`release-bump`](.claude/skills/release-bump).

## Dependency upgrades (Renovate)

Renovate config is [renovate.json5](./renovate.json5) — it extends the org's shared
`StoryCut/renovate-config:js-lib.json5` preset (which layers `config:js-lib` over the org base
rules). js-lib semantics keep semver ranges in `dependencies` / `peerDependencies` so consumers can
dedupe; safe updates (pins, digests, non-major bumps, devDep majors) auto-merge once CI passes, and
`minimumReleaseAge` queues PRs to dodge the npm unpublish window. The Renovate GitHub App needs read
access to `StoryCut/renovate-config` for the preset to resolve.

## CLAUDE.md ↔ AGENTS.md

`CLAUDE.md` is a symbolic link to this file. If you find yourself editing both, you've broken the
symlink — restore it with `ln -sf AGENTS.md CLAUDE.md` from the repo root.
