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
auto-merge as a best-effort convenience. Otherwise the operator uses the release agent's handoff to
confirm the shared `changeset-release/main` PR's author (`app/effect-extras-release`), base (`main`),
green required CI, and inclusion of the task's changeset, then merges exactly the verified head with
a merge commit. Auto-merge or an earlier handoff may already have merged it; a changed head needs
fresh verification. Its merge re-triggers the workflow, which publishes to npm via **OIDC trusted
publishing** with provenance and no stored token. Do not publish locally or edit versions by hand.

ampm agents have no GitHub access or credentials; all GitHub work goes through the factory. The
[release verification checklist](../../.ampm/steps/deploy.md) uses its git mirror and the npm registry,
and supplies operator handoffs for unavailable GitHub operations. **Interim operator override for
ampm:** a task merge confirmed on `origin/main` counts as `released` and closes the task without
waiting for GitHub-only operations or claiming npm publication. A task with no added changeset
reports `no changeset: nothing publishes`, with no Version Packages handoff or publication claim.

Npm publication requires an identified `chore(release): version packages` merge on `origin/main`
that consumed the task's changeset and credits it in the new `CHANGELOG.md` version section. Read
the exact version from that merge's `package.json`; require `v<version>` on `origin` to resolve to
that merge (peeling annotated tags) and
`npm view @nunofyobiz/effect-extras@<version> version dist.attestations --json` to show that exact
version with `dist.attestations.provenance`. Publication evidence always states that the GitHub
release page and workflow results were not checked; a tag alone proves neither. Incomplete evidence
means publication is not yet verified, while the confirmed task still closes under the override.
Pending version merges receive a head-pinned operator handoff; if no release-branch head is visible,
the operator locates or creates the matching PR and verifies its current head before merging. An
existing version merge with incomplete evidence receives a publication-investigation handoff instead.

Interactive contributor skill:
[`release-bump`](../../.agents/skills/release-bump/SKILL.md).
