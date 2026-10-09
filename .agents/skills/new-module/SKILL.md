---
name: new-module
description: Create a new `*X` module (or an owned data type module) in effect-extras — the flat file, its test file, and the one root-barrel line. Use this skill whenever adding a module that doesn't exist yet, or the user says "create a new module", "add a new `*X`", or "where does this new type go".
---

# New module

> Provenance: the procedure shape is adapted from StoryCut's `new-module` skill. StoryCut's own
> version teaches a two-level barrel with a per-module `index.ts` — that breaks this package's
> per-function tree-shaking (see [tree-shaking and packaging](../../../docs/development/tree-shaking-and-packaging.md)),
> so the file layout below is effect-extras's own flat pattern, not StoryCut's.

Before creating a module, confirm the helper belongs here and decide its name using the
[canonical test](../../../docs/development/what-belongs-here.md#names-and-modules): `*X` for an
Effect, platform, or language-type extension; no `X` suffix for a data type this package owns.

## Layout

A module is **one flat file**, never a directory with its own `index.ts`:

```
src/
  MyModule.ts          # implementation: flat `export const …` helpers, no namespace wrapper
  MyModule.test.ts      # colocated tests — see Tests
  index.ts              # root barrel: add one line here
```

1. **`src/MyModule.ts`** — flat `export const` helpers (no `namespace` or class wrapper, so a
   consumer's bundler can tree-shake per function). Use `dual` for any helper taking a data argument
   plus other arguments, data-last overload first. Every export needs the JSDoc bar in
   [`*X` modules and API docs](../../../docs/development/modules-and-api-docs.md): a plain-language
   description, a concrete `@example` that type-checks and asserts, `@since`, and `@category`.
2. **`src/MyModule.test.ts`** — written to the [Tests](../../../docs/development/tests.md) bar: happy
   path and every edge case, a deliberately ill-typed runtime case with a reasoned
   `@ts-expect-error`, and both call styles for every `dual` export.
3. **One line in `src/index.ts`**:
   ```ts
   export * as MyModule from "./MyModule.js";
   ```
   A module with a top-level named export for brevity (like `NonNullableX`'s `nn`) adds a second line:
   ```ts
   export { someHelper as shorthand } from "./MyModule.js";
   ```
   Reserve that for a truly ubiquitous helper where the short name measurably helps — not a default.

No `package.json` or `.size-limit.json` wiring is needed: the subpath export and tree-shaking budget
are wildcard/automatic (see
[tree-shaking and packaging](../../../docs/development/tree-shaking-and-packaging.md)).

Finish with `pnpm check-all`.
