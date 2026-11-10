# Verification

## Forbidden shortcuts when fixing failures

> Provenance: ampm's `docs/development/contributing.md` "Forbidden shortcuts when fixing failures",
> which wins over StoryCut's and effect-clue's own versions of this rule by the default precedence
> (ampm, then StoryCut, then effect-clue). Its worktree-path and no-`git stash` rationale already
> matches this repo's own worktree-discipline rule; restated here for a reviewer landing on this page
> directly.

Fix the cause, not the symptom. Never, to make a red check green:

- an unsafe cast (see [no type assertions](./effect-patterns.md#no-type-assertions));
- delete code to pass a check, unless the task itself is removing verified-dead code;
- stub or no-op a failing path — returning `null`, `undefined`, or `{}` just to make it typecheck or
  stop throwing;
- remove or `.skip` a failing test;
- loosen an assertion or a type to make the test agree with buggy behavior instead of fixing the
  behavior.

If a fix would need any of these, stop and surface it instead of pushing it through.

**A suppression needs a trailing reason.** Never add `// @ts-expect-error` or an ESLint
`eslint-disable` comment without one naming why that exact site cannot conform. `@ts-ignore` is
rejected outright by the strict ESLint config, not just discouraged — always `@ts-expect-error` with a
reason. The one sanctioned, deliberate use of `@ts-expect-error` is a test proving the runtime behavior
for input the types reject — see [Tests](./tests.md#runtime-edge-cases-the-types-reject). That is a
promise you investigated the case, not a workaround for one you didn't.

**Worktree path hygiene.** A tracked file can exist at two absolute paths when a task runs in its own
git worktree: the task worktree and the main checkout. Edit through the cwd-relative path in the task
worktree, never a main-checkout absolute path, or a check runs against the untouched file while your
edit sits unreferenced. After editing, `git status` from the worktree's cwd must show exactly the files
you intended to touch.

**Never `git stash`.** `refs/stash` belongs to the shared repository, not to one worktree: a stash
pushed in one task's tree can be popped by another's, and a pop here can land another task's files in
this tree, read as work you did. Commit your in-progress work to your own branch instead — a commit is
cheap and private, and `git reset --soft HEAD~1` undoes it without leaving a stray ref.

## Node version

Pinned in `.nvmrc` to **24.15.0** for development. The published `engines.node` floor is `>=22`,
and CI typechecks + tests on Node **22 and 24** to keep that promise honest. Don't raise the floor
without an open discussion.

## Verification ritual

Before claiming a task done, run **`pnpm check-all`**. It runs, in order:

1. `pnpm tc` — `tsc --noEmit` (src + tests)
2. `pnpm lint` — ESLint flat config (formatting included via `eslint-plugin-prettier`; no separate
   Prettier step)
3. `pnpm lint:mermaid` — finds every fenced `mermaid` block in tracked Markdown and parses it with
   Mermaid's own parser under a jsdom DOM shim (no browser). A failure prints the file, the line
   where the block starts, and the parser error. It validates **syntax only**: it does not show
   layout or readability, and a diagram that parses can still render badly or misstate the prose.
4. `pnpm test` — Vitest (`@effect/vitest`)
5. `pnpm build` — `tsc` + `babel` (ESM, one output file + `.d.ts` per module, with
   `/*#__PURE__*/` annotations — see [Tree-shaking & packaging](./tree-shaking-and-packaging.md))
6. `pnpm publint` — `publint`: validates the published packaging (`exports` map, `types` conditions,
   ESM correctness) against `dist/` (needs a prior `build`)
7. `pnpm treeshake` — `size-limit`: enforces the per-function tree-shaking byte budgets in
   `.size-limit.json` (needs a prior `build`)
8. `pnpm knip` — unused files / exports / deps
9. `pnpm docgen` — `@effect/docgen`: type-checks every JSDoc `@example` (via `tsx`) and regenerates
   the API docs under `docs/` from the source

For a change that promises no declaration changes apart from JSDoc, also
[compare declaration surfaces](#compare-declaration-surfaces). Do that before `pnpm check-all`
when checking that the comparison itself preserves `dist/`: the full gate intentionally rebuilds it.

## Compare declaration surfaces

Compare against the **merge-base of the branch and `origin/main`**, not main's tip. An empty
comparison means the branch's own changes left the emitted declaration surface stable. It does
**not** prove the output matches a newer `origin/main` tip. When that matters, rebase onto main
first, then compare again. This checks declarations, not runtime behavior.

Run from the current worktree. Each command below is a separate step. Replace placeholders with
the recorded literal values, using absolute paths (quoted if needed); they are not shell
substitutions. The detached baseline is the only worktree this recipe owns. No branch or stash is
created, and neither tree's real `dist/` is used. The commands were verified with TypeScript 6.0.3
and this repository's `tsconfig.build.json`.

### Prepare the baseline

1. If current-tree dependencies are missing, install them before recording the initial state:

   ```sh
   pnpm install --frozen-lockfile
   ```

2. Record the current status output, including an empty result:

   ```sh
   git status --porcelain=v1 --untracked-files=all
   ```

3. Record whether `dist/` exists:

   ```sh
   test -e dist
   ```

   Exit 0 means it exists; exit 1 means it is absent.

4. Resolve and record the printed SHA as `<baseline-sha>`. Use that exact SHA throughout:

   ```sh
   git merge-base HEAD origin/main
   ```

5. Create a scratch root. Confirm the printed path is outside the current worktree and record it
   as `<scratch-root>`. Record `<scratch-root>/baseline` as `<scratch-path>`:

   ```sh
   mktemp -d
   ```

6. If `dist/` existed, save it for the preservation check:

   ```sh
   cp -a dist <scratch-root>/dist-before
   ```

7. Create the detached baseline worktree:

   ```sh
   git worktree add --detach <scratch-path> <baseline-sha>
   ```

8. Install its dependencies against its own lockfile, which may differ from the branch's:

   ```sh
   pnpm --dir <scratch-path> install --frozen-lockfile
   ```

### Emit and compare

Use a **fresh output directory for every emission**, alongside the baseline worktree, outside both
worktrees. Reusing an output directory can leave stale files that hide removed modules. Require
successful compilation before diffing; a partial emission is not evidence of stability.

1. Emit the baseline declarations:

   ```sh
   pnpm --dir <scratch-path> exec tsc -p tsconfig.build.json --emitDeclarationOnly --removeComments --declarationMap false --sourceMap false --outDir <scratch-root>/baseline-dts
   ```

2. Emit the current worktree's declarations:

   ```sh
   pnpm exec tsc -p tsconfig.build.json --emitDeclarationOnly --removeComments --declarationMap false --sourceMap false --outDir <scratch-root>/branch-dts
   ```

   These commands bypass `pnpm build`, whose clean step removes `dist/`. The compiler removes
   comments and JSDoc by construction; no regex filtering is needed. Declaration maps and source
   maps are disabled, so there are no map files or source-map footer differences. Output should
   contain only `.d.ts` files.

3. Compare one module (replace `<Module>`, for example with `BooleanX`):

   ```sh
   diff -u <scratch-root>/baseline-dts/<Module>.d.ts <scratch-root>/branch-dts/<Module>.d.ts
   ```

4. Compare the whole declaration tree, including added or removed modules:

   ```sh
   diff -ru <scratch-root>/baseline-dts <scratch-root>/branch-dts
   ```

For either comparison, exit 0 with no output means stable. Exit 1 reports declaration differences:
treat them as signature changes to fix or explain in the PR. Higher exit codes mean the comparison
failed, not that declarations changed. Dependency or compiler versions can also affect emission;
investigate differences between the two lockfiles when explaining unexpected output.

### Worked examples

Keep `baseline-dts` pristine. These temporary experiments edit only the owned scratch worktree's
`src/BooleanX.ts`; restore after each one.

Change only the JSDoc sentence from “Converts a `boolean` to its binary digit” to “Converts a
boolean into a binary digit”. Re-emit into a fresh directory:

```sh
pnpm --dir <scratch-path> exec tsc -p tsconfig.build.json --emitDeclarationOnly --removeComments --declarationMap false --sourceMap false --outDir <scratch-root>/jsdoc-dts
```

Compare the whole tree:

```sh
diff -ru <scratch-root>/baseline-dts <scratch-root>/jsdoc-dts
```

The verified result is empty output, exit 0, just like the unchanged-tree comparison. Restore:

```sh
pnpm --dir <scratch-path> exec git restore --source <baseline-sha> -- src/BooleanX.ts
```

Now temporarily widen `toBinary`'s explicit return annotation from `0 | 1` to `number`. Emit into
another fresh directory:

```sh
pnpm --dir <scratch-path> exec tsc -p tsconfig.build.json --emitDeclarationOnly --removeComments --declarationMap false --sourceMap false --outDir <scratch-root>/signature-dts
```

Compare the module:

```sh
diff -u <scratch-root>/baseline-dts/BooleanX.d.ts <scratch-root>/signature-dts/BooleanX.d.ts
```

The verified result exits 1; its signature hunk is:

```diff
@@ -1 +1 @@
-export declare const toBinary: (value: boolean) => 0 | 1;
+export declare const toBinary: (value: boolean) => number;
```

Restore the experimental signature before cleanup:

```sh
pnpm --dir <scratch-path> exec git restore --source <baseline-sha> -- src/BooleanX.ts
```

### Verify preservation and clean up

1. Repeat the initial status command and require identical output:

   ```sh
   git status --porcelain=v1 --untracked-files=all
   ```

2. If `dist/` existed, require an empty comparison (exit 0):

   ```sh
   diff -qr <scratch-root>/dist-before dist
   ```

   If it was absent, confirm it remains absent (exit 0):

   ```sh
   test ! -e dist
   ```

3. Inspect the exact recorded scratch worktree. Confirm the experiments are reverted and there are
   no unexpected tracked changes or untracked source files:

   ```sh
   pnpm --dir <scratch-path> exec git status --short --untracked-files=all
   ```

4. Resolve unexpected changes before proceeding. Remove only the recorded worktree, normally:

   ```sh
   git worktree remove <scratch-path>
   ```

   If removal refuses, inspect what blocks it first; do not automatically force removal or discard
   unexpected source work.

5. Confirm the recorded scratch path no longer appears:

   ```sh
   git worktree list
   ```

6. Remove each recorded output directory individually. Run only the commands for directories you
   actually created (the last three are conditional on the examples and the `dist/` snapshot):

   ```sh
   rm -r <scratch-root>/baseline-dts
   ```

   ```sh
   rm -r <scratch-root>/branch-dts
   ```

   ```sh
   rm -r <scratch-root>/jsdoc-dts
   ```

   ```sh
   rm -r <scratch-root>/signature-dts
   ```

   ```sh
   rm -r <scratch-root>/dist-before
   ```

7. Remove the now-empty scratch root:

   ```sh
   rmdir <scratch-root>
   ```

Report the tested HEAD SHA, comparison outputs and exit statuses, preservation checks, and the
final worktree list. Then run the separate repository-wide gate before claiming the task done.

## CI coverage

While iterating, run the individual checks (faster). CI mirrors these as one job per check (including `mermaid` for `pnpm lint:mermaid`), plus:
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
