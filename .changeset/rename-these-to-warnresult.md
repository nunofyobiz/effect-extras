---
"@nunofyobiz/effect-extras": major
---

Rename the `These` module to `WarnResult`, re-theming the inclusive-or data type around the common "a result that may carry a success value and/or warnings" use case. Both sides stay optional, but never both absent.

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
