# AI Constitution

This repository treats AI agents as implementation partners, not as a shortcut
around design discipline. The project values a small, predictable router
runtime more than fast but inconsistent changes.

## Core Principles

- Keep the package generic, route-config driven, and free of application copy
  or page logic.
- Preserve the router's core contracts first: base-path handling, active-link
  synchronization, immutable route records, and History API navigation.
- Prefer additive evolution over surprising rewrites. Small, explicit changes
  beat clever abstractions.
- Keep pure routing logic separate from browser side effects.
- Use tests and specs to capture behavior before broadening the public API.

## Collaboration Rules For Humans And AI

- Read the current decision hierarchy before making substantial changes.
- For any non-trivial behavior change, work in the order:
  spec or decision -> tests -> implementation -> documentation.
- Do not silently change public exports, runtime behavior, or consumer
  responsibilities.
- Prefer existing patterns in `src/index.ts` and `tests/unit/router.test.ts`
  before introducing new abstractions or dependencies.
- When architecture, workflow, or module boundaries change, update the meta
  layer in the same change.
- State assumptions clearly when the repository does not provide enough context.

## AI-Specific Guardrails

- Read `ARCHITECTURE.md`, `DEVELOPMENT_RULES.md`, and the relevant spec before
  editing router logic.
- If a change touches public API, also update `README.md`,
  `docs/specs/router-runtime.md`, and the appropriate tests.
- If a change introduces or removes a recurring architectural pattern, create or
  update an ADR in `docs/adr/`.
- If a change affects release, publish, or versioning behavior, update
  `RELEASE.md`, the workflow files, and the relevant package metadata together.
- Do not move consumer-owned concerns such as route content, application copy,
  or app-specific navigation rules into this package.
- Keep dependencies lean. New runtime dependencies require explicit written
  justification.

## Self-Evolution Rule

The meta layer is a living system. Whenever the router's architecture, module
boundaries, quality gates, collaboration workflow, or public contract changes,
the corresponding meta documents must be updated in the same change set.
