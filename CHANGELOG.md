# @nunofyobiz/effect-extras

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
