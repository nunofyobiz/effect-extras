---
"@nunofyobiz/effect-extras": minor
---

Add seven generic JSON-tree and line-editing helpers (adopted from a downstream project), each generic, pure, and domain-free:

- `PredicateX.unsafeIsRecord` — a plain-object guard narrowing `unknown` to `Record<string, unknown>`. It rules out arrays, `null`, `Map`, `Set`, `Date`, `RegExp`, and class instances. "Unsafe" because it asserts the record shape purely from the value's structure, without validating key or value types — reach for `Schema` when you need real guarantees.
- `RecordX.deepMerge` — recursively deep-merge two JSON values (plain objects merge key-by-key; arrays and primitives are replaced by the second argument). Dual (pipeable).
- `RecordX.deepMergeReducer` — `deepMerge` as a `Reducer` (monoid) with identity `{}`, so `combineAll` folds N object layers left-to-right.
- `RecordX.canonicalize` — recursively sort object keys (arrays keep their order) so `JSON.stringify(canonicalize(x))` is a stable structural key.
- `RecordX.deleteByPath` — immutably delete the value at a path, pruning parent objects left empty, returning `Option`. Dual (pipeable).
- `StringX.replaceLineRange` / `StringX.insertBeforeLine` — line-range replace/delete and insert-before-line for multi-line strings. Both dual (pipeable).
