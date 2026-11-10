---
"@nunofyobiz/effect-extras": patch
---

Correct the published deprecation notices for `OptionX.tupleOf`, `EffectX.fromOptionOrElse`,
`ArrayX.filterMapNullable`, and `ArrayX.categorize` to name their Effect replacements. Clarify that
since its 4.1.0 deprecation, `fromOptionOrElse` calls `onNone` once when the effect is built from
`None`, rather than on every execution. Runtime behaviour is unchanged.
