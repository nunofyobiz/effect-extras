# Tests

Exhaustive coverage per public function — every branch, edge cases (empty, single-element,
boundary), and type-level correctness where the helper's whole point is type narrowing. This is
non-negotiable: these utilities are consumed by every layer above them, they outlive the surrounding
code, and they have no domain context to specify them other than their tests. **The tests are the
spec.** Tests use `@effect/vitest`.
