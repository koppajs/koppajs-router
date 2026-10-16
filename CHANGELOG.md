# Change Log

All notable changes to **@koppajs/koppajs-router** are documented in this file.

This project uses a **manual, tag-driven release process**.
Only tagged versions represent official releases.

This changelog documents **intentional milestones and guarantees**,
not every internal refactor.

---

## [Unreleased]

No unreleased changes.

---

## 0.1.7

- add optional typed `isLinkActive(link, currentRoute)` rules shared by initial,
  navigation, history, and mutation-triggered active-link synchronization while
  preserving path-based matching by default
- invalidate queued active-link synchronization on teardown and document the
  boundary between synchronous navigation hooks and later DOM synchronization

---

## 0.1.6

- add synchronous, per-instance before-navigation cancellation and after-render
  observation hooks with typed route contexts, idempotent unsubscribe, and
  lifecycle cleanup while preserving existing route-change events

---

## 0.1.5

- retry instant history scroll restoration across short post-render layout
  stabilization windows so asynchronous route content can expand the page
  before the saved position is considered final

---

## 0.1.4

- restore persisted history scroll positions instantly so global CSS smooth
  scrolling cannot delay browser back/forward or reload scroll restoration

---

## 0.1.3

- persist router scroll positions on browser history entries so back/forward
  traversal and router restarts restore scroll state after render without
  regressing anchor navigation or fresh link navigation

---

## 0.1.2

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
