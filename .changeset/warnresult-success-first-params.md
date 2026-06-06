---
"@nunofyobiz/effect-extras": major
---

**BREAKING:** `WarnResult`'s type parameters are now success-first. `WarnResult<W, A>` (warnings first) becomes `WarnResult<A, W>` (success first), to match Effect's `Result<A, E>`. The same reorder applies to the two-parameter member aliases — `SuccessWithWarnings<A, W>`, `WithWarnings<A, W>`, `WithSuccess<A, W>` — and to the function generic parameters. This is a type-level change only: runtime behavior, the `warnings`/`success` field names, and every constructor are unchanged. The underlying generic `InclusiveOr<L, R>` is intentionally left as-is (it has no success/failure notion — just `left`/`right`).

Migration — swap the type arguments anywhere they're written explicitly:

```ts
// before
const r: WarnResult.WarnResult<MyWarning, MySuccess> = ...
// after
const r: WarnResult.WarnResult<MySuccess, MyWarning> = ...
```

Likewise for `SuccessWithWarnings`, `WithWarnings`, and `WithSuccess`. Call sites that rely on inference (constructors, `match`, `zip`, and the `map`/`flatMap` helpers) need no change.
