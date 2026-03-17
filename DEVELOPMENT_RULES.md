# Development Rules

## Coding Philosophy

- Favor straightforward TypeScript and browser APIs over framework-specific
  abstractions.
- Keep pure routing logic deterministic and side-effect free.
- Keep browser side effects explicit, local, and easy to trace.
- Optimize for stable public behavior and low cognitive overhead.

## Source Organization

The implementation currently lives in [`src/index.ts`](./src/index.ts). Treat
it as four logical zones even before the file is split:

1. Public types and constants
2. Pure normalization, matching, and resolution helpers
3. DOM synchronization helpers
4. `KoppajsRouter` runtime orchestration

If a change blurs those boundaries, either refactor back into the existing
shape or document a new structure in `ARCHITECTURE.md` and
`docs/architecture/module-boundaries.md`.

## Allowed Patterns

- Pure helper functions for path, query, hash, and route normalization
- Immutable return objects derived from route records
- Generic typing through `TRoute extends RouteDefinition`
- Explicit browser seams through injected `document` and `window` options
- Centralized helper use for base-path translation and active-link matching
- Small private runtime methods with one browser concern each

## Forbidden Or High-Bar Patterns

- Mutating route definitions during matching or navigation
- Bypassing `normalizeBasePath`, `toHref`, or `fromLocationPathname` for app
  href translation
- Introducing app-specific route metadata, page copy, or business rules into
  the package
- Creating a second active-link synchronization path outside
  `setActiveRouteLinks`
- Changing public exports without corresponding tests and documentation
- Adding runtime dependencies unless the browser and TypeScript standard
  library are clearly insufficient

## Naming And API Rules

- Use `Route*` prefixes for route-domain types.
- Prefer verb-based names for pure helpers such as `resolveRoute`,
  `normalizePath`, and `setActiveRouteLinks`.
- Keep browser event constants explicit and stable.
- Public APIs should be additive whenever possible. Breaking changes require an
  ADR and a clearly updated spec.

## Dependency Rules

- Runtime code stays framework-agnostic and browser-native.
- Development dependencies may support linting, formatting, typing, or tests,
  but should not leak into runtime design.
- Package-local governance stays thin. Reference external decisions when they
  exist, but keep this repository understandable on its own.
- Distribution settings in `package.json` must stay aligned with `dist/` output;
  do not change published entrypoints without updating docs and verification.

## Workflow Rules

- For substantial behavior changes, write or update a spec before code.
- Add or update tests before or alongside implementation.
- Update `README.md` whenever the public API, setup contract, or usage guidance
  changes.
- Update `RELEASE.md` and the workflow config when release, publish, or version
  management behavior changes.
- Update the meta layer whenever architecture, quality policy, or working
  agreements change.
