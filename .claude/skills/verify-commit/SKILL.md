---
name: verify-commit
description: Run the project's CI verification commands to ensure code will pass before committing or pushing. Use this skill before creating a commit, before pushing, when the user asks to "check if things pass", "run checks", "verify", "validate", or "simulate CI". Also trigger after finishing a coding task to confirm nothing is broken, or when someone asks what commands to run before pushing.
---

# Verify Commit

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

`vitest run`. A single file: `pnpm vitest run src/ArrayX/ArrayX.test.ts`.

### 4. Build

```bash
pnpm build
```

`tsc` + `babel` → `dist/` (ESM + `.d.ts`, one file per module). Catches `exports` / entry-point
problems that unit tests miss.

### 5. Dead code / unused deps

```bash
pnpm knip
```

Detects unused files, exports, dependencies, and types. If knip flags a newly added export that's
intentionally unused for now, add it to `knip.json` rather than deleting the code.

## Full CI simulation (final sanity check)

```bash
pnpm check-all
```

Runs **tc → lint → test → build → knip** in order — the same checks CI runs. Use it before pushing;
prefer the individual checks while iterating.

## What CI actually runs (`.github/workflows/ci.yml`)

| Job               | Equivalent command                   | What it checks                           |
| ----------------- | ------------------------------------ | ---------------------------------------- |
| `commits` (PRs)   | `commitlint`                         | Commit messages are Conventional Commits |
| `renovate-config` | `renovate-config-validator --strict` | `renovate.json5` is valid                |
| `typecheck`       | `pnpm tc` (Node 22 and 24)           | Types compile                            |
| `lint`            | `pnpm lint`                          | ESLint + formatting                      |
| `knip`            | `pnpm knip`                          | No unused files / exports / deps         |
| `test`            | `pnpm test` (Node 22 and 24)         | Tests pass                               |
| `build`           | `pnpm build`                         | `tsc` + `babel` build succeeds           |
| `publish-dry-run` | `pnpm publish --dry-run`             | `files` / `exports` are publishable      |

If you touched `renovate.json5`, validate it locally too:

```bash
npx --yes --package renovate -- renovate-config-validator --strict renovate.json5
```
