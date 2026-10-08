---
name: push-pr
description: Push commits and create or update a GitHub pull request with a well-formed title and description. Use this skill whenever you need to create a PR, push to a PR, update a PR, or the user says "make a PR", "push", "open a PR", "update the PR", etc. Also trigger after committing when the user asked for a PR in the same request.
---

# Push PR

> Provenance: this skill descends from StoryCut's `push-pr` skill. Adopts ampm's "Commits & PRs"
> (`docs/development/contributing.md`) and the `ampm-pr-creation` skill, which win conflicts by
> default: the title is a Conventional Commit for the whole change and never the task's own wording,
> one branch carries one PR, and the body says why the change exists and what a reviewer should
> check. Regenerating the title and body from the full commit set on every push is the behavior
> effect-clue's "PR workflow" section separately asks for; ampm and StoryCut already cover it here.

This skill handles pushing commits and creating or updating a GitHub pull request. Every time
commits are pushed, regenerate the PR title and description from the full set of commits in the PR.

## One branch, one PR

Push the branch you're already checked out on; never create another branch or open a second PR for
the same change. If a PR already exists for this branch, update it — don't open a new one.

## PR title format

The PR title **must be a valid Conventional Commit** describing the whole change — **never the
task's own wording**. A task is named for whoever is reading a board; a PR title becomes the merge
subject in git history.

```
❌ Contributor guidance adopts the best of ampm, StoryCut and effect-clue   (task wording)
✅ docs: adopt sibling-repo guidance and set the testing/docs bar          (Conventional Commit)
```

The PR title is itself a valid Conventional Commit — the same format used for individual commits:

```
<type>(<optional scope>): <description>
```

- **type**: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`, `style`, `ci`, `build`
- **description**: imperative mood, lowercase, no period, under ~70 chars

The title is a **cohesive summary** of the whole PR, not a list of commits. Choose the type from a
**consumer of the library's** perspective: a new public helper/module is `feat`; a published-behavior
bug fix is `fix`; tooling/CI/deps/agent-workflow only is `chore`. If commits are mixed, use the type
of the primary change.

**Examples:**

```
feat(recordx): add upsert and collectBy
fix(optionx): correct None handling in renderOrElse
chore(deps): bump effect to 4.0.0-beta.75
chore: stand up CI, renovate, changesets, and agent docs
```

## PR description format

The body says **why the change exists** and **what a reviewer should check** — not just what
changed.

```markdown
## Summary

<1-3 bullets on why this change exists>

## Test plan

- [ ] <what a reviewer should check — usually: pnpm check-all is green>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

- **Single-commit PRs**: the title matches the commit subject; the body becomes the summary.
- **Multi-commit PRs**: read `git log <base>..HEAD`, write a title capturing overall intent, and
  list the key changes as summary bullets.

## Workflow

### Creating a new PR

1. Check state:
   - `git status` — working tree clean (commit first if not)
   - `git log --oneline <base>..HEAD` — review all commits that will be in the PR
   - `git diff <base>...HEAD --stat` — understand the scope
2. Push: `git push -u origin HEAD`
3. Generate the title + description from the commits, write the body to a file under `.agent-ops/`
   (gitignored), then: `gh pr create --title "<title>" --body-file .agent-ops/pr-body.md`
4. Return the PR URL.

### Updating an existing PR

Whenever new commits are pushed to a branch with an open PR, **regenerate** the title and
description from the full commit set:

1. `git push`
2. `gh pr view --json baseRefName --jq .baseRefName`, then `git log --oneline <base>..HEAD`
3. Write the regenerated body to `.agent-ops/pr-body.md`, then:
   `gh pr edit --title "<new-title>" --body-file .agent-ops/pr-body.md`
4. Return the PR URL.

## Important notes

- Determine the base branch from the PR or repo default — don't assume `main`.
- Write the body to a file under `.agent-ops/` and pass `--body-file`, rather than a HEREDOC for
  `--body` — a HEREDOC prompts for permission on every invocation (see
  [AGENTS.md](../../../AGENTS.md)); `.agent-ops/` is gitignored and already used this way for commit
  bodies (see [Commits and PRs](../../../docs/development/commits-and-prs.md)).
- Never force-push unless the user explicitly asks (and then `--force-with-lease`).
- If the branch has no upstream, use `git push -u origin HEAD`.
- Commits are SSH-signed automatically (see [Commit signing](../../../docs/development/commits-and-prs.md#commit-signing)); pushed commits should show
  GitHub's **Verified** badge. If one doesn't, run `bash scripts/setup-signing.sh`, re-create the
  commit, and `git push --force-with-lease`.
