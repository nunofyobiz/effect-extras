---
"@nunofyobiz/effect-extras": minor
---

Add `SchemaX.clamp({ min?, max? })` — coerces a `number` `Schema`'s decoded/encoded value to the nearest bound on both decode and encode, instead of rejecting out-of-range input. Both bounds are optional; passing both validates `min <= max`.
