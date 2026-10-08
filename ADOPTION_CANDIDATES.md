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
made. The tables below are therefore the complete canonical candidate set from this survey, not a
list of every incidental collection operation.

Names are deliberately plain: `positions` and `sortByPriority` describe their result without FP
jargon. `tap`, `contramap`, `mapLeft`, and `mapRight` are not proposed.

## Adopted candidates

### `MapX` — 2 source repositories, 14 call sites

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
| `nunofyobiz/ampm`   | `packages/core/src/domain/WorkspaceModel.ts`           | `mergeRows`                               |           1 |
| `StoryCut/StoryCut` | `domain/models/Timeline/Timeline.ts`                   | `fuzzyOrderedTimelineTrackIndexes`        |           1 |
| `StoryCut/StoryCut` | `domain/models/Timeline/Timeline.ts`                   | `fuzzyOrderedTimeBucketIndexes`           |           1 |
| `StoryCut/StoryCut` | `lib/FuzzyOrdering/FuzzyOrdering.ts`                   | `order`                                   |           1 |

Usage total: 2 repositories, 13 files, 14 call sites.

### `ArrayX` — 1 source repository, 1 call site

#### `sortByPriority`

Sort values according to an externally stored priority sequence, while a supplied order decides
ties and values absent from that sequence. It creates the priority lookup once, then keeps the
sort independent of the source's domain model.

Proposed generic `dual` signature (data-last overload first):

```ts
export const sortByPriority: {
  <A, K>(
    priority: Iterable<K>,
    keyOf: (value: A) => K,
    otherwise: Order.Order<A>,
  ): (self: Iterable<A>) => Array<A>;
  <A, K>(
    self: Iterable<A>,
    priority: Iterable<K>,
    keyOf: (value: A) => K,
    otherwise: Order.Order<A>,
  ): Array<A>;
};
```

- Target: existing `ArrayX` module.
- effect-extras status: no equivalent export exists in `src/ArrayX.ts` or `src/index.ts`.
- Effect 4.0.2 absence proof: checked `effect/Array` exports `sort`, `sortBy`, `group`,
  `groupWith`, and `groupBy`, and `effect/Order` exports `make`, `mapInput`, `combine`, and
  `combineAll`; none derives an order from a priority iterable and applies a fallback order in one
  data-last operation.
- Single-use justification: a separately persisted ordering is a common generic shape for
  user-configured lists, while the candidate accepts only values, keys, and an `Order`. The sole
  source call already builds the same two-level order by hand and has no product-specific behavior.

| Repository          | File                                 | Enclosing/source symbol   | Occurrences |
| ------------------- | ------------------------------------ | ------------------------- | ----------: |
| `StoryCut/StoryCut` | `domain/models/Timeline/Timeline.ts` | `sortElementsForTimeline` |           1 |

Usage total: 1 repository, 1 file, 1 call site.

## Rejected candidates

Every row below has exactly one final reason. A row that is already supplied by this package is
kept here rather than represented as a new adoption.

| Candidate and abstract behavior                                                                               | Usage evidence (repositories / files / call sites; each occurrence)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Reason                                                          |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Group values by a key into a record (`categorize`)                                                            | `StoryCut/StoryCut`: `components/pages/ProjectHomePage.tsx` `ProjectHomePage` (1); `domain/repositories/virtual/RecordingAssetClipRepository/RecordingAssetClipRepository.ts` `pairRecordingAssetsAndClips` (2). 1 repo / 2 files / 3 calls.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | already in Effect                                               |
| Transform values while dropping absent results (`filterMapNullable`)                                          | `StoryCut/StoryCut`: `components/lib/KeyHandler.tsx` `KeyHandler` (1). 1 repo / 1 file / 1 call.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | already in Effect                                               |
| Build labelled runs of adjacent values (`chunkBy`)                                                            | `StoryCut/StoryCut`: `components/recordings/RecordingRollingClipsMiniTimeline.tsx` `groupByStoryBlock` (1). 1 repo / 1 file / 1 call.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | already in effect-extras                                        |
| Find the first nested-array value with both coordinates (`findFirstWithIndex2d`)                              | `StoryCut/StoryCut`: `components/spreadsheet/SpreadsheetCellNavigator.ts` `moveRightFrom`, `moveToRightEndFrom`, `moveLeftFrom`, `moveToLeftEndFrom`, `moveUpFrom`, `moveToTopEndFrom`, `moveDownFrom`, and `moveToBottomEndFrom` (8). 1 repo / 1 file / 8 calls.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | already in effect-extras                                        |
| Render or construct a nullable value from an `Option` (`mapSomeOrNull` / `mapSomeOrUndefined`)                | `StoryCut/StoryCut`: `components/layout/AppAuthedHeader.tsx` `AppAuthedHeader` (1); `components/layout/project/ProjectBreadcrumb.tsx` `ProjectBreadcrumb` (1); `components/onboarding/ProjectHomeGreeting/ProjectProgressChecklist.tsx` `ProjectProgressChecklist` (1); `components/objects/CreateRecordingClipButton.tsx` `CreateRecordingClipButton` (2); `components/objects/RecordingClip.tsx` `RecordingClip` (1); `components/objects/ProjectOverview.tsx` `ProjectOverview` (1); `components/objects/Recording/RecordingEndView/RecordingEndActions.tsx` `RecordingEndActions` (1); `components/objects/Recording/RecordingAssetsView/RecordingExportClipsTimeline.tsx` `RecordingExportClipsTimeline` (1); `components/objects/Recording/RecordingRollingView/RecordingSequencePrompter.tsx` `RecordingSequencePrompter` (4); `components/objects/RoughCut/RoughCutDragGhost.tsx` `RoughCutDragGhost` (1); `components/objects/Story/StoryDragGhost.tsx` `StoryDragGhost` (1); `components/recordings/RecordingRollingClipsTimeline.tsx` `RecordingRollingClipsTimeline` (3); `components/forms/RecordingAssetAlignForm.tsx` `RecordingAssetAlignForm` (1). 1 repo / 13 files / 19 calls. | already in effect-extras                                        |
| Conditionally construct selected object fields (`pickSome`)                                                   | `StoryCut/StoryCut`: `app/api/v1/projects/[projectId]/route.ts` `PATCH` action (5); `app/api/v1/projects/[projectId]/recordingAssets/[recordingAssetId]/route.ts` `PATCH` action (5). 1 repo / 2 files / 10 calls.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | already in effect-extras                                        |
| Insert or move one unique value before another (`upsertUniqBefore`)                                           | `StoryCut/StoryCut`: `domain/repositories/virtual/TimelineDataRepository/TimelineDataRepository.ts` track and element mutation paths (2). 1 repo / 1 file / 2 calls.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | already in effect-extras                                        |
| Merge JSON-like values recursively and canonicalize object keys                                               | `projitect/projitect`: `packages/cli-internals/src/applier.ts` `nextMerge` (1); `packages/cli-internals/src/differ.ts` `nextMerge` (1) and `canonicalJson` (1); `packages/cli-internals/src/plan.ts` merge planning (1). 1 repo / 3 files / 4 calls.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | already in effect-extras                                        |
| Group all values by a computed key                                                                            | `projitect/projitect`: `packages/cli-internals/src/plan.ts` `groupByBlueprint`, path conflict grouping, and owner grouping (3); `nunofyobiz/ampm`: `packages/workflows/src/phases/SessionPrune.ts` run grouping (3). 2 repos / 2 files / 6 calls.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | already in Effect                                               |
| Resolve a proposed label to a non-colliding label with Roman-number suffixes (`disambiguateName`)             | `LetsGetIntoIt/effect-clue`: `src/logic/CardSet.ts` `addCategoryToCardSet` (2), `renameCategoryInCardSet` (1), `addCardToCategoryInCardSet` (1), and `renameCardInCardSet` (1). 1 repo / 1 file / 5 calls.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | domain rules                                                    |
| Rank recent records, then break missing values by case-insensitive label and apply a limit (`topRecentPacks`) | `LetsGetIntoIt/effect-clue`: `src/ui/setup/steps/SetupStepCardPack.tsx` `SetupStepCardPack` (1). 1 repo / 1 file / 1 call.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | too narrow because usage is limited and universality is unclear |

### Effect and package checks behind the rejected rows

- `Array.groupBy` covers `categorize`; `Array.filterMap` covers the nullable transform after
  converting the callback result to Effect's `Result` form. Both are in `effect/Array` at 4.0.2;
  current `ArrayX.categorize` and `ArrayX.filterMapNullable` are explicitly deprecated in favour
  of those exports.
- `Array.groupWith` was checked for adjacent grouping but does not carry a computed group value;
  `ArrayX.chunkBy` is still the package's labelled, empty-input behavior.
- `Array.findFirstWithIndex`, `Array.findFirstIndex`, `Array.mapAccum`, `Array.sort`, and
  `Array.sortBy` were checked while classifying the array candidates; none replaces the retained
  `ArrayX.findFirstWithIndex2d` behavior.
- `Option.map`, `Option.match`, `Struct.pick`, `Struct.omit`, `Record.get`, `Record.set`,
  `HashMap.fromIterable`, and `HashMap.set` were checked alongside the corresponding `OptionX`,
  `StructX`, `RecordX`, and `MapX` exports. The rows marked `already in effect-extras` match the
  named modules in this repository, not merely a similar local call-site expression.

## Implementation boundary

`tk-8452f601` should implement only `MapX.positions` and `ArrayX.sortByPriority`, in that module
order. Each needs its normal module tests, documentation, and consumer migration decisions in the
implementation task. This survey changes no source, generated documentation, package metadata, or
changeset.

The two adopted APIs are intentionally not merged: `positions` is a reusable lookup constructor
with fourteen source uses, while `sortByPriority` is the array-level composition that additionally
owns ordering and fallback semantics.
