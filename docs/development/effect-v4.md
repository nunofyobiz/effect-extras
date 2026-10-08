# Effect v4

This repo targets stable **Effect v4**. Use the current
[Effect documentation](https://effect.website), the `effect-docs` MCP, and the
[`effect`](https://github.com/Effect-TS/effect) repository when researching its API.

**Sources of truth, in order:**

1. **`node_modules/effect`** — the installed `.d.ts` types and source are the exact v4 you compile
   against. Unsure about a signature? Read it here first.
2. The [`effect`](https://github.com/Effect-TS/effect) repository and current Effect documentation.
3. This repo's own **`*X` modules** — worked v4 examples that already compile green.

Check `node_modules/effect` whenever the installed version's exact signature matters.

## Effect v4 conventions

This package targets **Effect v4**. Use these current conventions:

- **Construct `Result` values with `Result.succeed` and `Result.fail`.** `Success` and `Failure` are
  types and variant field accessors, not constructors.
- **Schema checks compose with `.check(...)`**: use
  `Schema.Number.check(Schema.isGreaterThan(0))`. Check constructors use the `is*` names, such as
  `isGreaterThan`, `isInt`, and `isBetween`.
- **Don't re-implement Effect's control-flow combinators.** Effect ships `Effect.when`,
  `Effect.forEach`, `Effect.all` (among others) — use them. This package extends Effect's **data**
  surface (`ArrayX`, `RecordX`, `StructX`, …), never its control flow.
