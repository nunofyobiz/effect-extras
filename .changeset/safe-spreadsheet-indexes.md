---
"@nunofyobiz/effect-extras": patch
---

Fix `NumberX.indexToExcel` to return `None` for NaN, fractional, infinite, negative, and beyond-safe-range indexes. Passing `Infinity` no longer hangs.
