---
name: release-bump
description: Cut a release of @nunofyobiz/effect-extras. Reads the diff since the last release, suggests a changeset bump per the rules in AGENTS.md, verifies the CI gates, then walks through `pnpm changeset` / merge / publish. Use when the user says "cut a release", "release vX.Y.Z", "ship it", or "time to publish".
---

[Canonical skill](../../../.agents/skills/release-bump/SKILL.md)
