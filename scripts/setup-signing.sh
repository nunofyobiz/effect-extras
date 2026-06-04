#!/usr/bin/env bash
#
# setup-signing.sh
#
# Configures this worktree's git identity so that commits made by an agent
# (Claude Code, etc.) inside a `claude/*` or `agent/*` branch are authored as a
# distinct "Claude Code (<contributor>)" identity AND signed with the dedicated
# "Claude Code" SSH key — kept apart from the human contributor's normal name and
# key. Agent commits then land under a separate author with GitHub's green
# "Verified" badge. Idempotent.
#
# When this runs:
#   - Automatically: the `SessionStart` hook in .claude/settings.json fires this
#     on every agent session start — the "never forget" guarantee, so the agent
#     identity is in place before the first commit of the session.
#   - Manually: run `bash scripts/setup-signing.sh` to (re-)apply it, e.g. after a
#     fresh clone (which doesn't carry repo-local git config).
#
# How it works (adapted from StoryCut's setup-claude-worktree-git.sh):
#   The agent identity lives in ~/.gitconfig.claude — a per-machine git-config
#   file holding the name, email, signing key, gpg.format, allowed-signers, and
#   commit.gpgsign. This script copies those into the *worktree* config (via
#   extensions.worktreeConfig), which sits ABOVE local .git/config in git's
#   precedence ladder — so it overrides the human's identity + key, but only
#   inside this agent worktree.
#
# What it does NOT do:
#   - Non-agent branches (main, feature/*, …): exits early, so the human's normal
#     identity applies untouched.
#   - Other worktrees / clones: per-worktree config is scoped to this worktree.
#   - The human's personal git config: never modified.
#
# No identity or key material is baked into this script — everything is read from
# the contributor's local ~/.gitconfig.claude. One-time machine setup (creating
# that file + the key) is documented in AGENTS.md › Commit signing.

set -euo pipefail

# Not in a git work tree (e.g. a published tarball running its own scripts)? Nothing to do.
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

# Only configure inside an agent worktree; elsewhere the human's identity applies.
branch=$(git branch --show-current 2>/dev/null || true)
if [[ "$branch" != claude/* && "$branch" != agent/* ]]; then
  exit 0
fi

# The per-contributor agent identity. Absent? Print a hint and exit 0 — never
# block a session or a CI install; the only consequence is normal-author,
# unsigned commits.
identity_file="$HOME/.gitconfig.claude"
if [[ ! -f "$identity_file" ]]; then
  echo "effect-extras: ~/.gitconfig.claude not found — agent commits will use your"
  echo "               normal identity and be UNSIGNED. One-time setup is in"
  echo "               AGENTS.md › Commit signing."
  exit 0
fi

# Per-worktree config only takes effect once this extension is enabled (idempotent).
git config extensions.worktreeConfig true

# Copy each present key from ~/.gitconfig.claude into this worktree's config.
# Worktree config beats local .git/config, so this overrides the human identity +
# key just for commits made inside this worktree.
keys=(
  user.name
  user.email
  user.signingkey
  gpg.format
  gpg.ssh.allowedSignersFile
  commit.gpgsign
)

changed=0
for key in "${keys[@]}"; do
  value=$(git config --file "$identity_file" --get "$key" 2>/dev/null || true)
  [[ -z "$value" ]] && continue

  current=$(git config --worktree --get "$key" 2>/dev/null || true)
  if [[ "$current" != "$value" ]]; then
    git config --worktree "$key" "$value"
    changed=1
  fi
done

if [[ "$changed" -eq 1 ]]; then
  echo "effect-extras: agent commit identity configured for this worktree (branch: $branch)"
fi
exit 0
