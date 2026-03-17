# Quality Guide

This directory captures the repository's practical quality gates.

## Verification Matrix

- There is currently no package-local CI workflow file, so these script-based
  checks are the authoritative quality gate.
- Lint and formatting:
  `pnpm run lint`
- Unit and jsdom lifecycle tests:
  `pnpm run test:unit`
- Type-safe build output:
  `pnpm run build`
- Package manifest/build consistency:
  `pnpm run check:package`
- Full package gate:
  `pnpm run check`

## Tooling Decisions

- No Playwright: the package exposes router runtime logic but no standalone UI.
- No Stylelint: there is no CSS or SCSS surface in this repository.
- No package-local Husky hooks: this package is kept lightweight and is not
  guaranteed to be the VCS root in every host setup. Explicit scripts are the
  canonical enforcement path, and host repositories may wire their own hooks.

## Quality Priorities

- behavior stability over superficial refactors
- strong regression protection for base paths, redirects, active links, and
  scroll behavior
- documentation that stays consistent with the implementation
- explicit handling of public API evolution

## Review Checklist

- Does the change preserve package genericity?
- Does it keep route-record immutability intact?
- Does it preserve the documented package entrypoint and build behavior, or
  explicitly update the docs if that contract changes?
- Does it update the relevant spec, tests, and architecture docs?
- Does it keep the required commands passing?
