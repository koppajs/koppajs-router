# Change Log

All notable changes to **@koppajs/koppajs-router** are documented in this file.

This project uses a **manual, tag-driven release process**.
Only tagged versions represent official releases.

This changelog documents **intentional milestones and guarantees**,
not every internal refactor.

---

## [Unreleased]

- raise the repository Node.js baseline to `>= 22`, add an explicit `validate`
  gate for CI and release, and expand compatibility validation to Node 22 and
  24

---

## 0.1.1

- add a repository documentation contract spec with local validator enforcement
- align `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, and `CODE_OF_CONDUCT.md` with the governed KoppaJS root-document format
- wire `pnpm run check:docs` into the repository quality gate and the local pre-commit hook

## 0.1.0

- initial workspace extraction of the reusable KoppaJS router runtime
- deterministic route resolution for flat and nested route definitions,
  including named routes, params, redirects, and explicit wildcard not-found
  handling
- base-path-aware browser routing with outlet rendering, metadata updates,
  active-link synchronization, route-change events, and scroll restoration
- ESM-only published package contract with `dist/` as the canonical output
- tarball-based package consumer smoke test plus package entrypoint validation
- repository-local meta layer, specs, ADR support, CI, and tag-driven release
  workflow alignment
