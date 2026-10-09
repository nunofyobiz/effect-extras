---
name: verify-commit
description: Run the project's CI verification commands to ensure code will pass before committing or pushing. Use this skill before creating a commit, before pushing, when the user asks to "check if things pass", "run checks", "verify", "validate", or "simulate CI". Also trigger after finishing a coding task to confirm nothing is broken, or when someone asks what commands to run before pushing.
---

# Verify Commit

> Provenance: adopts ampm's `ampm-verification` skill, which wins conflicts by default. Its
> change-relevant selection — focused checks picked from the diff, rather than the full set on every
> commit — is adopted below, along with its required report shape (commands run, outcomes, what was
> skipped, and the head tested). Its Docker/Postgres/browser-evidence and `ci:final` sections are
> ampm-factory machinery this package has no equivalent of, so they're left out.

Select focused checks from the diff before committing or pushing; run `pnpm check-all` as the
repository-wide gate before claiming a task done. There is no `.env`, database, or dev server to set
up — these are pure checks.

## Individual checks (select the ones the diff touches)

Order matters — fix type errors before linting, since lint can report noise on code that doesn't
compile.

### 1. Typecheck

```bash
pnpm tc
```

`tsc --noEmit` over `src` + tests.

### 2. Lint

```bash
pnpm lint
```

ESLint. Formatting is part of lint (via `eslint-plugin-prettier`) — there is no separate Prettier
step. Auto-fix with `pnpm lint:fix`. Don't disable rules to make checks pass unless explicitly asked.

### 3. Tests

```bash
pnpm test
```

`vitest run`. A single file: `pnpm vitest run src/ArrayX.test.ts`.

### 4. Build

```bash
pnpm build
```

`tsc` + `babel` → `dist/` (ESM + `.d.ts`, one file per module). Catches `exports` / entry-point
problems that unit tests miss.

### 5. Packaging (needs a prior build)

```bash
pnpm publint
```

Validates the published packaging (`exports` map, `types` conditions, ESM correctness) against
`dist/`.

### 6. Tree-shaking budgets (needs a prior build)

```bash
pnpm treeshake
```

`size-limit`: enforces the per-function tree-shaking byte budgets in `.size-limit.json`.

### 7. Dead code / unused deps

```bash
pnpm knip
```

Detects unused files, exports, dependencies, and types. Fix the cause — delete the dead code, or wire
up the missing reference — rather than suppressing the finding in `knip.json`; see
[Forbidden shortcuts](../../../docs/development/verification.md#forbidden-shortcuts-when-fixing-failures).

### 8. API docs

```bash
pnpm docgen
```

`@effect/docgen`: type-checks every JSDoc `@example` and regenerates `docs/` from source. The
pre-commit hook already runs this (and stages `docs/`) when `src/**/*.ts` changes, but run it by hand
after touching JSDoc.

## Full CI simulation (repository-wide gate before claiming a task done)

```bash
pnpm check-all
```

Runs **tc → lint → test → build → publint → treeshake → knip → docgen** in order — the same checks
CI runs. Reserve it for before claiming a task done; while committing or pushing, select the
individual checks the diff touches instead.

## Required report

After running checks, report:

- **Commands run** — which individual checks, or `pnpm check-all`.
- **Outcomes** — pass/fail for each.
- **What was skipped or unavailable** — a check the diff doesn't touch, or one the environment
  couldn't run, and why.
- **The head tested** — the commit SHA the checks ran against.

## What CI actually runs (`.github/workflows/ci.yml`)

| Job               | Equivalent command                           | What it checks                                |
| ----------------- | -------------------------------------------- | --------------------------------------------- |
| `commits` (PRs)   | `commitlint`                                 | Commit messages are Conventional Commits      |
| `renovate-config` | `renovate-config-validator --strict`         | `renovate.json5` is valid                     |
| `typecheck`       | `pnpm tc` (Node 22 and 24)                   | Types compile                                 |
| `lint`            | `pnpm lint`                                  | ESLint + formatting                           |
| `knip`            | `pnpm knip`                                  | No unused files / exports / deps              |
| `test`            | `pnpm test` (Node 22 and 24)                 | Tests pass                                    |
| `effect-compat`   | `pnpm tc` + `pnpm test` (floor effect)       | Oldest `effect` the peer range promises works |
| `build`           | `pnpm build`                                 | `tsc` + `babel` build succeeds                |
| `publint`         | `pnpm build` + `pnpm publint`                | Packaging (`exports`/`types`/ESM) is valid    |
| `treeshake`       | `pnpm build` + `pnpm treeshake`              | Per-function tree-shaking budgets hold        |
| `docgen`          | `pnpm docgen` + `git diff --exit-code docs/` | Committed docs match source                   |
| `publish-dry-run` | `pnpm build` + `pnpm pack --dry-run`         | `files` / tarball are publishable             |

If you touched `renovate.json5`, validate it locally too:

```bash
npx --yes --package renovate -- renovate-config-validator --strict renovate.json5
```
