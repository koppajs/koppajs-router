# Module Boundaries

Although the package currently exports everything from a single file, the code
already has stable logical boundaries.

## Logical Modules Inside `src/index.ts`

### Public Contract

- exported types such as `RouteDefinition`, `ResolvedRoute`, and router option
  types
- exported helpers such as `normalizePath`, `toHref`, `resolveRoute`, and
  `setActiveRouteLinks`
- exported runtime surface `KoppajsRouter`

Allowed dependencies:

- TypeScript types
- pure helper functions
- browser APIs only when the export is explicitly about DOM behavior

### Route Registry And Resolution

- route matcher compilation
- nested route flattening
- named-route lookup
- param interpolation
- redirect resolution
- immutable resolved-route construction

Allowed dependencies:

- path, hash, and query normalization helpers
- no direct DOM writes

### DOM Synchronization Helpers

- document description updates
- route-link active state synchronization
- next-paint scheduling
- anchor lookup

Allowed dependencies:

- DOM APIs
- already resolved route state

### Runtime Orchestration

- browser event wiring
- history state and scroll-position bookkeeping
- outlet rendering
- route-change event dispatch
- `init()` and `destroy()` lifecycle management

Allowed dependencies:

- all lower logical layers
- browser APIs through `document` and `window` seams

## Boundary Rules

- Pure routing logic must not depend on outlet rendering.
- Active-link behavior must continue to flow through `setActiveRouteLinks`.
- Browser history and scroll behavior must remain in the router runtime, not in
  route-resolution helpers.
- If source files are split later, preserve these boundaries instead of moving
  logic arbitrarily.
