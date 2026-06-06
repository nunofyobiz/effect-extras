---
"@nunofyobiz/effect-extras": minor
---

feat: per-function tree-shakeable build with subpath exports

Each module now ships as a flat ESM file built with `tsc` + Babel's
`annotate-pure-calls` (replacing the single bundle), so every helper is stamped
`/*#__PURE__*/`. Each module is also exposed under a subpath export, and a
subpath import tree-shakes down to the function:

- `import { compactNullable } from "@nunofyobiz/effect-extras/ArrayX"` — ~40 B
- `import * as ArrayX from "@nunofyobiz/effect-extras/ArrayX"` — ~1 kB (whole module)
- vs ~4.4 kB for the full library

The root-barrel import (`import { ArrayX } from "@nunofyobiz/effect-extras"`) is
unchanged. `publint` and `size-limit` now guard packaging and the per-function
budgets in CI.
