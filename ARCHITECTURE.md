# Architecture

`@koppajs/koppajs-router` is a framework-agnostic browser router runtime for
KoppaJS-style applications. The package owns URL normalization, route
resolution, History API navigation, DOM outlet rendering, metadata updates,
active-link synchronization, and scroll handling. The consuming application
owns the route table content, custom elements, page copy, analytics, and any
business-specific navigation rules.

## System Overview

The current implementation lives in [`src/index.ts`](./src/index.ts) but has
four logical layers:

1. Public contract: exported route types, router options, helper constants, and
   pure helper functions such as `normalizePath`, `toHref`, and `resolveRoute`.
2. Route registry and resolution engine: matcher compilation, nested route
   flattening, param interpolation, redirect following, and immutable
   `ResolvedRoute` creation.
3. DOM synchronization helpers: document description updates, route-link active
   state synchronization, deferred paint waiting, and anchor lookup.
4. Runtime orchestration: `KoppajsRouter`, which wires browser events, history
   state, rendering, route-change events, and scroll restoration together.

This layering is intentional. Pure resolution logic must stay reusable and
testable without the router class, while browser side effects remain explicit at
the runtime boundary.

## Runtime Configuration Surface

The router accepts more than just routes and an outlet. The current runtime
configuration surface also includes:

- optional `root`, `document`, and `window` seams for browser integration
- optional `basePath` translation for subpath deployments
- optional `routeChangeEventName` to override the default emitted browser event
- optional `scrollBehavior` for non-anchor forward navigation
- optional active-link controls such as `linkSelector`, `activeClassName`,
  `activeAttributeName`, and `shouldSetActiveState`

These options are part of the public runtime contract and must stay documented
when they change.

## Responsibilities And Boundaries

The package is responsible for:

- normalizing paths, hashes, query strings, and base paths
- resolving direct-path and named-route targets against flat or nested route
  definitions
- preserving route-record immutability by returning derived resolved-route
  state instead of mutating the input route table
- translating between app paths and browser hrefs beneath an optional base path
- rendering the final route element into an outlet and updating document title
  and description
- synchronizing active route links through one shared helper path
- dispatching route-change events and managing scroll/anchor behavior

The consumer is responsible for:

- defining route records, metadata, redirects, and component tags
- registering the custom elements referenced by `componentTag`
- deciding how to react to route-change events
- enforcing application-specific link exclusion rules via
  `shouldSetActiveState`
- providing any browser-level integration tests that depend on a real app shell

## Runtime Flow

At startup:

1. The consumer creates `KoppajsRouter` with a route table, outlet, and
   optional browser dependencies.
2. The router builds a route registry once from the provided route definitions.
3. `init()` attaches `popstate` and delegated click listeners, starts a
   mutation observer for late-rendered route links, ensures a router-specific
   history key, switches history scroll restoration to manual, and renders the
   current location.

On navigation:

1. The router resolves either a direct path or named route target into a
   `ResolvedRoute`.
2. The resolved route is converted into a base-path-aware browser href.
3. History state is pushed or replaced with a fresh router key.
4. The outlet is re-rendered with the route's `componentTag`.
5. Document title, description, active links, and the route-change event are
   updated.
6. After two paints, the router applies either top scrolling, anchor
   scrolling, or saved-history scroll restoration.

On browser history traversal:

1. The router snapshots the old scroll position.
2. The incoming history key is read from `event.state`.
3. The current location is resolved again from `window.location`.
4. Saved scroll is restored when available; otherwise the hash anchor is used.

On teardown:

1. `destroy()` removes event listeners and disconnects the mutation observer.
2. The router restores the browser's previous `history.scrollRestoration`
   setting.

## Important Abstractions

- `RouteDefinition<TMeta>` is the immutable consumer-provided route config.
- `RouteRegistry` is the compiled lookup structure for matching and named-route
  resolution.
- `ResolvedRoute` is the runtime-facing navigation state. It always contains
  normalized `path`, `pattern`, `fullPath`, `params`, `query`, `hash`, and the
  original `record`.
- `RedirectedRoute` preserves where a redirect started so consumers can inspect
  the source route after the redirect has been followed.
- `RouteTarget` keeps navigation ergonomic by allowing either a direct path
  string or a named target object.

## Invariants

- The router remains History API based.
- Base-path translation must work for root deployments and subpath deployments.
- Active links are matched by normalized route path only, not by query or hash.
- Route records are input data and must never be mutated during matching or
  navigation.
- Redirect resolution is bounded by `MAX_REDIRECT_DEPTH` to prevent loops.
- `KoppajsRouter` can only render a final route that defines `title`,
  `description`, and `componentTag`.
- Browser-only side effects stay inside runtime methods or DOM helper
  functions; pure route resolution stays side-effect free.
- The package remains generic and contains no website-specific route content.

## Module Boundaries

Detailed logical boundaries inside the current single-file implementation live
in [docs/architecture/module-boundaries.md](./docs/architecture/module-boundaries.md).
If the package is split into multiple source files later, that document should
be updated in the same change.

## Packaging And Entrypoints

The repository currently builds `dist/` through `tsc -p tsconfig.build.json`,
and the published package manifest points `main`, `module`, `types`, and the
primary `exports` entry at `dist/`. That means `dist/` is the canonical
distribution contract, while [`src/index.ts`](./src/index.ts) remains the
authoring source inside the repository.

The `check:package` script validates that the manifest and build output stay in
sync. If the package's distribution strategy changes again, update this file,
`README.md`, and any affected decision records in the same change.

## Change Triggers

Update this file whenever any of the following change:

- the exported router lifecycle or major helper responsibilities
- the package boundary between runtime logic and consumer-owned content
- the render path, scroll model, or route-resolution algorithm
- the logical module split inside `src/index.ts`
