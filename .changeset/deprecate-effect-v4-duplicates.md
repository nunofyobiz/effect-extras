---
"@nunofyobiz/effect-extras": minor
---

Deprecated `OptionX.tupleOf` in favour of `Option.product`,
`ArrayX.filterMapNullable` in favour of `Array.flatMapNullishOr`, `ArrayX.categorize`
in favour of `Array.groupBy`, and `EffectX.fromOptionOrElse` in favour of
`Effect.fromOption(option, onNone)`. `fromOptionOrElse` now invokes `onNone` once
while constructing a `None` effect rather than on each execution.
