---
"@nunofyobiz/effect-extras": major
---

Migrate the package from Effect v4 beta to the release candidate and require `effect@^4.0.0-rc.111`.

The package now develops and tests against the synchronized `effect` and `@effect/vitest` RC releases. The peer range accepts RC.111, later release candidates, stable Effect 4, and compatible 4.x releases, while no longer supporting Effect v4 betas. CI boundary-tests the RC floor on Node 22 and 24 in addition to exercising the pinned development version.

Raising the minimum supported Effect version drops previously supported beta releases, so this is a breaking peer-dependency change and a major release.
