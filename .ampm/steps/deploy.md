# Deploy releases

Use this procedure for `@nunofyobiz/effect-extras`. The Release workflow creates one shared
**Version Packages** PR for pending changesets. Merging a task PR does not publish a package.

## Access and completion

Agents receive no GitHub access or credentials. All GitHub reads and changes go through the
credential-owning ampm factory. The release agent has the factory-synced `origin` git mirror, the
task merge commit supplied in its briefing or on the board, and the npm registry.

The factory currently provides no capability for:

- merging a non-task PR pinned to a head commit;
- reading workflow-run status, including a Release run;
- reading PR state or checks, including merge state and required CI;
- reading a GitHub release.

Report an unavailable operation as that named missing factory capability with a precise operator
handoff. Never ask for `gh`, GitHub access, or credentials, call GitHub directly (including its API),
or open GitHub pages or workflow runs. Do not publish locally or edit versions manually.
`npm view` below is an explicitly authorized registry read; package management remains pnpm-only.

**Interim operator override:** once the task merge commit is confirmed on `origin/main`, report
`released` so ampm can close the task, regardless of incomplete publication evidence or unavailable
GitHub operations. Do not wait, report `staged`, or ask the operator for an answer over those
operations. State separately whether npm publication was verified.

## Verify the task and publication evidence

Run commands separately, substituting the supplied task merge and observed version merge/version.

1. Refresh the mirror and confirm the task merge is on main:

   ```sh
   git fetch origin
   git merge-base --is-ancestor <task-merge> origin/main
   ```

   A nonzero ancestry result does not satisfy the interim override. Report the unconfirmed task
   merge and the observed `origin/main`; do not claim it is released.

2. Inspect changeset additions relative to the task merge's first parent:

   ```sh
   git diff --name-status --diff-filter=A <task-merge>^1 <task-merge> -- '.changeset/*.md'
   ```

   If none were added, report `released` with `no changeset: nothing publishes`. Stop here: no
   Version Packages handoff and no publication claim. Otherwise record each changeset's path and
   content from the task merge.

3. Find the shared Version Packages merge that consumed the task's changeset:

   ```sh
   git log --first-parent --merges --format='%H %s' origin/main --grep='chore(release): version packages'
   git diff <version-merge>^1 <version-merge> -- .changeset CHANGELOG.md package.json
   git show <version-merge>:package.json
   ```

   Require the consumed changeset's deletion/content diff and the task's PR, commit, or summary
   credited in that release's newly added `CHANGELOG.md` section. A title match or credit retained
   from an older release is insufficient. Derive the exact version from that merge's `package.json`,
   never the task's expected version. If no matching merge is identifiable, use the merge handoff
   below. Never merge a newer Version Packages PR to finish an already merged release.

4. For an identified version merge, inspect the remote tag and exact npm version:

   ```sh
   git ls-remote origin refs/tags/v<version> 'refs/tags/v<version>^{}'
   npm view @nunofyobiz/effect-extras@<version> version dist.attestations --json
   ```

   Require `v<version>` on `origin` to resolve to that version merge on `origin/main`. For an
   annotated tag compare the peeled `^{}` commit, not the tag object; for a lightweight tag compare
   its direct target. Require npm's exact `version` and `dist.attestations.provenance`.
   Missing, ambiguous, or unavailable evidence means **npm publication not yet verified**. The
   confirmed task still reports `released` under the interim override.

Only the complete combination of the identified version merge, matching remote tag target, and exact
npm version with provenance proves npm publication. Whenever reporting publication, state that the
GitHub release page and workflow results were not checked; a git tag alone proves neither.

## Released report and operator handoff

Record:

- **Task completion:** `released`; task merge and confirmed `origin/main`; interim operator override
  (or `no changeset: nothing publishes`).
- **Npm publication:** verified or not yet verified. If verified, include the version merge, its
  package version and new changelog credit, tag target, and exact npm version with provenance.
  State: `GitHub release page and workflow results were not checked; a git tag alone proves neither.`
- **Operator handoff:** none for no changeset. Otherwise use the applicable handoff below; it does
  not hold up closing the task.

When no Version Packages merge containing the changeset is on `origin/main` (including when the
changeset is on the release branch), read its current head:

```sh
git ls-remote origin refs/heads/changeset-release/main
```

Hand off the task merge, changeset identity, branch `changeset-release/main`, and observed head
commit. Name the missing capabilities for reading PR state/checks and merging a non-task PR pinned
to a head. Ask the operator to confirm author `app/effect-extras-release` (the release GitHub App),
base `main`, required CI green, and this task's changeset in the diff, then merge with a **merge
commit of exactly that verified head**. Auto-merge or an earlier handoff may already have merged it;
confirm current state first. If the head changed, verify the new head before merging.

If the branch is absent, explicitly record **no head observable**. Direct the operator to locate or
create the matching Version Packages PR and verify its current head and all the same conditions
before merging exactly that head with a merge commit.

If the version merge exists but publication evidence is incomplete, hand off investigation of that
merge's Release run and publication, with the merge, exact version, and missing evidence. Name the
missing workflow-run status and GitHub release read capabilities. Do not request merging a newer PR.
