# Testing Strategy

## Testing Philosophy

This package is small enough that most confidence should come from fast,
high-signal unit tests that exercise the real routing logic. Tests should prove
behavioral contracts, especially around URL handling and browser integration
seams, without overfitting to implementation details.

## Quality Goals

- Prevent regressions in base-path behavior.
- Prevent regressions in active-route link synchronization.
- Keep route resolution deterministic for flat routes, nested routes, params,
  redirects, query strings, and hashes.
- Verify that the router updates outlet rendering, document metadata, emitted
  events, and scroll behavior consistently.

## Test Pyramid For This Package

- Unit tests are the primary layer and should cover all pure helpers and most
  runtime behavior through Vitest plus jsdom.
- Integration-style tests still live in the unit suite when they exercise the
  real router class across DOM, history, and event seams.
- Browser end-to-end tests are optional and should only be introduced here if
  the repository adds a demo app or package-local browser harness. Otherwise,
  consumer applications should validate browser-specific integration.

## What We Deliberately Do Not Use

- No Playwright today: this repository is a reusable router package, not a
  standalone end-user UI.
- No style-linting stack today: the package has no CSS, SCSS, or design-token
  surface to lint.

## When To Add Tests

- Add unit tests for every public helper and public router method that changes.
- Add regression tests for every bug fix affecting base paths, redirects,
  params, query handling, hashes, scroll behavior, or active links.
- Add multi-step lifecycle tests when changes span `init`, navigation,
  `popstate`, or `destroy`.

## Mocking Policy

- Do not mock pure route-resolution helpers.
- Mock browser APIs only at the seam being exercised, such as `scrollTo`,
  `scrollIntoView`, or `requestAnimationFrame`.
- Prefer realistic DOM fixtures over deep internal spying.

## Coverage Expectations

Vitest coverage thresholds are part of the package contract:

- lines: 70
- statements: 70
- functions: 65
- branches: 60

Thresholds are a floor, not a target. New behavior should ship with focused
tests whether or not coverage percentages move.

## Required Verification Commands

Run these checks before considering work complete:

- `pnpm install`
- `pnpm run lint`
- `pnpm run test:unit`
- `pnpm run test:ci`
- `pnpm run build`
- `pnpm run check:package`
- `pnpm run test:package`
- `pnpm run check`

## CI And Release Validation

- `.github/workflows/ci.yml` runs the package quality gate on Node 20 and 22.
- `.github/workflows/release.yml` reruns the same checks, including the packed
  tarball consumer smoke test, before publishing a tagged release to npm.
