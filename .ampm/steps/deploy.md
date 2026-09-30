# Deploy releases

Use this procedure when deploying `@nunofyobiz/effect-extras`. The Release workflow creates one
shared **Version Packages** PR for pending changesets; merging the original changeset PR does not
publish a package.

1. Open the Release workflow run for the task's merged commit. Record its URL and locate the
   **Version Packages** PR it created.
2. Re-read that PR immediately before acting. It must be the open or merged `changeset-release/main`
   PR targeting `main` created by that workflow (currently titled `chore(release): version packages`),
   and it may contain other changesets. Never merge a PR solely because it has a similar title or
   version.
3. If the PR is open, wait for all required CI checks to pass. Re-read its state, base branch, head
   branch, and checks immediately before merging. Merge it only when it is still that verified PR.
   The workflow's auto-merge request is best-effort; the deploy seat is responsible for ensuring the
   PR merges. If it is already merged, continue. If CI is pending or failing, report `staged`; if
   merge authority is unavailable, report `needs-human` with the PR and required action. Do not claim
   the release completed in either case.
4. Derive the exact package version from the merged Version Packages PR's `package.json`; do not use
   the task's expected version. Open the Release workflow run triggered by that merge and wait for its
   publishing job to succeed.
5. Verify all release evidence for that exact version:
   - the originating Release workflow run for the task commit;
   - green required CI and the merged Version Packages PR;
   - the successful post-merge publishing Release workflow run;
   - `npm view @nunofyobiz/effect-extras@<version>` shows that exact version and
     `dist.attestations.provenance`;
   - a matching non-draft GitHub release named `v<version>`.

Registry propagation can lag the publishing workflow. If npm, provenance, or the GitHub release is
not visible yet, report `staged` and retry verification later. Report `released` only after every
item above is observable. Do not publish locally or edit package versions manually.
