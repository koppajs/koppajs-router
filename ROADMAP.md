# Roadmap

## Near-Term Priorities

- Keep the router generic while the package matures as a standalone module.
- Grow the spec and ADR history whenever public API or routing behavior
  materially changes.
- Preserve the current high-risk contracts: base-path translation, named-route
  resolution, redirect behavior, active-link sync, and scroll restoration.

## 1.0.0 Readiness Plan

- Done in-repository: make the published module contract explicit and keep the
  package ESM-only.
- Done in-repository: validate the packed tarball from a clean temporary
  consumer through `pnpm run test:package`.
- Done in-repository: keep CI and tagged release validation aligned with the
  package-consumer smoke check.
- Remaining manual release step: confirm publish rights for the `@koppajs` npm
  scope.
- Remaining manual release step: configure and validate `NPM_TOKEN` plus GitHub
  release permissions.
- Remaining manual release step: prepare the final `1.0.0` version bump and
  release notes in `CHANGELOG.md`.

## Likely Evolution Areas

- Split `src/index.ts` into multiple source files if the current logical
  boundaries become hard to maintain.
- Add more error-path and edge-case tests if new route features are introduced.
- Expand package-local specs when new navigation capabilities or route metadata
  contracts are added.
- Introduce package-local browser integration infrastructure only if jsdom can
  no longer provide enough confidence.

## Meta-Layer Maintenance

- Re-run the repository audit whenever the package structure, routing model,
  test strategy, or contributor workflow changes.
- Keep `DECISIONS.md`, `docs/adr/`, and `docs/specs/` current so design intent
  stays discoverable.
