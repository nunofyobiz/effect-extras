---
name: release-bump
description: Cut a release of @nunofyobiz/effect-extras. Reads the diff since the last release, suggests a changeset bump per the rules in AGENTS.md, verifies the CI gates, then walks through `pnpm changeset` / merge / publish. Use when the user says "cut a release", "release vX.Y.Z", "ship it", or "time to publish".
---

# release-bump

Walks through cutting a release of the single published package `@nunofyobiz/effect-extras`. It
assumes the code + doc changes for the release are already committed.

## When to invoke

Use when the user says: "cut a release", "release v0.X.Y", "ship it", "time to publish".

Skip when:

- There are uncommitted changes (`git status` not clean) — ask the user to commit first.
- There are no changesets pending **and** no diff since the last release — nothing to ship.

## Steps

### 1. Verify the baseline

Run in parallel:

```bash
git status --porcelain
git log --oneline $(git describe --tags --abbrev=0 2>/dev/null || echo HEAD~10)..HEAD
ls .changeset/*.md | grep -vE 'README|config'
```

- If `git status` is non-empty → stop, ask the user to commit.
- If there are no commits since the last tag (or `HEAD~10` if no tags) → stop, nothing to ship.
- Note any existing changeset markdowns (a release may already be staged).

### 2. Pick the bump

Read the diff since the last release and suggest a bump per
[AGENTS.md → Versioning & releasing](../../../AGENTS.md):

| Change                                                                      | Bump  |
| --------------------------------------------------------------------------- | ----- |
| Breaking change to a public export, or a widened/raised `effect` peer range | major |
| New public helper, new `*X` module, or other backward-compatible capability | minor |
| Bug fix, docs, internal refactor, dep bump with no consumer-visible change  | patch |

Tell the user the suggestion + the highest-severity reason. They confirm or override. When in
doubt, pick the higher one.

### 3. Run the verification gates

```bash
pnpm check-all
pnpm publish --dry-run --no-git-checks --access public
```

`check-all` is tc → lint → test → build → knip. The dry-run confirms `files` / `exports` produce a
publishable tarball. If anything fails → stop, surface it.

### 4. Write the changeset

```bash
pnpm changeset
```

Select the package, pick the bump from step 2, and draft the summary:

```
<one-sentence headline of what changed>

<bulleted list of consumer-facing changes — what they'll see, not what we did>
```

### 5. Commit the changeset

```bash
git add .changeset/*.md
git commit -m "chore(release): changeset for <summary>"
```

### 6. Push + open a PR (or push to main)

On a branch:

```bash
git push -u origin HEAD
gh pr create --fill
```

Once merged to `main` (or if pushing directly to `main`), the **Release** workflow's
`changesets/action` opens a **"Version Packages"** PR that bumps the version and updates the
changelog. **Merging that PR triggers the actual npm publish** (with provenance). Tell the user
where to watch the workflow.

## What this skill never does

- **Does not run `npm publish` / `pnpm publish` for real.** The Release workflow publishes via the
  `NPM_TOKEN` secret with provenance — a local publish bypasses the audit trail.
- **Does not bump the version by hand.** `changeset version` (run by CI on merge of the Version
  Packages PR) handles that.
- **Does not amend or force-push a shared branch.** If something's wrong, fix forward.

## Failure modes

- `pnpm changeset` errors with "no packages selected" → re-run and select the package.
- `publish --dry-run` complains about missing files → check `files` in `package.json` and that
  `pnpm build` produced `dist/`.
- The Release workflow runs but nothing publishes → confirm the repo has `NPM_TOKEN` set and
  Actions has "Read and write permissions" + "Allow GitHub Actions to create and approve pull
  requests" (see README → Repository setup).
