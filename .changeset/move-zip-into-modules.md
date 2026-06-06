---
"@nunofyobiz/effect-extras": major
---

Move inclusive-or zipping out of `ArrayX` and into the modules that own the data type.

**BREAKING:** `ArrayX.zipWithWarnings` is removed. `ArrayX` no longer depends on `WarnResult`.

Replace it with the new `zip` on whichever inclusive-or module you want:

- `WarnResult.zip(array1, array2, f)` — same behavior as the old `ArrayX.zipWithWarnings` (array1 → `warnings`, array2 → `success`).
- `InclusiveOr.zip(array1, array2, f)` — the terminology-free version (array1 → `left`, array2 → `right`).

Both walk to the length of the longer array, passing `f` a `SuccessWithWarnings`/`LeftAndRight` where both arrays have an element, a `WarningsOnly`/`LeftOnly` where only the first does, and a `SuccessOnly`/`RightOnly` where only the second does.

Both are `dual`, so they also work data-last in a `pipe`: `pipe(array1, WarnResult.zip(array2, f))`.

```diff
-import { ArrayX, WarnResult } from "@nunofyobiz/effect-extras"
-ArrayX.zipWithWarnings(array1, array2, f)
+import { WarnResult } from "@nunofyobiz/effect-extras"
+WarnResult.zip(array1, array2, f)
```
