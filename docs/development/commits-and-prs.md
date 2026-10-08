# Commits and PRs

- **Atomic commits** — one cohesive change each; the package builds green on every commit.
- On an **unmerged feature branch**, amending / squashing / reordering is standing permission — keep the history clean. Update an open PR with `git push --force-with-lease` (never bare `--force`). Once a commit reaches `main`, it's history.
- Run `pnpm check-all` before pushing. PR title is itself a Conventional Commit.
- `.agent-ops/` is gitignored — use it for agent scratch files that shouldn't be committed (e.g. a PR body passed to `gh pr create --body-file`).
- Skills: [create-commit](../../.agents/skills/create-commit/SKILL.md), [verify-commit](../../.agents/skills/verify-commit/SKILL.md), [push-pr](../../.agents/skills/push-pr/SKILL.md), and [rebase-main](../../.agents/skills/rebase-main/SKILL.md).

## Pre-commit hooks

`pnpm install` runs the `prepare` script (`husky`), which wires up two git hooks:

- **pre-commit** first regenerates the API docs when non-test `src/**/*.ts` is staged — it runs `pnpm docgen` and `git add docs/` so every source change commits up-to-date `docs/` (and a broken `@example` blocks the commit, the same gate CI enforces). Then it runs `lint-staged` — ESLint `--fix` (with the Prettier integration) on staged JS/TS, and `prettier --write` on staged Markdown / YAML / JSON5 / CSS. The `src` guard keeps docs-free commits fast (docgen is a whole-project, ~6–7s run).
- **commit-msg** runs `commitlint` against [commitlint.config.ts](../../commitlint.config.ts) to enforce Conventional Commits.

If a hook blocks a commit, read the output, fix the surfaced issue, re-stage, and commit again — don't bypass with `--no-verify`. CI re-runs commitlint on PRs as a backstop.

## Commit signing

Local Claude Code commits on `claude/*` or `agent/*` branches can use a distinct `Claude Code
(<contributor>)` identity and SSH signature. This is not a rule for every agent or every branch:
[`scripts/setup-signing.sh`](../../scripts/setup-signing.sh), run by the `SessionStart` hook in
[`.claude/settings.json`](../../.claude/settings.json), only configures those branches and only when the
machine has `~/.gitconfig.claude`.

For an eligible local Claude Code session, the script copies `user.name`, `user.email`,
`user.signingkey`, `gpg.format`, `gpg.ssh.allowedSignersFile`, and `commit.gpgsign=true` from
`~/.gitconfig.claude` into the **worktree** config (via `extensions.worktreeConfig`). That config sits
above local `.git/config`, so it replaces the contributor's usual identity and key in that worktree.
The resulting commits are authored as `Claude Code (<contributor>)` using the contributor's normal
email and signed with the dedicated SSH key; after its public key is registered with GitHub, they show
as **Verified**. No identity or key material is baked into the script. If the file is absent, the
script prints a hint and exits without blocking the session, leaving eligible local commits with the
existing identity and unsigned.

ampm works differently. It uses `task/*` branches and sets `GIT_AUTHOR_NAME`, `GIT_AUTHOR_EMAIL`,
`GIT_COMMITTER_NAME`, and `GIT_COMMITTER_EMAIL` in its environment. Currently that produces commits
whose author and committer are `ampm-agent <agent@ampm.local>` and which have no signature. This is
expected: the script exits before changing `task/*`, and ampm's image has no `~/.gitconfig.claude`.
Adding `task/*` to the script gate would not change this, because Git environment variables take
precedence over the worktree configuration the script writes. Signing ampm commits, if wanted, must
be configured in ampm itself with its own signing key and Git configuration, not in this repository's
script. You can inspect the current main-history behavior with:

```sh
git log --author=ampm-agent --format='%an <%ae> | %cn <%ce> | %G?'
```

On other branch names, including `main` and `feature/*`, the script leaves the existing identity and
signing configuration untouched. Re-running it does not correct an ampm commit. It is idempotent for
eligible local Claude Code worktrees; if one has an unsigned commit, the wrong author, or a
`user.signingkey` error, run `bash scripts/setup-signing.sh` directly.

**One-time local Claude Code machine setup** (per machine, for a new contributor — skip it if your
eligible local commits already show the Claude author + Verified):

1. Generate a passwordless ed25519 signing key:
   ```sh
   ssh-keygen -t ed25519 -f ~/.ssh/git_signing_claude -C "Claude Code (<your-name>)" -N ""
   ```
2. Create `~/.gitconfig.claude` with the agent identity — a distinct name, your **normal** commit
   email, and the key (the script reads every value from here):
   ```ini
   [user]
       name = Claude Code (<your-name>)
       email = <your-normal-commit-email>
       signingkey = ~/.ssh/git_signing_claude.pub
   [gpg]
       format = ssh
   [gpg "ssh"]
       allowedSignersFile = ~/.config/git/allowed_signers
   [commit]
       gpgsign = true
   ```
3. Trust the key locally so `git log --show-signature` verifies agent commits:
   ```sh
   mkdir -p ~/.config/git
   echo "<your-normal-commit-email> namespaces=\"git\" $(cat ~/.ssh/git_signing_claude.pub)" \
     >> ~/.config/git/allowed_signers
   ```
4. Register the public key on GitHub as a **Signing Key** (not an Authentication key — same form, a
   different **Key type** dropdown) at <https://github.com/settings/keys>, using that same commit
   email. This is what produces the Verified badge.
5. Apply it to this worktree (also runs automatically every session — idempotent):
   ```sh
   bash scripts/setup-signing.sh
   ```

For an eligible local Claude Code worktree, verify with `git config --get user.name` (→ `Claude Code
(<your-name>)`),
`git config --get commit.gpgsign` (→ `true`), and `git config --get user.signingkey`
(→ `~/.ssh/git_signing_claude.pub`); the next commit's PR should show the Claude author and
**Verified**.
