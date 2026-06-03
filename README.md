# @nunofyobiz/effect-extras

Generic, framework-agnostic extensions of the [Effect](https://effect.website)
standard library. These are the `*X` utility modules — `ArrayX`, `OptionX`,
`RecordX`, `StructX`, and friends — that extend Effect's own modules with
patterns used repeatedly across projects.

```ts
import {
  ArrayX,
  OptionX,
  RecordX,
  StructX,
  nn,
} from "@nunofyobiz/effect-extras";
```

## Install

```sh
pnpm add @nunofyobiz/effect-extras
```

`effect` is a **peer dependency** — your project must already depend on a
compatible version of `effect`.

## Modules

Each module is exported as a namespace from the package root:

| Module         | Extends / purpose                                                          |
| -------------- | -------------------------------------------------------------------------- |
| `ArrayX`       | Array helpers (grouping, ordered insertion, `These`-zip)                   |
| `BigIntX`      | BigInt helpers (`toNumberOrThrow`)                                         |
| `BooleanX`     | Boolean helpers                                                            |
| `DurationX`    | Duration / DateTime diff helpers                                           |
| `EffectX`      | Effect bridges (`flattenOption`, `fromOptionOrElse`, `tryUntil`)           |
| `FormDataX`    | Schema-based `FormData` parsing                                            |
| `MapX`         | Native `Map` helpers                                                       |
| `NonNullableX` | Non-nullable assertions (`fromNullableOrThrow`, exported as `nn`)          |
| `NumberX`      | Number helpers                                                             |
| `OptionX`      | Option helpers and rendering bridges                                       |
| `OrderX`       | `Order` helpers (`rankedEnum`)                                             |
| `PredicateX`   | Compound predicates (`isNonEmptyString`, `matchRefine`)                    |
| `PromiseX`     | Promise helpers                                                            |
| `RecordX`      | Record manipulation (`modifyIfExists`, `upsert`, `collectBy`)              |
| `ResultX`      | `Result` bridges (`fromOption`)                                            |
| `SchemaX`      | Effect Schema extensions (`pick`/`omit`/`partial`, branded strings)        |
| `SetX`         | Native `Set` helpers                                                       |
| `StringX`      | String helpers                                                             |
| `StructX`      | Conditional object-field construction (`defined`, `filterDefined`, `some`) |
| `These`        | `These` data type (both / this / that)                                     |

## Development

```sh
pnpm install
pnpm tc        # typecheck (src + tests)
pnpm lint
pnpm test
pnpm build     # emit dist/ (JS + .d.ts) via tsc
pnpm knip      # unused code / deps
```

## Releasing

This package uses [Changesets](https://github.com/changesets/changesets).

1. Add a changeset describing your change: `pnpm changeset`.
2. Commit it and push/merge to `main`.
3. The **Release** workflow opens a "Version Packages" PR. Merging it publishes
   to npm (with provenance) and creates a GitHub release.

---

## Bootstrapping this as a standalone repo

This package was authored inside another monorepo and is structured to be lifted
out verbatim. To stand it up as its own repo:

**1. Copy and initialise**

```sh
cp -r effect-extras ~/code/effect-extras   # from the monorepo
cd ~/code/effect-extras
rm -rf node_modules dist
pnpm install                               # generates the repo's own pnpm-lock.yaml
git init -b main && git add -A && git commit -m "chore: initial import of effect-extras"
```

**2. Create the GitHub repo and push**

```sh
gh repo create nunofyobiz/effect-extras --public --source=. --remote=origin --push
```

**3. GitHub repo settings**

- **Settings → Actions → General → Workflow permissions:** select **Read and
  write permissions** and tick **Allow GitHub Actions to create and approve pull
  requests** (the Changesets "Version Packages" PR needs this).
- **Settings → Branches:** add a ruleset for `main` requiring the `CI` checks and
  PRs before merge.

**4. npm (publishing + provenance)**

- Make sure the `@nunofyobiz` scope exists on npmjs.com and your account can
  publish to it.
- Create an npm **Automation** access token and add it to the repo as
  **Settings → Secrets and variables → Actions → `NPM_TOKEN`**.
- Provenance is already enabled (`NPM_CONFIG_PROVENANCE`, `id-token: write`, and
  the `repository` field in `package.json`).

**5. First release**

- `pnpm changeset` (choose the bump, e.g. `minor` to go from `0.0.0` → `0.1.0`),
  commit, and push to `main`.
- Merge the auto-opened "Version Packages" PR → it publishes to npm.

**6. Renovate**

- Install the Renovate GitHub App on the repo. `renovate.json5` extends
  `github>StoryCut/renovate-config:js-app.json5`, which must be readable by your
  Renovate install.
