---
name: commit
description: Create a git commit for this repo using its prefix convention (ADD:, UPDATE:, FIX:, DELETE:, REFACTOR:, STYLE:, DOCS:). Use whenever the user asks to commit changes in pompaSysLandingPage.
---

Create a git commit for the currently staged/unstaged changes in this repo, following its established message convention: a short prefix in caps followed by a colon, then a concise Spanish summary — matching the existing history (e.g. `ADD: primer commit del landing page`).

## 1. Inspect before writing anything

Run in parallel:
- `git status`
- `git diff` (staged and unstaged)
- `git log --oneline -10` (confirm style/tone stays consistent)

## 2. Pick the prefix from what actually changed

Choose ONE prefix for the commit as a whole (the dominant nature of the change). If a change set genuinely mixes categories, pick the prefix matching the most significant part and mention the rest in the body.

- `ADD:` — new files, new sections, new features that didn't exist before
- `UPDATE:` — changes to existing content/behavior (copy edits, redesigns, palette changes, config tweaks)
- `FIX:` — correcting a bug or something that was broken/wrong
- `DELETE:` — removing files, sections, or dead code (no replacement)
- `REFACTOR:` — restructuring code/markup without changing what the user sees or the behavior
- `STYLE:` — pure visual/formatting changes (CSS-only, spacing, no structural change)
- `DOCS:` — documentation-only changes (README, comments, etc.)

## 3. Write the message

Format: `PREFIX: short summary in Spanish` as the subject line (imperative or descriptive, under ~70 chars). Add a bullet-point body only if there are multiple distinct changes worth calling out — keep bullets terse, describe *what* changed, not line-by-line diffs.

## 4. Stage and commit

- Stage only the relevant files by name (never `git add -A`/`git add .` blindly — check `git status` output for anything unexpected like secrets or unrelated local files first).
- Commit with the message via heredoc so formatting is preserved:

```bash
git commit -m "$(cat <<'EOF'
PREFIX: short summary

- detail one
- detail two
EOF
)"
```

- Run `git status` after to confirm a clean working tree.
- Do not push unless the user explicitly asks.
