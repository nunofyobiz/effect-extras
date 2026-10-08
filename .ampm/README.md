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
