---
"@nunofyobiz/effect-extras": patch
---

Fix `OptionX.tupleOf` data-last type signature. The curried (pipeable) overload was declared `<A>(a) => <B>(b) => Option<[A, B]>`, which mislabelled which value is piped: at runtime `pipe(Option.some("a"), OptionX.tupleOf(Option.some(1)))` yields `["a", 1]` (the piped value first), but the old type claimed `[1, "a"]`. The signature is now `<B>(b) => <A>(a) => Option<[A, B]>`, so the inferred tuple type matches the runtime result. Runtime behaviour is unchanged.
