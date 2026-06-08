---
"@nunofyobiz/effect-extras": minor
---

Loosen the `effect` peer dependency from the exact pin `4.0.0-beta.74` to the range `^4.0.0-beta.74`.

Consumers on any later Effect v4 beta (`4.0.0-beta.N`), an `rc`, the stable `4.0.0`, or any `4.x` no longer get a spurious peer-dependency warning — the package is compatible across that window. The range stops below `5.0.0`. CI now boundary-tests both ends of the range: the existing Node 22/24 `typecheck`/`test` jobs exercise the latest version (the pinned, Renovate-updated devDep), and a new `effect-compat` job pins the floor (`4.0.0-beta.74`) and re-runs the type + runtime checks against it.

This is a backward-compatible loosening (purely additive — more `effect` versions accepted, no consumer breaks), so it is released as a minor rather than the major the peer-range guidance would otherwise suggest, keeping the package on v3.
