# Agent Instructions

This file provides package-local working instructions for coding agents in
`koppajs-router`. It supplements higher-level repository rules and makes them
specific to this package.

## Mission

Work on `@koppajs/koppajs-router` as a standalone routing module.
Keep the package generic, route-config driven, and free of
website-specific copy or page logic.

## Reading Order

1. `DECISION_HIERARCHY.md`
2. The relevant specification under `docs/specs/`
3. `AI_CONSTITUTION.md`
4. `ARCHITECTURE.md`
5. `DEVELOPMENT_RULES.md`
6. `TESTING_STRATEGY.md`
7. `README.md`

## Core Rules

1. Router runtime stays in the package; route content stays in the consumer.
2. Base-path behavior and active route links must not regress.
3. Public API changes require tests, documentation, and usually a spec update.
4. Keep package governance thin. Use local ADRs only for package-local
   decisions and reference external decisions rather than duplicating them.
5. For substantial changes, follow: spec or decision -> tests ->
   implementation -> documentation.
6. When architecture, module boundaries, workflows, or quality rules change,
   update the meta layer in the same change.
7. When release, publishing, or versioning rules change, update
   `RELEASE.md`, `.github/workflows/`, and package metadata together.

## Required Checks

- `pnpm run lint`
- `pnpm run test:unit`
- `pnpm run build`
- `pnpm run check`
