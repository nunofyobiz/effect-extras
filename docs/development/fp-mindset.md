# FP mindset

This package _is_ the FP-mindset layer for its consumers: compose logic from generic utilities that
operate on generic data structures, so calling code declares _what_ to do while the utilities handle
_how_ to manipulate the data. Writing those utilities well is the entire job of the repo.

## Spotting reuse opportunities

A `pipe()` chain is a structural declaration: each step names an operation on a named data shape.
Reading chains this way — and applying the same lens to any loop, `reduce`, imperative accumulator,
or complex conditional — is how new utilities are discovered. Before writing inline transformation
logic, ask in order:

1. **Does Effect already cover this?** `Array`, `Option`, `Record`, `Predicate`, `String`, `Number`,
   `Order`, `Result`, `Match`, `Struct`, `Tuple`, `HashMap`, `HashSet`, … are wide and well-tested.
   Consult the current Effect documentation or the installed `node_modules/effect` types when unsure.
2. **Does an existing `*X` module already do it?** (See "Check existing utilities first" below.)
3. **Can the logic be a generic utility another call site could reuse?**

If yes to any: use or extract it.

## Extracting from a pipe

When a cluster of 2–3 consecutive steps forms a recognizable transformation, that cluster is a
utility waiting to be named:

1. **Name it in the abstract** — strip the domain nouns; describe what the steps do to the data shape
   ("filter to present items, then group by key").
2. **Check Effect and the `*X` modules** — does an equivalent exist? If so, use it.
3. **If not, extract it** — one generic data manipulation over type parameters such as `<A>` and
   `<B>` in the module the type calls for. If it takes data plus other arguments, use `dual` with the
   data-last overload first and the data-first overload second. Replace the inline steps with one call
   and add exhaustive tests.

This is how the utility layer grows: not by upfront design, but by recognizing structure already
present in a pipe and giving it a name. (Not in tension with "don't re-implement Effect's control-flow
combinators" — that bans duplicating Effect's _control flow_; this is about _data-shape_ utilities,
which are the point of the repo.)

## Where utilities live

- **`effect`** (the library) — the first place to look. If `Array.foo` already does it, use it.
- **This package** — the shared home for generic extensions: `*X` modules for Effect modules or for
  platform or language types Effect does not cover, and modules named for any data type this package
  owns. A helper belongs here only if it clears the [What belongs here](./what-belongs-here.md) bar.
- A helper used by only one consumer can start local to that consumer and graduate here the moment a
  **second, unrelated** consumer wants it. A call site in a separate, unrelated consuming repository
  counts as that second call site.

## Check existing utilities first

Before writing a new helper, check whether one of the existing modules already covers it: `ArrayX`,
`BigIntX`, `BooleanX`, `DurationX`, `EffectX`, `FormDataX`, `InclusiveOr`, `MapX`,
`NonNullableX` (+ `nn`), `NumberX`, `OptionX`, `OrderX`, `PredicateX`, `PromiseX`, `RecordX`,
`ResultX`, `SchemaX`, `SetX`, `StringX`, `StructX`, `WarnResult`. The
[README Modules table](../../README.md#modules) summarizes what each covers.

## Designing a good utility

1. **Generic type parameters** — operate on `<A>`, `<B>`, and other type parameters, not concrete
   types.
2. **Pure functions** — no side effects, no mutations.
3. **Use plain Effect-aligned names** — reuse Effect's name for the same operation; otherwise use a
   distinct plain name, never functional-programming theory jargon. `OptionX.inspectSome` is an
   observer, not `tap`.
4. **Use `dual` for data plus other arguments** — declare the data-last overload first, then the
   data-first overload.
5. **Follow the module/barrel pattern** — a flat `src/<module>.ts` (+ `src/<module>.test.ts`) + an
   `export * as <module> from "./<module>.js";` line in `src/index.ts`. Choose the module name using
   the [canonical placement rule](./what-belongs-here.md#names-and-modules).
6. **Exhaustive test coverage** — every public function, every branch, edge cases (empty,
   single-element, boundary), and type-level correctness where the utility's whole point is type
   narrowing. Non-negotiable: these helpers are consumed by every layer above them, they outlive the
   surrounding code, and their tests are the only spec they have.
