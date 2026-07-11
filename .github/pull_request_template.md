<!--
Thanks for opening a PR! A few notes before you fill this in:
- Keep the title under 70 chars; the body is for details. Use sentence-case
  imperative subjects matching this repo's style ("Add X", "Fix Y", "TASK-NNN: …").
- For TASK-* tickets, include the AC + implementation notes in TASKS.md in the same
  PR — the docs sync rule says every TASKS.md change updates CLAUDE.md + README.md too.
- The `ci` and `e2e` workflow checks are required to pass before merging (TASK-004).
-->

## Summary

<!-- 1-3 sentences: what this PR does and the WHY. -->

## Closes

<!-- TASK-NNN, or "n/a" for tickets without a TASKS.md entry. -->

## What changed

## <!-- Bullet list of the developer- or user-facing changes. Link files where helpful. -->

## Test plan

<!-- Bulleted markdown checklist. Pre-filled with the standard gates. -->

- [ ] `pnpm type-check` clean
- [ ] `pnpm lint` clean
- [ ] `pnpm test` clean (record the new/total count if you added tests)
- [ ] `pnpm test:e2e` clean (only if route, render, or instrumentation changed)
- [ ] Manual verification in dev — note the URL + steps if non-obvious

## Design notes worth flagging in review

<!-- Optional. Spec deviations, trade-offs, deferred follow-ups — anything a reviewer
might otherwise have to dig out of the diff. Omit the section entirely if nothing fits. -->
