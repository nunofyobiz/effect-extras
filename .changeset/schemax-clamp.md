---
"@nunofyobiz/effect-extras": minor
---

Add `SchemaX.clamp`: a combinator that clamps a `number` `Schema`'s value to an inclusive `[min, max]` range, mapping any out-of-range value to the nearest bound on both decode and encode.

Unlike a refinement that _rejects_ out-of-range input, this _coerces_ it — the same technique `SchemaX.nonNegativeBigInt` applies to `bigint`, generalized to an arbitrary numeric range. Both bounds are optional (clamp only the lower side, only the upper side, or both), and passing a `min` greater than `max` throws immediately since no value could ever satisfy that range.
