# Quality Guide

This directory captures the repository's practical quality gates.

## Verification Matrix

- `pnpm run check` is the main local quality gate.
- `pnpm run validate` is the CI and release validation contract; it reruns
  `check` and then verifies the packed tarball in a clean consumer.
- `.github/workflows/ci.yml` runs `pnpm run validate` on GitHub Actions for
  Node 22 and 24.
- `.github/workflows/release.yml` first validates `pnpm run validate` on Node
  22 and 24, then reruns the same validation on the maintainer default from
  `.nvmrc` before npm publish.
- Lint and formatting:
  `pnpm run lint`
- Unit and jsdom lifecycle tests:
  `pnpm run test:unit`
- CI-oriented unit test alias:
  `pnpm run test:ci`
- Type-safe build output:
  `pnpm run build`
- Package manifest/build consistency:
  `pnpm run check:package`
- Tarball consumer smoke test:
  `pnpm run test:package`
- Full package gate:
  `pnpm run check`
- CI/release validation gate:
  `pnpm run validate`

## Tooling Decisions

- Conventional Commits are enforced locally through Husky plus commitlint.
- `lint-staged` keeps the pre-commit hook fast by limiting fixes to staged
  files.
- No Playwright: the package exposes router runtime logic but no standalone UI.
- No Stylelint: there is no CSS or SCSS surface in this repository.
- Husky installation is best-effort: `pnpm install` skips hook setup when no
  `.git` directory is present or when `HUSKY=0` is set.

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
- Does it keep the release workflow, package metadata, and release doc in sync?
- Does it update the relevant spec, tests, and architecture docs?
- Does it keep the required commands passing?
