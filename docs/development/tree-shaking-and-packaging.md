# Tree-shaking and packaging

The package must stay tree-shakeable down to the **function**: a consumer importing one helper gets
one helper's worth of code, not the module and not the library. This is the **same build Effect
uses**. Four things hold the line — change any and shaking silently coarsens, so the `publint` +
`treeshake` checks gate them:

- **Flat exports, no namespace wrapper in the shipped file.** Each `dist/ArrayX.js` is plain
  `export const … = /*#__PURE__*/ …`. The namespace (`ArrayX.*`) is formed only by `import * as` (the
  root barrel, or a consumer's subpath import). A pre-built namespace **object** (esbuild's
  `__export(NS, { getter, … })`) pins every member and defeats per-function shaking — never reintroduce
  one (e.g. by bundling, or by adding a per-module `index.ts` that the subpath points at).
- **`tsc` compile + `babel annotate-pure-calls`, not a bundler.** `pnpm build` runs `tsc -p
tsconfig.build.json` (emits `dist/ArrayX.js`, `dist/index.js`, `.d.ts`, maps — one file per source,
  specifiers preserved) then `babel dist --plugins annotate-pure-calls`, which stamps `/*#__PURE__*/`
  on every top-level call so a consumer's bundler can drop unused `export const`s. A bundler (tsup/
  esbuild) would re-introduce the `__export` getter objects above — don't switch back.
- **`"sideEffects": false`** in `package.json` — lets bundlers drop the side-effect-free modules.
  Every helper here is pure, so this stays true; never add module-level side effects. (Safe alongside
  the pure annotations: `annotate-pure-calls` only marks the value-producing calls, not the bare
  `export *` statements.)
- **Subpath exports.** `package.json` `exports` maps `"./*"` → `./dist/*.js` (+ matching `types`), so
  `@nunofyobiz/effect-extras/ArrayX` resolves to that one flat module file — `import * as ArrayX` (or
  `import { compactNullable }`) shakes per function regardless of the consumer's bundler. The wildcard
  auto-covers new modules; `"./index": null` blocks the redundant `…/index` path.

Granularity: a **subpath** import (`import * as ArrayX from "…/ArrayX"`) tree-shakes **per function**;
the **root barrel** (`import { ArrayX } from "…"`) shakes unused _modules_ away but keeps a touched
module whole — the same `export * as` trade-off Effect's root re-export makes. Point consumers who
care at the subpath. The validators:

- **`publint`** (`pnpm publint`) lints the packaging config against the built `dist/` — that every
  `exports` target resolves, `types` are present, ESM is well-formed.
- **`size-limit`** (`pnpm treeshake`, config in `.size-limit.json`) enforces byte budgets on representative
  imports (single function, whole module, barrel, whole library), with `effect` externalized
  (`ignore: ["effect", "effect/*"]`) so we measure only this package. The budgets are set so that a
  tree-shaking regression — a single-function import ballooning toward the module or library size —
  trips the limit. Re-measure and bump a limit only for genuine, intended growth; a sudden jump means
  shaking broke, so fix the build, don't raise the budget.
