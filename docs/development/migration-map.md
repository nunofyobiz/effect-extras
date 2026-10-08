# AGENTS.md migration map

This map records the canonical destination of every previous root-guide section and rule. Wording is
unchanged except for link targets, heading levels, and page lead-ins needed to make a page stand alone.
The new prohibition on `git stash` is the only intentional addition.

| Previous section or rule | Canonical home |
| --- | --- |
| `CLAUDE.md` ↔ `AGENTS.md` | [Guidance maintenance](./guidance-maintenance.md) |
| Rewrite the affected section cohesively | [Guidance maintenance](./guidance-maintenance.md) |
| Effect — v4 RC (read first) | [Effect v4](./effect-v4.md) |
| What this repo is | [AGENTS.md](../../AGENTS.md) |
| What belongs here and the prime directive | [What belongs here](./what-belongs-here.md) |
| Package manager and nvm escalation | [AGENTS.md](../../AGENTS.md#package-manager) |
| Permission-prompt posture (command shape) | [AGENTS.md](../../AGENTS.md#permission-prompt-posture) |
| Node version | [Verification](./verification.md#node-version) |
| Verification ritual | [Verification](./verification.md#verification-ritual) |
| What belongs here | [What belongs here](./what-belongs-here.md) |
| The `*X` module + barrel pattern | [`*X` modules and API docs](./modules-and-api-docs.md#the-x-module--barrel-pattern) |
| JSDoc & API docs | [`*X` modules and API docs](./modules-and-api-docs.md#jsdoc--api-docs) |
| Tree-shaking & packaging | [Tree-shaking and packaging](./tree-shaking-and-packaging.md) |
| Effect v4 conventions | [Effect v4](./effect-v4.md#effect-v4-conventions) |
| Effect patterns | [Effect patterns](./effect-patterns.md) |
| Match over if/else | [Effect patterns](./effect-patterns.md#match-over-ifelse) |
| Predicates for type checks | [Effect patterns](./effect-patterns.md#predicates-for-type-checks) |
| Dual functions | [Effect patterns](./effect-patterns.md#dual-functions) |
| Data-first vs `pipe` | [Effect patterns](./effect-patterns.md#data-first-vs-pipe) |
| `Result` over custom discriminated unions | [Effect patterns](./effect-patterns.md#result-over-custom-discriminated-unions) |
| Quick reference | [Effect patterns](./effect-patterns.md#quick-reference) |
| No type assertions | [Effect patterns](./effect-patterns.md#no-type-assertions) |
| FP mindset | [FP mindset](./fp-mindset.md) |
| Spotting reuse opportunities | [FP mindset](./fp-mindset.md#spotting-reuse-opportunities) |
| Extracting from a pipe | [FP mindset](./fp-mindset.md#extracting-from-a-pipe) |
| Where utilities live | [FP mindset](./fp-mindset.md#where-utilities-live) |
| Check existing utilities first | [FP mindset](./fp-mindset.md#check-existing-utilities-first) |
| Designing a good utility | [FP mindset](./fp-mindset.md#designing-a-good-utility) |
| Sort orders | [Effect patterns](./effect-patterns.md#sort-orders) |
| Named orders vs inline | [Effect patterns](./effect-patterns.md#named-orders-vs-inline) |
| Key helpers | [Effect patterns](./effect-patterns.md#key-helpers) |
| Tests | [Tests](./tests.md) |
| Conventional Commits | [AGENTS.md](../../AGENTS.md#verification-and-commits) |
| Atomic commits | [Commits and PRs](./commits-and-prs.md) |
| Amend / force-with-lease permission | [Commits and PRs](./commits-and-prs.md) |
| Check-all before pushing and PR titles | [Commits and PRs](./commits-and-prs.md) |
| `.agent-ops/` | [Commits and PRs](./commits-and-prs.md) |
| Commit, verification, PR, and rebase skills | [Commits and PRs](./commits-and-prs.md) |
| Pre-commit hooks | [Commits and PRs](./commits-and-prs.md#pre-commit-hooks) |
| Commit signing | [Commits and PRs](./commits-and-prs.md#commit-signing) |
| One-time machine setup | [Commits and PRs](./commits-and-prs.md#commit-signing) |
| Versioning & releasing (Changesets) | [Versioning and releasing](./versioning-and-releasing.md) |
| Changeset in the same PR | [Versioning and releasing](./versioning-and-releasing.md) |
| Bump table | [Versioning and releasing](./versioning-and-releasing.md) |
| Skip-a-changeset note | [Versioning and releasing](./versioning-and-releasing.md) |
| Release flow | [Versioning and releasing](./versioning-and-releasing.md) |
| Dependency upgrades (Renovate) | [Renovate](./renovate.md) |
| **New:** never use `git stash` | [AGENTS.md](../../AGENTS.md#verification-and-commits) |
