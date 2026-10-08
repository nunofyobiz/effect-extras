# effect-extras — agent guide

`@nunofyobiz/effect-extras` is a single published npm package of generic, framework-agnostic
extensions to the [Effect](https://effect.website) standard library — the `*X` modules (`ArrayX`,
`OptionX`, `RecordX`, `StructX`, …). Other projects depend on it; `effect` is its only peer dependency.
No app, framework, or domain code lives here: everything is pure, generic, and universal. That constraint
is the product — guard it. [What belongs here](./docs/development/what-belongs-here.md) is the prime
directive for every change: before you add, modify, or extract any utility, confirm it belongs. It wins
whenever it conflicts with convenience or anything else written here. If you read nothing else, read it.

`CLAUDE.md` is a symlink to this file. Source of truth.

## Universal rules

### Package manager

**pnpm only.** Never npm, never yarn, never bun. The lockfile is `pnpm-lock.yaml`.

If `pnpm` is not found, escalate in this exact order — do not chain them:

1. Run the command as-is. If it works, stop.
2. Run `nvm use` (reads `.nvmrc`). Try again.
3. Run `source ~/.nvm/nvm.sh && nvm use`. Try again.
4. Only if all three fail, ask the user.

`nvm ls` is a read (allowlisted) for _inspecting_ installed versions — it is **not** a bootstrap
step. Don't probe Node state with it before running pnpm; just follow the escalation above.

Do **not** prepend `cd /path/to/repo` to pnpm commands — pnpm respects the current working
directory, and chaining `cd && pnpm` triggers permission prompts unnecessarily.

### Permission-prompt posture

Most permission prompts are a **command-shape problem, not a missing allowlist entry** — the engine
auto-approves a command only when _every_ part of it is independently safe, so several wrappers defeat
an otherwise-allowlisted command. The allowlist in [`.claude/settings.json`](./.claude/settings.json)
covers the safe reads and routine scripts; you keep prompts low by _how_ you invoke things:

- **Prefer the built-in `Grep` / `Glob` / `Read` tools** over shell `grep` / `git grep` / `find` /
  `cat` / `sed` / `head` and pipelines. They don't go through the Bash permission path, so they never
  prompt — and they're faster. Concretely:
  - `sed -n 'A,Bp' file` / `head -n N file` → `Read` with `offset` / `limit`.
  - `grep … file` / `git grep …` → the `Grep` tool. Scope with `glob` (e.g. `**/*.ts`) and exclude
    tests with a negated glob (`!**/*.test.*`) instead of a `| grep -v` pipe.
  - **Reading or searching N files → one `Grep`/`Read`, never a `for f in …; do grep …; done` loop.**
  - Drop `echo "=== … ==="` section separators and `|| echo "no matches"` fallbacks entirely — the
    native tools label their output and report empty results for free. A stray `echo` is enough to
    force a prompt on an otherwise-allowlisted block.
- **One command per tool call — never `&&` / `;` / `|` / `$(…)` chains or `for`/`while` loops.** A
  compound line is auto-approved only if every segment independently clears, so even an all-allowlisted
  chain (`git add … && git commit … && git log …`) prompts. Run the steps as separate calls. Loops and
  command substitution prompt structurally — that gate is intentional, so reach for the native tools
  above instead of trying to allowlist your way around it.
- **Run project scripts verbatim** — `pnpm test` / `pnpm tc` / `pnpm lint`, with no env-var prefix
  (`TMPDIR=…`), no extra flags, and no `2>&1 | tail` / `2>/dev/null` capture wrapper. Run them bare and
  read the output; the redirect/pipe is itself what prompts.
- **Commit with `-m` (or `-F <file>`), never a heredoc.** `git commit <<'EOF' … EOF` is an input
  redirect and prompts on _every_ commit.
- **Don't `cd` / `git -C <path>` into the worktree you're already in** — an out-of-cwd path triggers a
  prompt. The cwd already _is_ the repo; run `git status`, `pnpm test`, etc. directly.
- **Run git subcommands plain — no `git -c <k>=<v>` or other global-flag prefix.** A flag _before_ the
  subcommand (`git -c core.pager=… log`, `git --no-pager show`, the `git -C <path>` above) sits outside
  the `git <subcmd> *` allowlist pattern, so it prompts even when the subcommand itself is allowlisted.
  The harness output is already plain — you don't need `-c core.pager=cat` / `--no-pager`. Run the bare
  subcommand (`git log`, `git blame`, `git show`).

Consequential actions stay **deliberately gated** (they _should_ prompt): inline code runners
(`node -e`, `tsx -e`, `npx -e`), `gh pr merge`, `gh issue create`, publishes (`changeset publish`,
`npm publish`), and destructive git (`git reset --hard`, `git clean -fd`, bare `git push --force`). To
probe a utility's runtime behavior, write a throwaway test and run it with the allowlisted `pnpm test` /
`pnpm vitest run <file>` instead of an inline `-e` eval. Expanding the allowlist is the smallest lever,
not the first — fix the root cause in scripts or command shape before reaching for it.

### Verification and commits

Run **`pnpm check-all`** before claiming a task done.

**Conventional Commits**, enforced by commitlint (body lines ≤ 200 chars for bot compatibility). Types:
`feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`, `style`, `ci`, or `build`. "Visible to a
consumer of the library" is the lens for `feat`/`fix`; tooling/CI/deps are `chore`.

A changeset belongs in the same PR as every consumer-visible change; if none is needed, say why in the PR.

Never use `git stash`: the stash ref is shared across worktrees; commit work to the task branch before
operations needing a clean tree.

## When the work touches… read…

| Work                              | Read                                                                                                                                                             |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Effect v4 APIs                    | [Effect v4](./docs/development/effect-v4.md)                                                                                                                     |
| Whether a utility belongs         | [What belongs here](./docs/development/what-belongs-here.md) and [FP mindset](./docs/development/fp-mindset.md)                                                  |
| New modules or API documentation  | [`*X` modules and API docs](./docs/development/modules-and-api-docs.md)                                                                                          |
| Package output or import size     | [Tree-shaking and packaging](./docs/development/tree-shaking-and-packaging.md)                                                                                   |
| Effect code, orders, or narrowing | [Effect patterns](./docs/development/effect-patterns.md)                                                                                                         |
| Tests                             | [Tests](./docs/development/tests.md)                                                                                                                             |
| Node, CI, or local checks         | [Verification](./docs/development/verification.md) and [verify-commit](./.agents/skills/verify-commit/SKILL.md)                                                  |
| Creating a commit                 | [Commits and PRs](./docs/development/commits-and-prs.md) and [create-commit](./.agents/skills/create-commit/SKILL.md)                                            |
| Rebasing or opening a PR          | [Commits and PRs](./docs/development/commits-and-prs.md), [rebase-main](./.agents/skills/rebase-main/SKILL.md), and [push-pr](./.agents/skills/push-pr/SKILL.md) |
| Changesets or publishing          | [Versioning and releasing](./docs/development/versioning-and-releasing.md) and [release-bump](./.agents/skills/release-bump/SKILL.md)                            |
| Dependency updates                | [Renovate](./docs/development/renovate.md)                                                                                                                       |
| Guidance or skills                | [Guidance maintenance](./docs/development/guidance-maintenance.md) and [migration map](./docs/development/migration-map.md)                                      |
