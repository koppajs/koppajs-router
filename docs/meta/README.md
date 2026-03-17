# Meta Layer Guide

`docs/meta/` holds supporting material for maintaining the repository's meta
layer.

Key files in this directory:

- `README.md` for the meta-layer support overview
- `maintenance-checklist.md` for update triggers
- `repository-audit.md` for the latest audit snapshot

## Current Repository Snapshot

- The package is a small TypeScript module with one runtime entry point in
  `src/index.ts`.
- Tests live in `tests/unit/router.test.ts` and exercise both pure routing logic
  and jsdom-backed runtime behavior.
- Tooling is intentionally light: TypeScript, ESLint, Prettier, and Vitest.
- There is no package-local CI workflow file today, so the script-based quality
  gates are the canonical verification path.

## Why The Meta Layer Exists

- to keep architecture memory close to a fast-moving package
- to make public behavior explicit before future refactors split the source
  file
- to help AI and human contributors converge on the same rules
- to ensure governance evolves with the real code instead of becoming an
  afterthought

## Maintenance Rule

Whenever this repository gains a new subsystem, architectural pattern, public
contract, or quality gate, update the relevant meta documents in the same
change.
