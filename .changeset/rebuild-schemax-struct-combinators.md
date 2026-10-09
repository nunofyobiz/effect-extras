---
"@nunofyobiz/effect-extras": patch
---

Rebuild `pick`, `omit` and `partial` on Effect v4's typed `Struct` helpers, removing internal `as` casts. `partial` now keeps symbol-keyed fields and makes them optional, matching its declared type — previously it silently dropped them.
