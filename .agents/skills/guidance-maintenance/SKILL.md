---
name: guidance-maintenance
description: Update AGENTS.md, a docs/development page, or an agent skill while keeping guidance discoverable and contradiction-free. Use this skill whenever you add, move, or change a contributor rule or a skill, or the user says "update the guidance", "add this to AGENTS.md", "where should this rule live", or "this doc contradicts that one".
---

# Guidance maintenance

> Provenance: adapted from ampm's `ampm-guidance-maintenance` skill and
> [`docs/agent-guidance/maintenance.md`](https://github.com/nunofyobiz/ampm), dropping the
> `node setup/check-guidance.mjs` step (a guidance size/link checker is out of scope for this repo).

Read [guidance maintenance](../../../docs/development/guidance-maintenance.md) first — it has the full
placement procedure, the size target, and the guidance-gaps rule. This skill is the short trigger for
that page plus the mechanical checklist for the two cases that aren't just "edit a page":

**Adding or changing a rule:**

1. Decide the canonical home per the placement procedure — `AGENTS.md` only if every task needs it,
   otherwise one topic page in `docs/development/`, or one `.agents/skills/<name>/SKILL.md` for a
   repeatable procedure.
2. Rewrite the affected section cohesively; don't append a patch.
3. Search the other canonical pages for a contradicting or weaker statement of the same rule and
   resolve it in the same change — [what belongs here](../../../docs/development/what-belongs-here.md),
   [FP mindset](../../../docs/development/fp-mindset.md), [Tests](../../../docs/development/tests.md),
   and [`*X` modules and API docs](../../../docs/development/modules-and-api-docs.md) all have to agree
   with each other.
4. Update the `AGENTS.md` routing table only if the topic or required reading changed.

**Adding a new skill:**

1. Write the canonical file at `.agents/skills/<name>/SKILL.md` with a trigger-first `description` —
   lead with when to use it, not what it does.
2. Add a thin `.claude/skills/<name>/SKILL.md` that links to the canonical file (see any existing
   skill's `.claude/skills/<name>/SKILL.md` for the one-line form).
3. Add a row — or a link inside an existing row — in the `AGENTS.md` routing table. Automatic skill
   selection at session start is not guaranteed, so a procedure a task is likely to need must have a
   direct path to it.
4. Never create a second skill for a procedure this repository already has one for (commit, verify,
   PR, rebase, release) — update the existing skill in place instead.

Finish by running `pnpm check-all` and confirming `pnpm docgen` left `docs/development/` untouched
(it's excluded in `docs/_config.yml`).
