---
name: rebase-main
description: Rebase the current branch onto the latest `origin/main`. Use this skill whenever the user asks to "rebase on/against latest origin/main", "rebase on main", "update this branch", "pull in latest main", "sync with main", "catch up with main", "bring this branch up to date", or any equivalent phrasing about reconciling the current branch with upstream main. Also trigger when finishing a feature and the branch has fallen behind main, or when CI flags a merge conflict that requires rebasing.
---

# Rebasing on latest `origin/main`

Use this end-to-end whenever the user asks to update the current branch against `origin/main`. The
rebase report at the end is non-negotiable — it's how the user decides whether the result is safe to
push.

## Procedure

1. **Commit any work in progress first** so the rebase has a clean tree to operate on.
2. `git fetch origin main` — pull the latest refs without touching your branch.
3. Skim `git log --oneline HEAD..origin/main` and `git log --stat <new-commits>` to see what
   landed. Cross-reference with the files this branch touches — that's where conflicts and silent
   regressions hide.
4. `git rebase origin/main`. Resolve conflicts by hand and `git rebase --continue`. Don't `--skip`
   your own commit; don't `--abort` unless the conflict is truly intractable.
   - **Lockfile conflicts in `pnpm-lock.yaml` resolve themselves.** Resolve the `package.json`
     conflict by hand, then run `pnpm install` from the repo root — pnpm sees the conflict markers
     and rewrites a clean lockfile matching the resolved `package.json`. Don't
     `git checkout --theirs pnpm-lock.yaml` first. Then `git add package.json pnpm-lock.yaml` and
     `git rebase --continue`.
5. **Reapply matching upstream patterns to code we added.** If an upstream commit removed or
   renamed a helper/import, our new code may still use the old form — search the diff and apply the
   same cleanup so we don't reintroduce what was just removed.
6. Re-run the green-check set: `pnpm install && pnpm check-all` (tc → lint → test → build → knip). A
   clean rebase is not the same as a green rebase. If you touched packaging (`exports`, `files`,
   entry points), also run `pnpm publish --dry-run --no-git-checks`.
7. Amend the rebased commit only if your fixes belong to it (conflict resolution, style). Otherwise
   stack a new commit.
8. If the rebase required substantial reworking, **tell the user before pushing** so they can
   re-review.
9. **Always report the rebase status** (below) before pushing or merging.

## Rebase report (required output)

Covers, in order:

- **Conflicts encountered.** Every file that conflicted and one sentence on the kind of conflict
  (overlapping rename, divergent imports, two helpers added to the same module, etc.).
- **How each was resolved.** What you kept from upstream, what from our branch, and any structural
  change beyond a mechanical merge.
- **Major upstream changes that might affect us.** Anything touching code paths we rely on, even if
  it didn't conflict (a renamed `*X` export, a new module, a dep bump). Three sentences max each;
  don't omit anything a reviewer should know.
- **Tests that changed.** Upstream tests we modified (and why); our tests that needed updating.
- **Check results.** `pnpm tc` / `lint` / `test` / `knip` / `build` status, plus the test count if
  it shifted, and `publish --dry-run` if packaging changed.
- **Commit list after the rebase.** `git log --oneline -<N>` covering our new commits + the upstream
  HEAD they sit on.
- **Safety estimate.** One line — low / medium / high confidence that no regression slipped in, with
  one sentence on what would shift it. The user reads this line first.
