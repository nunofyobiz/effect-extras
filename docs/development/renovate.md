# Dependency upgrades (Renovate)

Renovate config is [renovate.json5](../../renovate.json5) — it extends the org's shared
`nunofyobiz/renovate-config:js-lib.json5` preset (which layers `config:js-lib` over the org base
rules). js-lib semantics keep semver ranges in `dependencies` / `peerDependencies` so consumers can
dedupe; safe updates (pins, digests, non-major bumps, devDep majors) auto-merge once CI passes, and
`minimumReleaseAge` queues PRs to dodge the npm unpublish window. The Renovate GitHub App needs read
access to `nunofyobiz/renovate-config` for the preset to resolve.
