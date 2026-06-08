# @nunofyobiz/effect-extras

## 3.1.0

### Minor Changes

- [#21](https://github.com/nunofyobiz/effect-extras/pull/21) [`1b2baaa`](https://github.com/nunofyobiz/effect-extras/commit/1b2baaa667cd4da840f2e946c97630ff6e8db127) Thanks [@bigpopakap](https://github.com/bigpopakap)! - Loosen the `effect` peer dependency from the exact pin `4.0.0-beta.74` to the range `^4.0.0-beta.74`.

  Consumers on any later Effect v4 beta (`4.0.0-beta.N`), an `rc`, the stable `4.0.0`, or any `4.x` no longer get a spurious peer-dependency warning — the package is compatible across that window. The range stops below `5.0.0`. CI now boundary-tests both ends of the range: the existing Node 22/24 `typecheck`/`test` jobs exercise the latest version (the pinned, Renovate-updated devDep), and a new `effect-compat` job pins the floor (`4.0.0-beta.74`) and re-runs the type + runtime checks against it.

  This is a backward-compatible loosening (purely additive — more `effect` versions accepted, no consumer breaks), so it is released as a minor rather than the major the peer-range guidance would otherwise suggest, keeping the package on v3.

## 3.0.0

### Major Changes

- [#20](https://github.com/nunofyobiz/effect-extras/pull/20) [`42f5f2d`](https://github.com/nunofyobiz/effect-extras/commit/42f5f2d883c664c3502c03e1c34c99d4cdeb194c) Thanks [@bigpopakap](https://github.com/bigpopakap)! - Move inclusive-or zipping out of `ArrayX` and into the modules that own the data type.

  **BREAKING:** `ArrayX.zipWithWarnings` is removed. `ArrayX` no longer depends on `WarnResult`.

  Replace it with the new `zip` on whichever inclusive-or module you want:
  - `WarnResult.zip(array1, array2, f)` — same behavior as the old `ArrayX.zipWithWarnings` (array1 → `warnings`, array2 → `success`).
  - `InclusiveOr.zip(array1, array2, f)` — the terminology-free version (array1 → `left`, array2 → `right`).

  Both walk to the length of the longer array, passing `f` a `SuccessWithWarnings`/`LeftAndRight` where both arrays have an element, a `WarningsOnly`/`LeftOnly` where only the first does, and a `SuccessOnly`/`RightOnly` where only the second does.

  Both are `dual`, so they also work data-last in a `pipe`: `pipe(array1, WarnResult.zip(array2, f))`.

  ```diff
  -import { ArrayX, WarnResult } from "@nunofyobiz/effect-extras"
  -ArrayX.zipWithWarnings(array1, array2, f)
  +import { WarnResult } from "@nunofyobiz/effect-extras"
  +WarnResult.zip(array1, array2, f)
  ```

- [#17](https://github.com/nunofyobiz/effect-extras/pull/17) [`08cb853`](https://github.com/nunofyobiz/effect-extras/commit/08cb853f8f15e6497fbb5b853541209bc33ee3fb) Thanks [@bigpopakap](https://github.com/bigpopakap)! - **BREAKING:** `WarnResult`'s type parameters are now success-first. `WarnResult<W, A>` (warnings first) becomes `WarnResult<A, W>` (success first), to match Effect's `Result<A, E>`. The same reorder applies to the two-parameter member aliases — `SuccessWithWarnings<A, W>`, `WithWarnings<A, W>`, `WithSuccess<A, W>` — and to the function generic parameters. This is a type-level change only: runtime behavior, the `warnings`/`success` field names, and every constructor are unchanged. The underlying generic `InclusiveOr<L, R>` is intentionally left as-is (it has no success/failure notion — just `left`/`right`).

  Migration — swap the type arguments anywhere they're written explicitly:

  ```ts
  // before
  const r: WarnResult.WarnResult<MyWarning, MySuccess> = ...
  // after
  const r: WarnResult.WarnResult<MySuccess, MyWarning> = ...
  ```

  Likewise for `SuccessWithWarnings`, `WithWarnings`, and `WithSuccess`. Call sites that rely on inference (constructors, `match`, `zip`, and the `map`/`flatMap` helpers) need no change.

### Minor Changes

- [#17](https://github.com/nunofyobiz/effect-extras/pull/17) [`7ffdcb0`](https://github.com/nunofyobiz/effect-extras/commit/7ffdcb096451c969787ee0d024a04bf57710c700) Thanks [@bigpopakap](https://github.com/bigpopakap)! - Add seven generic JSON-tree and line-editing helpers (adopted from a downstream project), each generic, pure, and domain-free:
  - `PredicateX.unsafeIsRecord` — a plain-object guard narrowing `unknown` to `Record<string, unknown>`. It rules out arrays, `null`, `Map`, `Set`, `Date`, `RegExp`, and class instances. "Unsafe" because it asserts the record shape purely from the value's structure, without validating key or value types — reach for `Schema` when you need real guarantees.
  - `RecordX.deepMerge` — recursively deep-merge two JSON values (plain objects merge key-by-key; arrays and primitives are replaced by the second argument). Dual (pipeable).
  - `RecordX.deepMergeReducer` — `deepMerge` as a `Reducer` (monoid) with identity `{}`, so `combineAll` folds N object layers left-to-right.
  - `RecordX.canonicalize` — recursively sort object keys (arrays keep their order) so `JSON.stringify(canonicalize(x))` is a stable structural key.
  - `RecordX.deleteByPath` — immutably delete the value at a path, pruning parent objects left empty, returning `Option`. Dual (pipeable).
  - `StringX.replaceLineRange` / `StringX.insertBeforeLine` — line-range replace/delete and insert-before-line for multi-line strings. Both dual (pipeable).

- [#20](https://github.com/nunofyobiz/effect-extras/pull/20) [`8a09115`](https://github.com/nunofyobiz/effect-extras/commit/8a091154857ecdcf8581c86ea7a8274c84265c0f) Thanks [@bigpopakap](https://github.com/bigpopakap)! - Add the `InclusiveOr<L, R>` module — a generic, terminology-free inclusive-or carrying a `left`, a `right`, or both (`LeftOnly`, `RightOnly`, `LeftAndRight`). It exposes the same surface as `WarnResult` with neutral `left`/`right` naming (`mapBoth`, `mapLeft`/`mapRight`, `flatMapLeft`/`flatMapRight`, `matchLeft`/`matchRight`, `orElse`, the `*Effect` variants, and so on).

  `WarnResult` is now implemented on top of `InclusiveOr`, relabeling `warnings`→`left` and `success`→`right`, so the two modules share all their logic. `WarnResult`'s public API and runtime shape are unchanged.

### Patch Changes

- [#18](https://github.com/nunofyobiz/effect-extras/pull/18) [`b2c6b02`](https://github.com/nunofyobiz/effect-extras/commit/b2c6b024d760099b88adb6c0c1957e4e987fb0e8) Thanks [@bigpopakap](https://github.com/bigpopakap)! - Fix `OptionX.tupleOf` data-last type signature. The curried (pipeable) overload was declared `<A>(a) => <B>(b) => Option<[A, B]>`, which mislabelled which value is piped: at runtime `pipe(Option.some("a"), OptionX.tupleOf(Option.some(1)))` yields `["a", 1]` (the piped value first), but the old type claimed `[1, "a"]`. The signature is now `<B>(b) => <A>(a) => Option<[A, B]>`, so the inferred tuple type matches the runtime result. Runtime behaviour is unchanged.

## 2.1.0

### Minor Changes

- [#16](https://github.com/nunofyobiz/effect-extras/pull/16) [`1ee0ff0`](https://github.com/nunofyobiz/effect-extras/commit/1ee0ff09cf7b17ffe05bae61bcaccd74f43e9743) Thanks [@bigpopakap](https://github.com/bigpopakap)! - feat: per-function tree-shakeable build with subpath exports

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

### Patch Changes

- [#14](https://github.com/nunofyobiz/effect-extras/pull/14) [`96e78e7`](https://github.com/nunofyobiz/effect-extras/commit/96e78e7bb4b4e56b701b31008d2096cccb3e202a) Thanks [@bigpopakap](https://github.com/bigpopakap)! - docs: link the deployed GitHub Pages API reference at the top of the README

## 2.0.0

### Major Changes

- [#6](https://github.com/nunofyobiz/effect-extras/pull/6) [`9c17bf4`](https://github.com/nunofyobiz/effect-extras/commit/9c17bf4d274f9aae01eac2d74db35caaaf094eea) Thanks [@bigpopakap](https://github.com/bigpopakap)! - Rename the `These` module to `WarnResult`, re-theming the inclusive-or data type around the common "a result that may carry a success value and/or warnings" use case. Both sides stay optional, but never both absent.

  **BREAKING:** the `These` namespace is removed entirely, with no aliases. Migrate as below.

  **Type, members, and fields** — `left` → `warnings`, `right` → `success`:

  | Before (`These`)                      | After (`WarnResult`)                                    |
  | ------------------------------------- | ------------------------------------------------------- |
  | `These.These<L, R>`                   | `WarnResult.WarnResult<W, A>`                           |
  | `These.LeftOnly({ left })`            | `WarnResult.WarningsOnly({ warnings })`                 |
  | `These.RightOnly({ right })`          | `WarnResult.SuccessOnly({ success })`                   |
  | `These.LeftAndRight({ left, right })` | `WarnResult.SuccessWithWarnings({ warnings, success })` |
  | `These.WithLeft` / `These.WithRight`  | `WarnResult.WithWarnings` / `WarnResult.WithSuccess`    |

  **Functions** (renamed):
  - `mapLeft` / `mapRight` → `mapWarnings` / `mapSuccess`
  - `flatMapLeft` / `flatMapRight` → `flatMapWarnings` / `flatMapSuccess`
  - `mapLeftEffect` / `mapRightEffect` → `mapWarningsEffect` / `mapSuccessEffect`
  - `flatMapLeftEffect` / `flatMapRightEffect` → `flatMapWarningsEffect` / `flatMapSuccessEffect`
  - `matchLeft` / `matchRight` → `matchWarnings` / `matchSuccess`
  - `leftOption` / `rightOption` → `warningsOption` / `successOption`
  - `leftOrElse` / `rightOrElse` → `warningsOrElse` / `successOrElse`
  - `leftOrUndefined` / `rightOrUndefined` → `warningsOrUndefined` / `successOrUndefined`

  `is`, `match`, `mapBoth`, `mapBothEffect`, `orElse`, `orUndefined`, `fromNullables`, and `optionFromNullables` keep their names — only their `left`/`right` fields (and the `mapLeft`/`mapRight` and `orElseLeft`/`orElseRight` parameters) become `warnings`/`success`.

  **`ArrayX`:** `ArrayX.zipWithThese` is renamed to `ArrayX.zipWithWarnings` (its callback now receives a `WarnResult`).

  Example:

  ```ts
  // Before
  import { These } from "@nunofyobiz/effect-extras";
  const summarize = These.match({
    LeftOnly: ({ left }) => `warn ${left}`,
    RightOnly: ({ right }) => `ok ${right}`,
    LeftAndRight: ({ left, right }) => `ok ${right} (warn ${left})`,
  });

  // After
  import { WarnResult } from "@nunofyobiz/effect-extras";
  const summarize = WarnResult.match({
    WarningsOnly: ({ warnings }) => `warn ${warnings}`,
    SuccessOnly: ({ success }) => `ok ${success}`,
    SuccessWithWarnings: ({ warnings, success }) =>
      `ok ${success} (warn ${warnings})`,
  });
  ```

### Patch Changes

- [#6](https://github.com/nunofyobiz/effect-extras/pull/6) [`6d8027c`](https://github.com/nunofyobiz/effect-extras/commit/6d8027c727db541b0a25fd0d76d420da62b26a83) Thanks [@bigpopakap](https://github.com/bigpopakap)! - docs: add npm version, CI, and license badges to the README, linking the published package on npm.

## 1.0.0

### Major Changes

- [#11](https://github.com/nunofyobiz/effect-extras/pull/11) [`ef0f2b6`](https://github.com/nunofyobiz/effect-extras/commit/ef0f2b670ce491f801853f650b23f858599b9d02) Thanks [@bigpopakap](https://github.com/bigpopakap)! - First stable release. The `*X` module surface (`ArrayX`, `OptionX`, `RecordX`, `StructX`, `These`, …) is now considered stable and versioned under semver.

## 0.0.2

### Patch Changes

- [#8](https://github.com/nunofyobiz/effect-extras/pull/8) [`a7f2838`](https://github.com/nunofyobiz/effect-extras/commit/a7f283824a10851a4c4cc6e93ccf6498e5d216d5) Thanks [@bigpopakap](https://github.com/bigpopakap)! - Releases are now published from CI via npm trusted publishing (OIDC), so every published artifact carries a provenance attestation and no long-lived npm token is used.

## 0.0.1

### Patch Changes

- Initial package contents
