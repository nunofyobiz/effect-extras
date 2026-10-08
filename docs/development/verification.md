# Verification

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
4. `pnpm build` — `tsc` + `babel` (ESM, one output file + `.d.ts` per module, with
   `/*#__PURE__*/` annotations — see [Tree-shaking & packaging](./tree-shaking-and-packaging.md))
5. `pnpm publint` — `publint`: validates the published packaging (`exports` map, `types` conditions,
   ESM correctness) against `dist/` (needs a prior `build`)
6. `pnpm treeshake` — `size-limit`: enforces the per-function tree-shaking byte budgets in
   `.size-limit.json` (needs a prior `build`)
7. `pnpm knip` — unused files / exports / deps
8. `pnpm docgen` — `@effect/docgen`: type-checks every JSDoc `@example` (via `tsx`) and regenerates
   the API docs under `docs/` from the source

While iterating, run the individual checks (faster). CI mirrors these as one job per check, plus:
`commitlint` on PR commits, a `renovate-config-validator --strict` job, a `pack --dry-run`
that catches `files` / tarball misconfigurations before a real release (it uses `pnpm pack`, not
`publish --dry-run`: the latter computes a dist-tag against the live registry and errors once the
package is published, since every non-release branch sits at an already-published version), and the
`publint` + `treeshake` jobs above (each builds first, then runs the check). The `docgen` CI job runs
read-only (`contents: read`): it regenerates the docs and then fails on `git diff --exit-code docs/`
if the committed `docs/` drifted — it never writes back or opens PRs. Keeping `docs/` current is the
author's job locally (the pre-commit hook automates it; see [commits and PRs](./commits-and-prs.md)),
so the committed docs that GitHub Pages serves always match the source.

Normal development uses the pinned stable `effect`, `@effect/vitest`, and Vitest toolchain. The
`effect-compat` job (`.github/workflows/ci.yml`) separately installs the **oldest** `effect` and
`@effect/vitest` the peer range promises (`matrix.floor`, currently `4.0.0-rc.111`) with its compatible
Vitest 4 stack, then re-runs `pnpm tc` and `pnpm test` on Node 22 and 24. This proves the floor of the
peer range, not just the stable development versions. Its required-check name deliberately reads
`effect-compat (floor, node …)`, using the fixed label `floor` rather than the version number, so the
check name doesn't change every time the floor moves. When you raise the supported floor, bump
`peerDependencies.effect` in `package.json` **and** `matrix.floor` in the same change — that's a
**major** bump under [versioning and releasing](./versioning-and-releasing.md).
