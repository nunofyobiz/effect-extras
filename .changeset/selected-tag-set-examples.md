---
"@nunofyobiz/effect-extras": patch
---

Improve SetX's shipped documentation with selected-tag examples and unchanged-instance guarantees. Clarify that safelyMutate passes a shallow copy to its callback and returns the callback's exact Set result, which may be another set. This is a patch under the shipped-docs rule; runtime behavior and signatures are unchanged.
