# .ampm/

This repository customizes ampm's deploy seat with the [release verification
procedure](./steps/deploy.md). It follows the shared Changesets "Version Packages" PR through
publishing and verifies the resulting npm provenance and GitHub release. See [repo
customization](https://github.com/nunofyobiz/ampm/blob/main/docs/repo-customization.md) for the
available customizations.

## Agent environment

The default ampm agent environment is defined in
[`.ampm/environment.json`](./environment.json). It runs on the Docker backend and builds
[`.ampm/agent.Dockerfile`](./agent.Dockerfile) with the repository root as its build context. The
default profile verifies that `node` and `pnpm` work at startup and declares a minimum memory floor.

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
