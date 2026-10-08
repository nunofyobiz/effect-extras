# Guidance maintenance

> Provenance: adapted from ampm's `docs/agent-guidance/maintenance.md`, dropping its
> `node setup/check-guidance.mjs` step — a guidance size/link checker is out of scope for this repo —
> and its 200–350 line target, which doesn't fit: this is a smaller, single-purpose library, and its
> 150-line target already holds today.

## Place a new rule

1. Identify the invariant it protects. If every task needs it, add a short rule to `AGENTS.md`;
   otherwise put it on its one canonical topic page in this folder.
2. If the rule is a repeatable procedure with non-obvious steps, put it in one canonical
   `.agents/skills/<name>/SKILL.md`, with its main trigger and scope at the start of the
   `description`. Add a thin `.claude/skills/<name>/SKILL.md` entry point that links to the canonical
   file. A procedure this repository already has a skill for (commit, verify, PR, rebase, release) is
   updated in that skill, never duplicated under a second name.
3. Add or adjust one `AGENTS.md` routing-table row only when the topic or required reading changes.
   Each row with a procedure links its skill directly — automatic skill selection at the start of a
   session is not guaranteed.
4. Update nearby code comments, tests, and docs that name an old location, and resolve any
   contradiction the new rule creates in the same change — two pages stating different bars for the
   same thing is a bug, not a style choice.
5. Rewrite the affected section **cohesively** — don't append a patch to the bottom. The next reader
   (human or agent) should be able to scan a section top to bottom and understand it without
   archaeology.

## Size and discovery

Keep `AGENTS.md` a short entry point: 150 lines or fewer, only rules every task needs. Keep
descriptions on skills concise and discriminating — they're what gets loaded before the full skill
body. `CLAUDE.md` is a symbolic link to `AGENTS.md`; if you find yourself editing both, you've broken
the symlink — restore it with `ln -sf AGENTS.md CLAUDE.md` from the repo root.

The [migration map](./migration-map.md) records the canonical home of every rule moved from the
previous root guide. Update it when moving a rule so this completeness audit remains useful.

The complete command-shape permission posture remains a universal rule in
[AGENTS.md](../../AGENTS.md#permission-prompt-posture).

## Guidance gaps

Report an actual missing or unclear rule by name — the topic and the canonical page or skill that
should state it — rather than defaulting every gap to "add a line to `AGENTS.md`". A new root routing
entry is appropriate only when a session otherwise has no path to discover the guide at all.
