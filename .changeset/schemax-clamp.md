---
"@nunofyobiz/effect-extras": minor
---

Add `SchemaX.clamp({ min?, max? })`: a combinator that coerces an out-of-range `number` into the nearest bound on both decode and encode, instead of rejecting it.

Mirrors how `SchemaX.nonNegativeBigInt` floors a `bigint` at zero, generalized to either or both bounds of a `number`: `clamp({ min: 0 })` only floors, `clamp({ max: 100 })` only ceils, and `clamp({ min: 0, max: 100 })` constrains to both. Throws synchronously at combinator construction if both bounds are given and `min > max`.
