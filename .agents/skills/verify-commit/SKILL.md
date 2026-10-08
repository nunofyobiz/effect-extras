---
name: verify-commit
description: Run the project's CI verification commands to ensure code will pass before committing or pushing. Use this skill before creating a commit, before pushing, when the user asks to "check if things pass", "run checks", "verify", "validate", or "simulate CI". Also trigger after finishing a coding task to confirm nothing is broken, or when someone asks what commands to run before pushing.
---

# Verify Commit

> Provenance: compared against ampm's `ampm-verification` skill, which wins conflicts by default.
> ampm's reportable shape — commands run, outcomes, what was skipped, and the head tested — is already
> what this skill asks for below; its Docker/Postgres/browser-evidence and `ci:final` sections are
> ampm-factory machinery this package has no equivalent of, so they're left out. Because `pnpm
check-all` runs in well under a minute on this small package, every commit runs the full set rather
> than a diff-selected subset — a case where effect-extras's own stricter practice holds rather than
> deferring to the source's change-relevant selection.

Run these to verify code will pass CI before committing or pushing. Run them individually first
(faster iteration), then `pnpm check-all` as a final sanity check. There is no `.env`, database, or
dev server to set up — these are pure checks.

## Individual checks (run these first)

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

Detects unused files, exports, dependencies, and types. If knip flags a newly added export that's
intentionally unused for now, add it to `knip.json` rather than deleting the code.

### 8. API docs

```bash
pnpm docgen
```

`@effect/docgen`: type-checks every JSDoc `@example` and regenerates `docs/` from source. The
pre-commit hook already runs this (and stages `docs/`) when `src/**/*.ts` changes, but run it by hand
after touching JSDoc.

## Full CI simulation (final sanity check)

```bash
pnpm check-all
```

Runs **tc → lint → test → build → publint → treeshake → knip → docgen** in order — the same checks
CI runs. Use it before pushing; prefer the individual checks while iterating.

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
