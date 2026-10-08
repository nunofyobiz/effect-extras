# Versioning and releasing

Single package, standard semver. **Cut the changeset in the same PR as the change that earns it** —
not in a follow-up. The reviewer should see the bump and changelog entry next to the diff, and `main`
should never carry an unreleased consumer-visible change with no pending changeset. Pick the bump per
this table — cite the rule when running `pnpm changeset`:

| Change                                                                                           | Bump      |
| ------------------------------------------------------------------------------------------------ | --------- |
| Breaking change to a public export, or a widened/raised `effect` peer range                      | **major** |
| New public helper, new `*X` module, or other backward-compatible capability                      | **minor** |
| Bug fix, shipped docs, internal refactor, or a dep bump with no consumer-visible behavior change | **patch** |

When in doubt, pick the higher one.

**When a changeset doesn't make sense, say so in the PR.** A changeset _is_ a release, so only a
change that reaches a consumer of the published package warrants one — and the published surface is
the tarball (`files` = `dist` + `src`, plus the README npm ships). Repo-only changes don't qualify:
CI / workflow edits, husky hooks, `AGENTS.md` / `CLAUDE.md` and other contributor docs, editor /
tooling config, and devDep-only lockfile bumps. When you skip a changeset, add a one-line note to the
PR (e.g. "no changeset: CI-only, nothing ships") so the omission reads as deliberate, not forgotten.

Flow: `pnpm changeset` (in the same PR) → merge to `main`. The **Release** workflow
([release.yml](../../.github/workflows/release.yml)) — running under a **GitHub App token**, not
`GITHUB_TOKEN` — then opens a **"Version Packages"** PR that bumps the version and rolls up the
changelog. Because it is App-authored, that PR triggers CI like any other PR; its bump commit is
recreated through the **Git Data API** so it lands **Verified** (a bot cannot hold an SSH key, so it
uses a mechanism separate from local Claude Code commit signing). The workflow attempts to enable
auto-merge as a
convenience, but whoever cuts the release must ensure the shared `changeset-release/main` PR merges
after its required CI is green. ampm's deploy seat does this using the
[release verification checklist](../../.ampm/steps/deploy.md). Its merge re-triggers the workflow,
which publishes to npm via **OIDC trusted publishing** with provenance and no stored token. Do not
publish locally or edit versions by hand; do not report a release complete until that post-merge
workflow succeeds and the exact merged version is visible on npm with provenance and in a matching
non-draft GitHub release. Skill:
[`release-bump`](../../.agents/skills/release-bump/SKILL.md).
