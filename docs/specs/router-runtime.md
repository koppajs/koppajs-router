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
  class/attribute names, `shouldSetActiveState`, and `isLinkActive`

## Outputs

- normalized href strings through `toHref`
- normalized app paths through `fromLocationPathname`
- immutable `ResolvedRoute` objects through `resolveRoute`,
  `resolveRouteByName`, and router instance helpers
- router lifecycle control through `init()` and `destroy()`
- per-instance synchronous navigation hooks through `onBeforeNavigate()` and
  `onAfterNavigate()`, each returning an idempotent unsubscribe function
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
- `init()` seeds an explicit numeric history-state key, attaches delegated
  click, `popstate`, and `pagehide` listeners, starts route-link observation,
  switches history scroll restoration to manual, and renders the current
  location.
- Successful navigation updates history, outlet markup, document title,
  description metadata, active-link state, emitted route-change events, and
  scroll behavior from one resolved route object.
- Before hooks receive a read-only context with `from` (previous resolved route
  or `null`), the final `to` route after redirects, and reason `navigate`. They
  run only on imperative navigation, including intercepted links, after
  resolution and renderability validation but before scroll snapshot or history
  writes. In registration order, only `false` cancels; `void` permits navigation.
  Cancellation leaves URL/history state, outlet, metadata, active links, route
  event, and scroll untouched. An intercepted click does not fall back to native
  navigation; `navigate()` and `navigateByName()` still return `void`.
- After hooks receive the same routes and a reason of `load`, `navigate`, or
  `popstate`. They run after the existing route-change event on successful
  rendering but before deferred scroll work. Startup and browser traversal have
  no cancellable before phase because the browser location has already changed.
  Pure resolution and href helpers do not dispatch hooks.
- Hook callbacks are synchronous. Promise-like results are errors, not pending
  decisions. Before errors propagate without navigation side effects; after
  errors propagate after the route and event are committed, stop subsequent
  hooks for that dispatch, and never roll back navigation. A newly registered
  hook joins the next dispatch, while unsubscribe takes effect immediately and
  is idempotent. Nested navigation inside a hook throws before the nested
  attempt has side effects; event-listener navigation can supersede an older
  route's pending after dispatch. `destroy()` clears all hooks; a later
  `init()` requires registering them again.
- Scroll positions are tracked by router history key in memory and persisted on
  the active browser history entry so restoration can survive a reload or new
  router runtime instance.
- Startup restores a persisted scroll position from the current history entry
  instantly when one exists, bypassing document-level CSS smooth scrolling;
  the instant restore is retried for a short post-render window so asynchronous
  route layout can grow the scroll range before hashed startup routes fall back
  to anchor scrolling.
- `popstate` restores saved scroll positions from the in-memory cache or the
  target entry's persisted history state instantly when available, retrying
  briefly across post-render layout growth, and otherwise falls back to anchor
  scrolling behavior for hashed routes.

## Constraints

- Route records are immutable inputs and must not be mutated. Hooks observe
  resolved routes without rewriting them or their records; this does not
  introduce deep freezing.
- Flat and nested route definitions must both be supported.
- Named routes must be unique.
- Base-path handling must support both root deployment and subpath deployment.
- Static route segments must outrank dynamic `:param` segments, and dynamic
  segments must outrank wildcard `*` segments when multiple routes match the
  same path.
- Without `isLinkActive`, active-link matching is based on normalized route path
  only (query and hash are ignored). With `isLinkActive(link, currentRoute)`, its
  synchronous boolean result replaces path matching. The callback observes the
  current read-only resolved route, including metadata, query, and hash, on every
  synchronous and mutation-triggered sync. `shouldSetActiveState` takes priority:
  excluded links are cleared without invoking the matcher. Matching must be
  side-effect free; it does not change navigation or route resolution.
- `setActiveRouteLinks` accepts either the legacy path string for default matching
  or a resolved route for custom matching. A custom matcher requires a resolved
  route; supplying only a path with a matcher throws a clear error.
- Route-change events and after hooks run after synchronous link synchronization,
  not after all future DOM mutations. Added or removed route links schedule a
  microtask that re-evaluates all selected links using the latest committed route
  and the same matching rule. Attribute-only changes and native hash changes do
  not trigger this observer; custom matching is not scrollspy.
- `destroy()` invalidates queued active-link microtasks as well as disconnecting
  the observer. A subsequent `init()` starts a fresh synchronization lifecycle;
  old work must neither mutate links nor clear a new lifecycle's pending sync.
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
- `popstate` should restore saved scroll positions from memory or persisted
  target history state instantly when possible, tolerate short async layout
  stabilization windows, and otherwise fall back to hash-anchor scrolling.
- New router-created history entries must not inherit a previous entry's
  persisted scroll position.

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
- Excluded links do not receive active-state attributes or invoke custom matching.
- Custom matching replaces rather than augments path matching and receives the
  current typed resolved route on load, navigation, history traversal, and link
  mutations. Default matching remains path-only.
- Queued link synchronization is invalidated on teardown and remains usable
  after reinitialization; later route changes supersede queued route context.
- Anchor navigation, persisted history traversal, and fresh link navigation
  produce the documented scroll behavior.
- Hook ordering, cancellation, unsubscribe, teardown, error boundaries,
  redirected targets, and load/popstate observation are verified without
  changing navigation for consumers that do not register hooks.
- A tarball produced from the package can be installed into a clean temporary
  consumer and imported through the published ESM entrypoint.
