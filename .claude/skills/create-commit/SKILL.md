---
name: create-commit
description: Create a well-formed git commit following the project's Conventional Commits convention, commitlint rules, and atomic commit requirements. Use this skill whenever you need to commit code — whether the user asks you to commit, you're finishing a task, or you're preparing changes for a PR. Also trigger when someone asks about commit message format or conventions.
---

# Create Commit

Every commit follows Conventional Commits (validated by commitlint in CI) and is atomic.

## Commit message format

```
<type>(<optional scope>): <description>

[optional body]
```

- **type**: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`, `style`, `ci`, `build`
- **scope**: optional area — a module (`arrayx`, `optionx`, …) or `deps`, `ci`, `release`
- **description**: imperative mood, lowercase, no period at the end
- **body**: optional; lines up to 200 chars (raised from the default 100 for bot commits)

Choose the type from the perspective of a **consumer of the library**:

- `feat` — a new public helper, a new `*X` module, or another capability consumers can use
- `fix` — a bug fix in published behavior
- `refactor` — internal restructuring with no behavior change
- `chore` — tooling, CI, dependency bumps, agent/developer workflow — anything a consumer won't notice
- `docs` / `test` — documentation- or test-only changes

Reserve `feat` and `fix` for consumer-visible changes; tooling/CI/deps are `chore`.

**Examples:**

```
feat(recordx): add upsert
fix(optionx): handle None in renderOrElse
refactor: split These helpers into their own module
chore(deps): bump effect to 4.0.0-beta.75
chore(ci): typecheck and test on node 22 and 24
docs: add util-fit decision flowchart to README
```

## Atomic commits

1. **The package builds green on that commit alone** — run the `verify-commit` skill first.
2. **One cohesive change** — one refactor, one helper, one fix. Don't mix unrelated changes.
3. **A PR may contain multiple commits**, each self-contained.

## Amending and rewriting history on feature branches

Before anything is merged to `main`, **amend / squash / reorder / rewrite freely** to keep history
clean — standing permission, no need to ask. Fair game on an unmerged branch:

- `git commit --amend` to fold a small follow-up (typo, missed file) into the preceding commit.
- `git reset --soft <base>` then re-commit when an exploratory branch reads better as one commit.
- `git push --force-with-lease` to update an open PR after any of the above — never bare `--force`,
  so you don't clobber commits someone else pushed.

Once a commit has reached `main`, it's history — don't rewrite it; further changes are new commits.

## Before committing

Run verification so the commit won't break CI — `pnpm tc`, `pnpm lint`, `pnpm knip`, `pnpm test`
(or `pnpm check-all`). See the `verify-commit` skill.

## Pre-commit hooks

`pnpm install` runs `prepare` (`husky`), which wires up two git hooks:

- **pre-commit** runs `lint-staged` — ESLint `--fix` on staged JS/TS, `prettier --write` on staged
  Markdown / YAML / JSON5 / CSS.
- **commit-msg** runs `commitlint` to validate the Conventional Commits format.

If a hook fails, the commit is rejected and nothing is written — fix the issue, re-stage, and run
`git commit` again (there's nothing to `--amend`, since no commit was created). Don't bypass with
`--no-verify`.
