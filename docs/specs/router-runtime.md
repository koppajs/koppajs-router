# Router Runtime Specification

## Description

The package provides a route-config-driven browser router runtime that resolves
direct paths and named routes, ranks matching routes by specificity, translates
them across an optional base path, renders the final route's component tag into
an outlet, updates metadata, emits route-change events, and applies URL-aware
scroll behavior. The runtime can also be configured for custom browser seams,
link-matching behavior, event naming, and scroll behavior.

## Evolution

- `evolution_phase`: stabilization
- `completeness_level`: high
- `known_gaps`: delegated click-interception coverage is still narrower than a
  full cross-browser harness, and the runtime remains implemented in one source
  file even though the logical module boundaries are documented separately.
- `deferred_complexity`: split `src/index.ts` only when the documented logical
  boundaries become materially harder to maintain in one file; add package-local
  browser integration infrastructure only if jsdom stops covering the
  regression-sensitive contracts.
- `technical_debt_items`: broaden tests around rarer delegated-navigation
  branches and maintain the tarball smoke test as the published entrypoint
  surface grows.

## Inputs

- a non-empty list of `RouteDefinition` records
- optional catch-all route records using `path: "*"` at the relevant nesting
  level
- direct path targets such as `"/services?ref=nav#contact"`
- named targets such as `{ name, params, query, hash }`
- router options including `outlet`, optional `root`, optional `document`,
  optional `window`, optional `basePath`, optional `routeChangeEventName`,
  optional `scrollBehavior`, and active-link options such as selector,
  class/attribute names, and `shouldSetActiveState`

## Outputs

- normalized href strings through `toHref`
- normalized app paths through `fromLocationPathname`
- immutable `ResolvedRoute` objects through `resolveRoute`,
  `resolveRouteByName`, and router instance helpers
- router lifecycle control through `init()` and `destroy()`
- normalized active-path reads through `router.getCurrentPath()`
- DOM side effects through `KoppajsRouter`, including outlet rendering,
  document title and description updates, active-link updates, route-change
  events, and scroll behavior
- publishable ESM build artifacts in `dist/`, with package manifest entrypoints
  expected to resolve to that output

## Behavior

- The runtime compiles the consumer-provided route table into an immutable route
  registry that supports flat and nested route definitions.
- Route resolution accepts either a direct path target or a named target,
  normalizes params/query/hash input, and ranks matches deterministically by
  specificity.
- Redirects inherit params, query, and hash unless the redirect target replaces
  them explicitly, and redirect following stops at the configured depth limit.
- `init()` seeds an explicit numeric history-state key, attaches delegated click
  and `popstate` listeners, starts route-link observation, and renders the
  current location.
- Successful navigation updates history, outlet markup, document title,
  description metadata, active-link state, emitted route-change events, and
  scroll behavior from one resolved route object.
- `popstate` restores saved scroll positions by history-state key when
  available and otherwise falls back to anchor scrolling behavior for hashed
  routes.

## Constraints

- Route records are immutable inputs and must not be mutated.
- Flat and nested route definitions must both be supported.
- Named routes must be unique.
- Base-path handling must support both root deployment and subpath deployment.
- Static route segments must outrank dynamic `:param` segments, and dynamic
  segments must outrank wildcard `*` segments when multiple routes match the
  same path.
- Active-link matching is based on normalized route path only.
- Redirect resolution must stop with an error if it exceeds the redirect-depth
  limit.
- Unmatched paths must not silently fall back to the first route. They must
  either resolve through an explicit `*` catch-all route or throw a clear
  error.
- The published package is ESM-only. Standard `import` is part of the contract;
  CommonJS `require()` compatibility is not.
- `KoppajsRouter` may only render a final route that provides `componentTag`,
  `title`, and `description`.

## Edge Cases

- Empty or missing paths normalize to `/`.
- Empty hashes normalize to an empty string.
- Query values may be strings or repeated keys represented as string arrays.
- Named-route params are stringified before interpolation.
- Redirects inherit params, query, and hash unless the redirect target replaces
  them explicitly.
- Browser paths equal to the base path root must map back to `/`.
- Catch-all `*` routes match only after more specific static and dynamic routes
  at the same nesting depth have been considered.
- Catch-all `*` routes preserve the unmatched browser path in the resolved
  route's `path` and `fullPath`.
- Late-added route links must still receive correct active-state updates.
- Delegated navigation only intercepts matching route links for same-window,
  primary-button clicks without modifier keys or downloads.
- `popstate` should restore saved scroll positions when possible and otherwise
  fall back to hash-anchor scrolling.

## Acceptance Criteria

- `toHref` and `fromLocationPathname` correctly translate root and subpath URLs.
- Route resolution works for flat, nested, named, parameterized, and redirected
  routes.
- Static routes beat dynamic routes, and dynamic routes beat `*` catch-all
  routes, even when the consumer declares them in the opposite order.
- Resolved routes expose normalized `path`, `pattern`, `fullPath`, `params`,
  `query`, `hash`, and `record`.
- Unmatched paths throw a clear error unless a matching `*` catch-all route is
  present.
- Navigation updates history, outlet content, metadata, active links, and the
  emitted route-change payload.
- Custom event-name and scroll-behavior options affect runtime behavior without
  changing route resolution.
- Custom active-link selector, class, and attribute options affect link syncing
  without changing route resolution.
- Excluded links do not receive active-state attributes.
- Anchor navigation and history traversal produce the documented scroll
  behavior.
- A tarball produced from the package can be installed into a clean temporary
  consumer and imported through the published ESM entrypoint.
