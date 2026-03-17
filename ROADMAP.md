# Roadmap

## Near-Term Priorities

- Keep the router generic while the package matures as a standalone module.
- Grow the spec and ADR history whenever public API or routing behavior
  materially changes.
- Preserve the current high-risk contracts: base-path translation, named-route
  resolution, redirect behavior, active-link sync, and scroll restoration.

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
