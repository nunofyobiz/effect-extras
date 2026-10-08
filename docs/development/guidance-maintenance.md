# Guidance maintenance

Keep `AGENTS.md` a short entry point (150 lines or fewer): only rules every task needs belong there. Put a topic-specific rule on its one canonical page in this folder, and put a repeatable procedure in a canonical `.agents/skills/<name>/SKILL.md`. The corresponding `.claude/skills/<name>/SKILL.md` keeps discovery metadata and links to that canonical skill. Each root routing-table row must link to every topic page and relevant procedure directly; automatic skill selection is not guaranteed.

When you update a section, **rewrite the affected section cohesively** — don't append patches to the bottom. The next reader (human or agent) should be able to scan a section top-to-bottom and understand it without archaeology.

`CLAUDE.md` is a symbolic link to `AGENTS.md`. If you find yourself editing both, you've broken the symlink — restore it with `ln -sf AGENTS.md CLAUDE.md` from the repo root.

The [migration map](./migration-map.md) records the canonical home of every rule moved from the previous root guide. Update it when moving a rule so this completeness audit remains useful.

The complete command-shape permission posture remains a universal rule in
[AGENTS.md](../../AGENTS.md#permission-prompt-posture).
