# Adoption candidates

This is the research-only, auditable list of generic helpers found while surveying
effect-extras consumers. Implementation task `tk-8452f601` draws its per-module pieces from
this file and records any later drops here. It is intentionally at the repository root: it is
planning input, not published API documentation or package output.

Nothing in this document ships. There is no changeset for this research artifact.

## Survey basis

The source checkouts were read only. Revisions were read from their corresponding bare origins on
2026-10-08.

| Source                      | Revision surveyed                          | Guidance read                                                                                                       | Production areas swept                                                                                                                                               |
| --------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nunofyobiz/ampm`           | `11eee77740147cb8c9997358d58e645ae5620af7` | `AGENTS.md`; `docs/development/code-conventions.md`                                                                 | `packages/*/src`, `packages/web/lib`, and `packages/ui/src/lib`; named utilities plus `pipe`, `reduce`, loops, accumulators, and map/set construction                |
| `StoryCut/StoryCut`         | `25713095a083820ead9f48e1f7a03aaad1ac4e95` | `AGENTS.md`; `docs/architecture/index.md`; `docs/architecture/effect-patterns.md`; `docs/architecture/data-flow.md` | `lib`, `components/lib`, `domain/**/lib`, `db/**/lib`, and production TypeScript under `app`, `domain`, `db`, and `components`; named utilities plus structural pass |
| `LetsGetIntoIt/effect-clue` | `94bf03205165dc3d00fb0f93e50fd19d40dd614d` | `AGENTS.md`; `src/data/README.md`; `src/server/README.md`                                                           | `src/logic`, `src/data`, `src/server`, `src/ui`, and `src/pwa`; named utilities plus reducers, loops, accumulators, and conditional construction                     |
| `projitect/projitect`       | `c761e01871c24aa3ae18d0fae5334f42d383126c` | `AGENTS.md`                                                                                                         | `packages/*/src`; named utilities plus `pipe`, reducers, map/set construction, and structural pass                                                                   |

Absence checks use the installed **`effect@4.0.2`** only, never the website or an Effect docs
service. This is newer than the plan's `4.0.0-rc.111` reference; the installed package is the
surface this checkout compiles against. Existing-package checks used `src/index.ts` and the
matching `src/*X.ts` module exports.

### Counting and classification

A call site is a production invocation of a named helper or one occurrence of a canonical inline
behavior, identified by its enclosing symbol. Definitions, imports, re-exports, tests, fixtures,
and generated output do not count. Equivalent discoveries were merged before a disposition was
made — including independently hand-rolled inline recurrences of the same shape across repos
(for example, a repo that never calls a shared helper but inlines the identical behavior counts
as an occurrence of that canonical candidate, cited by its enclosing symbol).

A second, systematic pass re-swept every repo for exported and module-local functions with a
leading generic type parameter (`grep -rnE "^(export )?(const|function) [a-zA-Z]+ *(=)? *<[A-Z]"`
over each source's swept directories, excluding tests), to catch named helpers the first,
name-driven pass missed. Every match was read and classified; the large majority are either React
state/DOM primitives, Effect/control-flow plumbing (retry, lease, lock, codec wrappers), or
generic-looking signatures that are still fully monomorphized to one app's own domain shapes once
the type parameter is substituted. Those are noted in aggregate per repo below rather than row by
row, consistent with how each candidate below was individually triaged against the same bar. React
and Next components are out of scope for this survey regardless of genericity (tracked separately
by `tk-d54380f2`); test-only helpers are out of scope per the counting rule above.

Names are deliberately plain: `positions`, `preferredByKey`, `mergeKeyedArrays`, `extractMinBy`,
and `byPriority` describe their result without FP jargon. `tap`, `contramap`, `mapLeft`, and
`mapRight` are not proposed.

## Adopted candidates

### `MapX` — 2 source repositories, 19 call sites

#### `positions`

Build a native `Map` from keys to their zero-based position in an iterable. Later duplicate keys
replace earlier positions, matching `new Map(iterable.map(...))`; it does not mutate the input.

Proposed generic `dual` signature (data-last overload first):

```ts
export const positions: {
  <A, K>(keyOf: (value: A) => K): (self: Iterable<A>) => Map<K, number>;
  <A, K>(self: Iterable<A>, keyOf: (value: A) => K): Map<K, number>;
};
```

- Target: existing `MapX` module.
- effect-extras status: no equivalent export exists in `src/MapX.ts` or `src/index.ts`.
- Effect 4.0.2 absence proof: checked `effect/HashMap` exports `make`, `fromIterable`, `set`,
  `map`, and `reduce`, and `effect/Array` exports `map` and `reduce`; none builds a native
  `Map<K, number>` by positional key. There is no `effect/Map` module.
- Why it belongs: it is a pure, domain-free lookup construction used by unrelated workflow/UI
  ordering code and a separate media application. It packages a repeated index-aware map pattern,
  not a control-flow combinator.

| Repository          | File                                                   | Enclosing/source symbol                   | Occurrences |
| ------------------- | ------------------------------------------------------ | ----------------------------------------- | ----------: |
| `nunofyobiz/ampm`   | `packages/web/lib/branch-choice.ts`                    | `moveAsksBranchChoice`                    |           1 |
| `nunofyobiz/ampm`   | `packages/web/app/(app)/[workspaceId]/inbox-server.ts` | `prefetchedOpenPane`                      |           1 |
| `nunofyobiz/ampm`   | `packages/web/lib/approval-decision.ts`                | `backwardTargets`                         |           1 |
| `nunofyobiz/ampm`   | `packages/web/components/move-actions.tsx`             | `MoveActions` lifecycle comparison        |           1 |
| `nunofyobiz/ampm`   | `packages/web/components/factory.tsx`                  | `Factory` lifecycle comparison            |           1 |
| `nunofyobiz/ampm`   | `packages/web/components/inbox.tsx`                    | `Inbox` lifecycle comparison              |           1 |
| `nunofyobiz/ampm`   | `packages/web/components/roadmap.tsx`                  | `Roadmap` lifecycle comparison            |           1 |
| `nunofyobiz/ampm`   | `packages/web/components/approval-standalone.tsx`      | `ApprovalStandalone` lifecycle comparison |           1 |
| `nunofyobiz/ampm`   | `packages/core/src/domain/FollowUpDedup.ts`            | `deduplicateFollowUps`                    |           1 |
| `nunofyobiz/ampm`   | `packages/core/src/domain/ProposalGrouping.ts`         | proposal ordering                         |           1 |
| `nunofyobiz/ampm`   | `packages/core/src/domain/WorkspaceModel.ts`           | `mergeRows` (its own index-of-id lookup)  |           1 |
| `StoryCut/StoryCut` | `domain/models/Timeline/Timeline.ts`                   | `fuzzyOrderedTimelineTrackIndexes`        |           1 |
| `StoryCut/StoryCut` | `domain/models/Timeline/Timeline.ts`                   | `fuzzyOrderedTimeBucketIndexes`           |           1 |
| `StoryCut/StoryCut` | `lib/FuzzyOrdering/FuzzyOrdering.ts`                   | `order`                                   |           1 |

Usage total: 2 repositories, 13 files, 14 call sites.

#### `preferredByKey`

Keep one value per key from an iterable, where a caller-supplied `isPreferred(candidate,
incumbent)` predicate decides which of two same-keyed values wins. Builds the result as a `Map`
so the winner can be looked up by key directly; does not mutate the input.

Proposed generic `dual` signature (data-last overload first):

```ts
export const preferredByKey: {
  <A, K>(
    keyOf: (value: A) => K,
    isPreferred: (candidate: A, incumbent: A) => boolean,
  ): (self: Iterable<A>) => Map<K, A>;
  <A, K>(
    self: Iterable<A>,
    keyOf: (value: A) => K,
    isPreferred: (candidate: A, incumbent: A) => boolean,
  ): Map<K, A>;
};
```

- Target: existing `MapX` module, alongside `positions`.
- effect-extras status: no equivalent export exists in `src/MapX.ts` or `src/index.ts`.
- Effect 4.0.2 absence proof: checked `effect/Array` exports `dedupeWith`, `dedupeAdjacentWith`,
  `groupBy`, and `reduce`, and `effect/HashMap`'s `set`/`modify`; `dedupeWith` compares the whole
  array under one `Equivalence` and keeps first occurrence, it does not pick a winner per key via
  a preference predicate, and nothing else folds an iterable into "one best value per key."
- Why it belongs: this exact shape is written independently at least three times inside one
  repository (see below), which is strong evidence it is a missing generic primitive rather than
  a one-off. It carries no row or workspace vocabulary once the key and preference functions are
  supplied by the caller.

| Repository        | File                                       | Enclosing/source symbol                                                    | Occurrences |
| ----------------- | ------------------------------------------ | -------------------------------------------------------------------------- | ----------: |
| `nunofyobiz/ampm` | `packages/core/src/store/StorePostgres.ts` | `passRecordsFor`                                                           |           1 |
| `nunofyobiz/ampm` | `packages/core/src/store/StorePostgres.ts` | `passRecordsForWorkspaces`                                                 |           1 |
| `nunofyobiz/ampm` | `packages/core/src/store/StorePostgres.ts` | `passScheduleStatesForWorkspaces`                                          |           1 |
| `nunofyobiz/ampm` | `packages/core/src/store/Store.ts`         | `newestPerSubjectOf` (inline reimplementation, hardcoded to `Run` fields)  |           1 |
| `nunofyobiz/ampm` | `packages/core/src/store/Store.ts`         | `newestRunIdByItemOf` (inline reimplementation, hardcoded to `Run` fields) |           1 |

Usage total: 1 repository, 2 files, 5 call sites (3 via the named `collapseByRecency` helper, 2 as
independent inline recurrences of the identical shape). `packages/core/src/domain/WorkspaceModel.ts`
(`rowRecordReducer`/`newerRow`) is a fourth, related instance — the pairwise "keep the newer of two
same-keyed values" case this candidate's `isPreferred` callback generalizes — noted here as further
corroboration rather than counted again, since it folds two already-keyed maps rather than an
iterable.

### `ArrayX` — 2 source repositories, 8 call sites

#### `connectedComponentsBy`

Group entries into connected components by shared member ids: two entries join the same
component when they name a member in common, directly or transitively through a chain of other
entries. Component order follows first appearance; entries keep their encounter order within a
component.

Proposed generic `dual` signature (data-last overload first):

```ts
export const connectedComponentsBy: {
  <A>(memberIdsOf: (entry: A) => Iterable<string>): (
    entries: readonly A[],
  ) => ReadonlyArray<{
    readonly entries: ReadonlyArray<A>;
    readonly memberIds: ReadonlySet<string>;
  }>;
  <A>(
    entries: readonly A[],
    memberIdsOf: (entry: A) => Iterable<string>,
  ): ReadonlyArray<{
    readonly entries: ReadonlyArray<A>;
    readonly memberIds: ReadonlySet<string>;
  }>;
};
```

- Target: existing `ArrayX` module.
- effect-extras status: no equivalent export exists in `src/ArrayX.ts` or `src/index.ts`.
- Effect 4.0.2 absence proof: checked `effect/Array` exports `groupBy`, `groupWith`, and
  `partition`; all three group by a single computed key or a fixed predicate, none folds entries
  that share membership in an open-ended, transitively-growing set. There is no graph or
  union-find module in `effect`.
- Why it belongs: 3 production call sites across 2 files in one repository, all unrelated
  reconciliation problems (proposal grouping, follow-up dedup, workflow cluster collapse) that
  the source's own module doc describes as "the same shape of problem" each would otherwise
  reimplement — it carries no approval, item, or workflow vocabulary once `memberIdsOf` is
  supplied by the caller.

| Repository        | File                                           | Enclosing/source symbol | Occurrences |
| ----------------- | ---------------------------------------------- | ----------------------- | ----------: |
| `nunofyobiz/ampm` | `packages/core/src/domain/ProposalGrouping.ts` | `suggestionsAmong`      |           1 |
| `nunofyobiz/ampm` | `packages/core/src/domain/ProposalGrouping.ts` | `groupProposals`        |           1 |
| `nunofyobiz/ampm` | `packages/workflows/src/DedupCluster.ts`       | `collapseDedupClusters` |           1 |

Usage total: 1 repository, 2 files, 3 call sites.

#### `mergeKeyedArrays`

Merge an iterable of updates into an existing array by key: a value already present keeps its
position and is replaced only when the caller's preference predicate picks the incoming value
over the existing one; a value whose key is new is appended in incoming order. Returns the
original `existing` reference, unchanged, when nothing in the result actually changed, so a
memoized selector over the result is stable.

Proposed generic `dual` signature (data-last overload first):

```ts
export const mergeKeyedArrays: {
  <A, K>(
    incoming: Iterable<A>,
    keyOf: (value: A) => K,
    isPreferred: (candidate: A, incumbent: A) => boolean,
  ): (existing: readonly A[]) => readonly A[];
  <A, K>(
    existing: readonly A[],
    incoming: Iterable<A>,
    keyOf: (value: A) => K,
    isPreferred: (candidate: A, incumbent: A) => boolean,
  ): readonly A[];
};
```

- Target: existing `ArrayX` module.
- effect-extras status: no equivalent export exists in `src/ArrayX.ts` or `src/index.ts`.
- Effect 4.0.2 absence proof: checked `effect/Array` exports `union`, `unionWith`, `differenceWith`,
  and `dedupeWith`; none preserves existing order and referential identity while reconciling a
  second, incoming keyed collection — `unionWith` concatenates and dedupes but does not
  conditionally replace in place or return the original reference unchanged.
- Why it belongs: a single repository, but 4 distinct production call sites across 3 files, all
  implementing an optimistic-update/local-cache reconciliation pattern that is not specific to any
  product noun once `Row` is replaced with `<A>` — any client holding a locally-cached list merged
  against server deltas needs exactly this.

| Repository        | File                                        | Enclosing/source symbol   | Occurrences |
| ----------------- | ------------------------------------------- | ------------------------- | ----------: |
| `nunofyobiz/ampm` | `packages/web/lib/workspace-model.ts`       | `mergeTaskRowsIntoCaches` |           2 |
| `nunofyobiz/ampm` | `packages/web/lib/optimistic-resolution.ts` | `snapshotWithServerRows`  |           1 |
| `nunofyobiz/ampm` | `packages/web/lib/optimistic-task.ts`       | `reconcileCreatedTasks`   |           1 |

Usage total: 1 repository, 3 files, 4 call sites.

#### `extractMinBy`

Sort a collection by a given order, then remove and return the first element matching a
predicate, leaving the rest in sorted order. Returns `None` (and the fully sorted input
unchanged) when nothing matches.

Proposed generic `dual` signature (data-last overload first):

```ts
export const extractMinBy: {
  <A>(
    where: Predicate.Predicate<A>,
    order: Order.Order<A>,
  ): (self: readonly A[]) => { extracted: Option.Option<A>; remaining: A[] };
  <A>(
    self: readonly A[],
    where: Predicate.Predicate<A>,
    order: Order.Order<A>,
  ): { extracted: Option.Option<A>; remaining: A[] };
};
```

- Target: existing `ArrayX` module, as the "remove the extreme matching element" sibling of
  `maxOption`.
- effect-extras status: no equivalent export exists in `src/ArrayX.ts` or `src/index.ts`.
- Effect 4.0.2 absence proof: checked `effect/Array` exports `min`, `max`, `remove`, and
  `findFirst`; `min`/`max` require a non-empty array and only read the extreme value, they do not
  remove it, and nothing combines "find the first sorted match" with "return the remainder."
- Single-use justification: a sole call site, but a clean generalization of a priority-queue-style
  "take the best candidate out of a working set" operation — a shape that recurs anywhere a
  greedy algorithm consumes its best-remaining option, independent of this call site's track
  layout domain.

| Repository          | File                     | Enclosing/source symbol | Occurrences |
| ------------------- | ------------------------ | ----------------------- | ----------: |
| `StoryCut/StoryCut` | `lib/timelineDiagram.ts` | `processStartEvent`     |           1 |

Usage total: 1 repository, 1 file, 1 call site.

### `OrderX` — 2 source repositories, 6 call sites

#### `byPriority`

Build an `Order` from a priority list: values present in the list sort by their position in it;
values absent from the list all sort after every listed value and compare equal to each other
under a caller-supplied fallback `Order` (so a stable sort preserves their relative input order
when the fallback also treats them as equal).

Proposed generic signature (a pure `Order` constructor, like the existing `rankedEnum` — not
`dual`, since it takes no data argument):

```ts
export const byPriority = <A, K>(
  priority: Iterable<K>,
  keyOf: (value: A) => K,
  otherwise: Order.Order<A>,
): Order.Order<A> => {
  /* ... */
};
```

- Target: existing `OrderX` module.
- effect-extras status: no equivalent export exists in `src/OrderX.ts` or `src/index.ts`. The
  nearest existing export is `OrderX.rankedEnum`, which is a different shape: it requires an
  exhaustive rank table for a closed `PropertyKey` union, whereas `byPriority` works over an open
  or partial priority list of any `A` and supplies an explicit fallback for ties and absences.
- Effect 4.0.2 absence proof: checked `effect/Order` exports `make`, `mapInput`, `combine`,
  `combineAll`, `max`, and `min`; none derives an order from a priority iterable with an
  unlisted-values-last rule in one call — the closest manual composition still needs a
  hand-written "index lookup or Infinity" comparator, which is exactly what `byPriority` packages.
- Why it belongs: StoryCut's own `FuzzyOrdering.orderOf` is this exact constructor, already
  extracted into its own module; five further ampm files independently hand-roll the identical
  behavior (build a position map from a priority list, then compare two values by looking both up
  in it, falling back when either is missing) without sharing a helper. Two repositories
  converging on the same shape, one of them twice, is the strongest cross-repo signal in this
  survey.

| Repository          | File                                              | Enclosing/source symbol                                                | Occurrences |
| ------------------- | ------------------------------------------------- | ---------------------------------------------------------------------- | ----------: |
| `StoryCut/StoryCut` | `domain/models/Timeline/Timeline.ts`              | `fuzzyOrderTimelineElements` (via `FuzzyOrdering.orderOf`)             |           1 |
| `nunofyobiz/ampm`   | `packages/web/components/move-actions.tsx`        | `MoveActions` lifecycle comparison (inline priority-list order)        |           1 |
| `nunofyobiz/ampm`   | `packages/web/components/factory.tsx`             | `Factory` lifecycle comparison (inline priority-list order)            |           1 |
| `nunofyobiz/ampm`   | `packages/web/components/inbox.tsx`               | `Inbox` lifecycle comparison (inline priority-list order)              |           1 |
| `nunofyobiz/ampm`   | `packages/web/components/roadmap.tsx`             | `Roadmap` lifecycle comparison (inline priority-list order)            |           1 |
| `nunofyobiz/ampm`   | `packages/web/components/approval-standalone.tsx` | `ApprovalStandalone` lifecycle comparison (inline priority-list order) |           1 |

Usage total: 2 repositories, 6 files, 6 call sites. The ampm rows above are the same five files
counted under `MapX.positions`: there, they are cited for building the position map; here, for
independently using that map to compare and order two values — the behavior `byPriority` would
replace in one call.

Module ordering note: all three adopted modules above span 2 source repositories each, so the
tie-break is total call sites (`MapX` 19, then `ArrayX` 8, then `OrderX` 6); a module-name
alphabetical order is the final, deterministic tie-break this survey did not need.

## Rejected candidates

Every row below has exactly one final reason. A row that is already supplied by this package is
kept here rather than represented as a new adoption.

| Candidate and abstract behavior                                                                                                                                                                                               | Usage evidence (repositories / files / call sites; each occurrence)                                                                                                                                                                                                                                                                       | Reason                                                                                                                                       |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Group values by a key into a record (`categorize`)                                                                                                                                                                            | `StoryCut/StoryCut`: `components/pages/ProjectHomePage.tsx` `ProjectHomePage` (1); `domain/repositories/virtual/RecordingAssetClipRepository/RecordingAssetClipRepository.ts` `pairRecordingAssetsAndClips` (2). 1 repo / 2 files / 3 calls.                                                                                              | already in Effect (`Array.groupBy`)                                                                                                          |
| Transform values while dropping absent results (`filterMapNullable`)                                                                                                                                                          | `StoryCut/StoryCut`: `components/lib/KeyHandler.tsx` `KeyHandler` (1). 1 repo / 1 file / 1 call.                                                                                                                                                                                                                                          | already in Effect (`Array.flatMapNullishOr`)                                                                                                 |
| Build labelled runs of adjacent values (`chunkBy`)                                                                                                                                                                            | `StoryCut/StoryCut`: `components/recordings/RecordingRollingClipsMiniTimeline.tsx` `groupByStoryBlock` (1). 1 repo / 1 file / 1 call.                                                                                                                                                                                                     | already in effect-extras (`ArrayX.chunkBy`)                                                                                                  |
| Find the first nested-array value with both coordinates (`findFirstWithIndex2d`)                                                                                                                                              | `StoryCut/StoryCut`: `components/spreadsheet/SpreadsheetCellNavigator.ts` `moveRightFrom`, `moveToRightEndFrom`, `moveLeftFrom`, `moveToLeftEndFrom`, `moveUpFrom`, `moveToTopEndFrom`, `moveDownFrom`, and `moveToBottomEndFrom` (8). 1 repo / 1 file / 8 calls.                                                                         | already in effect-extras (`ArrayX.findFirstWithIndex2d`)                                                                                     |
| Render or construct a nullable value from an `Option` (`mapSomeOrNull` / `mapSomeOrUndefined`)                                                                                                                                | `StoryCut/StoryCut`: 13 files, 19 calls (unchanged from the prior survey pass).                                                                                                                                                                                                                                                           | already in effect-extras (`OptionX.mapSomeOrNull` / `OptionX.mapSomeOrUndefined`)                                                            |
| Conditionally construct selected object fields (`pickSome`)                                                                                                                                                                   | `StoryCut/StoryCut`: `app/api/v1/projects/[projectId]/route.ts` `PATCH` action (5); `app/api/v1/projects/[projectId]/recordingAssets/[recordingAssetId]/route.ts` `PATCH` action (5). 1 repo / 2 files / 10 calls.                                                                                                                        | already in effect-extras (`StructX.pickSome`)                                                                                                |
| Insert or move one unique value before another (`upsertUniqBefore`)                                                                                                                                                           | `StoryCut/StoryCut`: `domain/repositories/virtual/TimelineDataRepository/TimelineDataRepository.ts` track and element mutation paths, via `FuzzyOrdering.upsertUniqBefore` (2); `lib/FuzzyOrdering/FuzzyOrdering.ts`'s own `upsertUniqBefore` calls `ArrayX.insertUniq` directly (1), confirming the mapping. 1 repo / 2 files / 3 calls. | already in effect-extras (`ArrayX.insertUniq`)                                                                                               |
| Merge JSON-like values recursively and canonicalize object keys                                                                                                                                                               | `projitect/projitect`: `packages/cli-internals/src/applier.ts` `nextMerge` (1); `packages/cli-internals/src/differ.ts` `nextMerge` (1) and `canonicalJson` (1, already composed directly from `RecordX.canonicalize`); `packages/cli-internals/src/plan.ts` merge planning (1). 1 repo / 3 files / 4 calls.                               | already in effect-extras (`RecordX.deepMerge` / `RecordX.canonicalize`)                                                                      |
| Group all values by a computed key                                                                                                                                                                                            | `projitect/projitect`: `packages/cli-internals/src/plan.ts` `groupByBlueprint`, path conflict grouping, and owner grouping (3); `nunofyobiz/ampm`: `packages/workflows/src/phases/SessionPrune.ts` run grouping (3). 2 repos / 2 files / 6 calls.                                                                                         | already in Effect (`Array.groupBy`)                                                                                                          |
| Keep the last N of an ascending list, or all of it if unlimited (`newestWithin`)                                                                                                                                              | `nunofyobiz/ampm`: `packages/core/src/store/Store.ts` `listRuns`, `listTurns` (2). 1 repo / 1 file / 2 calls.                                                                                                                                                                                                                             | already in Effect (`Array.takeRight`)                                                                                                        |
| Reduce a collection to its single best element by a two-key comparator (`newestRepoEnvironmentRevision` family)                                                                                                               | `nunofyobiz/ampm`: `packages/core/src/domain/AgentEnvironment.ts` definition; `packages/core/src/store/Store.ts`, `packages/core/src/store/StorePostgres.ts`, `packages/server/src/SandboxReclaim.ts` (3). 1 repo / 3 files / 3 calls.                                                                                                    | already in Effect (`Array.max` / `ArrayX.maxOption` composed with `Order.combine`)                                                           |
| Return the first candidate string that parses to `Some` (`firstParseable`)                                                                                                                                                    | `StoryCut/StoryCut`: `lib/UrlParamsX/UrlParamsX.ts` `FirstNumberParam`'s `decode` getter (1). 1 repo / 1 file / 1 call.                                                                                                                                                                                                                   | already in Effect (`Array.findFirst`'s `(a, i) => Option<B>` overload)                                                                       |
| Struct equivalence with per-key override equivalences (`propsAreEqualWithSpecial`)                                                                                                                                            | `StoryCut/StoryCut`: 0 production call sites — referenced only from its own test file. 1 repo / 0 files / 0 calls.                                                                                                                                                                                                                        | too narrow because usage is limited and universality is unclear                                                                              |
| Sort an array by a priority list, falling back to another order (`sortByPriority`)                                                                                                                                            | `StoryCut/StoryCut`: `domain/models/Timeline/Timeline.ts` `fuzzyOrderTimelineElements` (1). 1 repo / 1 file / 1 call.                                                                                                                                                                                                                     | too thin a wrapper (now that `OrderX.byPriority` is adopted, this is `Array.sortBy(OrderX.byPriority(...))`)                                 |
| Decode a raw value with a schema codec, throwing a labelled error on failure (`decodeField`)                                                                                                                                  | `LetsGetIntoIt/effect-clue`: `src/ui/share/useApplyShareSnapshot.ts` `buildSessionFromSnapshot` (12), `decodeAndBuildCardSet` (1). 1 repo / 1 file / 13 calls.                                                                                                                                                                            | too thin a wrapper (`Schema.decodeUnknownResult` plus a throw; the label/error type is app-specific)                                         |
| Compare two arrays for set-equality by membership (`sameSet`)                                                                                                                                                                 | `LetsGetIntoIt/effect-clue`: `src/ui/components/SuggestionPills.tsx` `MultiSelectList` (1). 1 repo / 1 file / 1 call.                                                                                                                                                                                                                     | too thin a wrapper                                                                                                                           |
| Rank recent records, then break missing values by case-insensitive label and apply a limit (`topRecentPacks`)                                                                                                                 | `LetsGetIntoIt/effect-clue`: `src/ui/setup/steps/SetupStepCardPack.tsx` `SetupStepCardPack` (1). 1 repo / 1 file / 1 call.                                                                                                                                                                                                                | too narrow because usage is limited and universality is unclear                                                                              |
| Resolve a proposed label to a non-colliding label with Roman-number suffixes (`disambiguateName`)                                                                                                                             | `LetsGetIntoIt/effect-clue`: `src/logic/CardSet.ts` `addCategoryToCardSet` (2), `renameCategoryInCardSet` (1), `addCardToCategoryInCardSet` (1), and `renameCardInCardSet` (1). 1 repo / 1 file / 5 calls.                                                                                                                                | domain rules                                                                                                                                 |
| Run a thunk returning a `Promise`, converting a rejection to a tagged error (`tryEffect`)                                                                                                                                     | `projitect/projitect`: `packages/cli-internals/src/platform/file-system.ts` (not exported; 17 internal-to-file calls, 0 external). 1 repo / 1 file / 0 production-external calls.                                                                                                                                                         | already in Effect (`Effect.tryPromise`)                                                                                                      |
| Build a post-sort `Record<K, number>` index of priority rank (`indexMap`)                                                                                                                                                     | `StoryCut/StoryCut`: `lib/FuzzyOrdering/FuzzyOrdering.ts` — 0 production call sites (test-only). 1 repo / 0 files / 0 calls.                                                                                                                                                                                                              | too narrow because usage is limited and universality is unclear (decomposes into `OrderX.byPriority` + a `Record`-flavored `MapX.positions`) |
| Trivial single-field tagged-class constructor underlying `FuzzyOrdering` (`FuzzyOrdering.of`)                                                                                                                                 | `StoryCut/StoryCut`: internal to `lib/FuzzyOrdering/FuzzyOrdering.ts` only. 1 repo / 1 file / 0 external calls.                                                                                                                                                                                                                           | too thin a wrapper                                                                                                                           |
| Decode/encode typed values from Next.js URL query params (`arrayParam`, `firstEnumParam`, `keyValueParam`, `decodeParsedUrlQuery`, `decodeURLSearchParams`, `encodeToURLSearchParams`, `urlWithParams`, `decodeFieldByField`) | `StoryCut/StoryCut`: `lib/UrlParamsX/UrlParamsX.ts`, production call sites across the app's URL-param consumers. 1 repo.                                                                                                                                                                                                                  | domain rules (tied to the Next.js `URLSearchParams`/`ParsedUrlQuery` wire shape)                                                             |
| Render/escape XML for static diagram output (`Tag`, `unsafeToXmlString`, `encodeXmlAttribute`, `decodeXmlAttribute`, `decodeAllXmlAttributes`)                                                                                | `StoryCut/StoryCut`: `lib/Xml/*`, production call sites across the app's XML diagram rendering. 1 repo.                                                                                                                                                                                                                                   | domain rules (React/XML rendering specific; no generic type parameter)                                                                       |
| Ascending comparator on a numeric field with a string tiebreak (`byCreatedAtThenId`)                                                                                                                                          | `nunofyobiz/ampm`: `packages/server/src/TaskQuestions.ts` `questionsAndResearchAsksFor` (1). 1 repo / 1 file / 1 call.                                                                                                                                                                                                                    | already in Effect (`Order.combine` + `Order.mapInput` over `Order.Number`/`Order.String`)                                                    |
| Stable sort ascending by an optional timestamp, untimestamped items first and order-preserving (`leastRecentlyUsedFirst`)                                                                                                     | `nunofyobiz/ampm`: `packages/web/lib/workspace-recency.ts` — 0 call sites within swept directories. 1 repo / 0 files / 0 calls.                                                                                                                                                                                                           | too narrow because usage is limited and universality is unclear                                                                              |
| Flatten a flat parent-pointer list into a depth-annotated, order-preserving row view with collapse support (`nestedRowsOf`)                                                                                                   | `nunofyobiz/ampm`: `packages/web/lib/task-nesting.ts` — 0 call sites within swept directories (consumers are React components out of scope). 1 repo / 0 files / 0 calls.                                                                                                                                                                  | too narrow because usage is limited and universality is unclear                                                                              |
| Return items from a flat parent-pointer list referenced as a parent by another item (`parentCandidatesOf`)                                                                                                                    | `nunofyobiz/ampm`: `packages/web/lib/parent-scope.ts` — 0 call sites within swept directories. 1 repo / 0 files / 0 calls.                                                                                                                                                                                                                | too narrow because usage is limited and universality is unclear                                                                              |
| Transitive closure of one root id over a flat parent-pointer list (`withDescendants`)                                                                                                                                         | `nunofyobiz/ampm`: `packages/web/lib/parent-scope.ts` `parentScopedItems` (1, not exported). 1 repo / 1 file / 1 call.                                                                                                                                                                                                                    | too narrow because usage is limited and universality is unclear                                                                              |
| Transplant an original `Error`'s `.stack` onto a rebuilt replacement error (`withOriginalStack`)                                                                                                                              | `nunofyobiz/ampm`: `packages/executor/src/TranscriptRedaction.ts` `scrubAgentError` (4), `scrubExecutorError` (1). 1 repo / 1 file / 5 calls.                                                                                                                                                                                             | too narrow because usage is limited and universality is unclear                                                                              |
| Root-to-node path down to a tree node holding a given leaf value (`pathToValue`)                                                                                                                                              | `nunofyobiz/ampm`: `packages/web/lib/destination-hierarchy.ts` `namedPathOf` (1); `packages/web/lib/move-copy.ts` `moveDestinationOf` (1). 1 repo / 2 files / 2 calls.                                                                                                                                                                    | too narrow because usage is limited and universality is unclear                                                                              |
| Rank a key→value table by a numeric score and take the top N (`topN`)                                                                                                                                                         | `nunofyobiz/ampm`: `packages/server/src/ProcessMetrics.ts` `activitySummaryOf` (2). 1 repo / 1 file / 2 calls.                                                                                                                                                                                                                            | too narrow because usage is limited and universality is unclear                                                                              |
| Textbook LCS sequence diff emitting ordered keep/remove/add operations (`diffSequence`)                                                                                                                                       | `nunofyobiz/ampm`: `packages/web/lib/diff.ts` `alignBlocks`, `diffCriteria` (2). 1 repo / 1 file / 2 calls.                                                                                                                                                                                                                               | too narrow because usage is limited and universality is unclear                                                                              |
| Keyset/cursor pagination over a sorted array (`keysetPage`)                                                                                                                                                                   | `nunofyobiz/ampm`: `packages/server/src/AgentMcp.ts` `scanGuidanceGaps`, `scanFeedback`, `scanApprovals`, `getTaskHistory` (4). 1 repo / 1 file / 4 calls.                                                                                                                                                                                | too narrow because usage is limited and universality is unclear                                                                              |

Also reviewed and rejected in aggregate, without an individual row because each is either
Effect/concurrency-plumbing bound to this app's own runtime or already covered above by a named
row: ampm's `withLeaseHeartbeat`, `withHostLock`, `withSandbox`, `forkDuePassLoop`, `traced`,
`retryTransientSync`, `SyncCodec.ts`'s codec wrappers, `api.ts`'s `postJson`/`putJson`/`patchJson`,
and roughly 30 `*Of` functions whose type parameter is bound to this app's own `TaskFacts`,
`Approval`, `Step`, `Priority`, or `Effort` shapes; StoryCut's React hooks/components with a
generic prop or state type, its DB-model field builders (bound to `Model.FieldOnly` conventions),
and `NextErrors.ts`'s `Exit`/unknown-error matchers (hard-wired to this app's `Redirect` and
response-status wire format); effect-clue's `trackInFlight` (closes over module-scoped mutable
pub-sub state), `withServerAction` (requires this app's own `PgClient` environment), and
`createModalSlotStore`/`useModalSlotStoreSelector` (a React-only state container, out of scope
regardless of genericity). projitect's sweep found no further candidates beyond those already
tabled above; its exported surface is almost entirely monomorphized to its own `ChangeSet`,
`FilePlan`, `PjtLock`, and `Blueprint` types.

### Effect and package checks behind the rejected rows

- `Array.groupBy` covers `categorize`; `Array.flatMapNullishOr` covers the nullable transform
  directly, mapping each element and dropping `null`/`undefined` results. Both are in
  `effect/Array` at 4.0.2; current `ArrayX.categorize` and `ArrayX.filterMapNullable` carry
  `@deprecated` annotations naming those exact exports as the replacement.
- `Array.groupWith` was checked for adjacent grouping but does not carry a computed group value;
  `ArrayX.chunkBy` is still the package's labelled, empty-input behavior.
- `Array.findFirstWithIndex`, `Array.findFirstIndex`, `Array.mapAccum`, `Array.sort`, and
  `Array.sortBy` were checked while classifying the array candidates; none replaces the retained
  `ArrayX.findFirstWithIndex2d` behavior.
- `Array.findFirst`'s declared overload set includes `<A, B>(f: (a: A, i: number) => Option<B>) =>
(self: Iterable<A>) => Option<B>` — confirmed in `node_modules/effect/dist/Array.d.ts` — which is
  exactly "first candidate that maps to `Some`," covering `firstParseable` with no new helper
  needed.
- `Array.takeRight`, `Array.max`, and `Array.min` (both require `NonEmptyReadonlyArray`) were
  checked for the "keep newest" family; `ArrayX.maxOption` already makes `Array.max` empty-safe,
  and composing it with `Order.combine`/`Order.mapInput` covers a two-key single-winner reduce.
- `Effect.tryPromise` and `Effect.try` (`effect/Effect`) were checked against `tryEffect`; the
  candidate is a direct, unexported partial application of `Effect.tryPromise` with no added
  generic behavior.
- `Equivalence.Struct` (`effect/Equivalence`) was checked against `propsAreEqualWithSpecial`; it is
  a plausible existing-equivalent for a per-key-override struct equivalence, but the candidate's
  zero production call sites settled the disposition before that comparison mattered.
- `Order.make`, `Order.mapInput`, `Order.combine`, `Order.combineAll`, `Order.max`, and `Order.min`
  (`effect/Order`) were checked for `byPriority` and `byCreatedAtThenId`; the latter is a direct
  composition of `Order.combine` over two `Order.mapInput`-adapted built-in orders, while
  `byPriority`'s priority-list-with-fallback shape has no existing one-call composition.
- `Option.map`, `Option.match`, `Struct.pick`, `Struct.omit`, `Record.get`, `Record.set`,
  `HashMap.fromIterable`, and `HashMap.set` were checked alongside the corresponding `OptionX`,
  `StructX`, `RecordX`, and `MapX` exports. The rows marked `already in effect-extras` match the
  named modules in this repository, not merely a similar local call-site expression.

## Implementation boundary

`tk-8452f601` should implement, in this module order (most source repositories first, then total
call sites):

1. `MapX.positions` and `MapX.preferredByKey`.
2. `ArrayX.connectedComponentsBy`, `ArrayX.mergeKeyedArrays`, and `ArrayX.extractMinBy`.
3. `OrderX.byPriority`.

Each needs its normal module tests, documentation, and consumer migration decisions in the
implementation task. This survey changes no source, generated documentation, package metadata, or
changeset.

The adopted APIs are intentionally not merged into one another: `positions` is a reusable lookup
constructor, `preferredByKey` owns per-key winner selection, `connectedComponentsBy` owns
transitive-membership grouping, `mergeKeyedArrays` additionally owns order-preserving,
referentially-stable array reconciliation, `extractMinBy` owns the find-and-remove shape, and
`byPriority` owns deriving a composable `Order` from a priority list — each is a distinct,
independently useful primitive.
