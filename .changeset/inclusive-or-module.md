---
"@nunofyobiz/effect-extras": minor
---

Add the `InclusiveOr<L, R>` module — a generic, terminology-free inclusive-or carrying a `left`, a `right`, or both (`LeftOnly`, `RightOnly`, `LeftAndRight`). It exposes the same surface as `WarnResult` with neutral `left`/`right` naming (`mapBoth`, `mapLeft`/`mapRight`, `flatMapLeft`/`flatMapRight`, `matchLeft`/`matchRight`, `orElse`, the `*Effect` variants, and so on).

`WarnResult` is now implemented on top of `InclusiveOr`, relabeling `warnings`→`left` and `success`→`right`, so the two modules share all their logic. `WarnResult`'s public API and runtime shape are unchanged.
