# .ampm/

This repository customizes ampm's Releasing step with the [release verification
procedure](./steps/deploy.md). It follows the shared Changesets "Version Packages" PR through
publishing and verifies the resulting npm provenance and GitHub release. See [repo
customization](https://github.com/nunofyobiz/ampm/blob/main/docs/public/repo-customization.md) for the
available customizations.

## Agent environment

The default ampm agent environment is defined in
[`.ampm/environment.json`](./environment.json). It runs on the Docker backend and builds
[`.ampm/agent.Dockerfile`](./agent.Dockerfile) with the repository root as its build context. The
`default` profile verifies that `node` and `pnpm` work at startup with a check named `pnpm`.
Both profiles declare a minimum memory floor of 2048 MiB.

The image provides the Node version pinned in [`.nvmrc`](../.nvmrc) and the pnpm version pinned in
[`package.json`](../package.json)'s `packageManager` field. Those files are the sources of truth for
the toolchain versions; the Dockerfile must match them.

### Refining profile

The `refine` profile owns the Refining step and builds
[`.ampm/refine-agent.Dockerfile`](./refine-agent.Dockerfile). It is the default image plus the
Mermaid CLI (`mmdc`), a headless Chrome, the fonts and system libraries Chrome needs, and a small
`mmdc` wrapper that supplies the container sandbox flags, so a plain `mmdc -i a.mmd -o a.png` works.
Agents shaping work use it to render diagrams such as the README's decision tree and judge whether
they read clearly. Only Refining gets it: the operator approved it for diagram review, so no other
step gains a browser. Every other step keeps the default image.

Its checks are the default `pnpm` check plus `mmdc`, which renders a tiny diagram and requires a
real PNG, so it proves the browser launches rather than just that `mmdc --version` runs.

Where versions are pinned:

- Node and pnpm are pinned in both Dockerfiles, and must match `.nvmrc` and `packageManager`.
- `@mermaid-js/mermaid-cli` and `puppeteer` are exact versions in `refine-agent.Dockerfile`. The
  Chrome build follows the Puppeteer pin, so bumping Puppeteer is the only way to change the browser.
- Fonts and libraries are Debian packages and follow bookworm security updates.

Neither Mermaid CLI nor Puppeteer is a dependency of this repository.

### Changing the agent environment

Follow ampm's [How a change reaches your workers](https://github.com/nunofyobiz/ampm/blob/main/docs/public/sandbox-environment.md#how-a-change-reaches-your-workers)
for the authoritative procedure. For updates to this repository's existing environment, merging
`.ampm/environment.json` or a Dockerfile it names does not activate the change. The operator must
approve **Prepare repository environment**. The worker then builds every profile; the previous
images stay in use until every profile passes its checks.

Use **Settings → Repositories → Environment** to inspect the environment revision. A step's brief
lists the checks that passed when its run started: `pnpm` for both profiles, plus `mmdc` for
Refining. Only Refining uses `refine`; every other step uses `default`. To confirm a change took
effect, check that the approval was approved, every profile built successfully, and a later run on
the changed profile shows its checks passing at startup. Correlate that run with the approved
environment revision; check names alone do not identify a revision. The [package-release
checklist](./steps/deploy.md) is not this evidence: an environment-only change has no changeset and
publishes nothing, so the Releasing step treats it as a no-op.

Both profiles use the repository root as their build context. `refine-agent.Dockerfile` copies in
`.ampm/mermaid/puppeteer-config.json`, `.ampm/mermaid/mmdc.sh`, and `.ampm/mermaid/check-mmdc.sh`.
With a root build context, ampm does not notice changes to these copied files alone. When editing
them, change `refine-agent.Dockerfile` or `.ampm/environment.json` in the same commit so ampm detects
the environment change.

Update this README in the same change whenever a profile, phase assignment, check, memory floor,
Dockerfile pin, or installed tool changes. It describes the definition on `main` in the present
tense. Whether that definition is active is checked in ampm, not recorded here.
