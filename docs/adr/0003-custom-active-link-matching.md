# ADR-0003: Consumer-owned active-link matching

## Status

Accepted

## Context

The router rechecks all selected links after additions and removals so late
rendered navigation stays consistent. Consumer class overrides in after hooks
can therefore be overwritten later. A timeout cannot establish a stable final
synchronization boundary.

## Decision

Add optional synchronous `isLinkActive(link, currentRoute)` to the typed active
link options. Its boolean result replaces path matching for eligible links;
omitting it preserves the existing normalized path comparison. The existing
`shouldSetActiveState` gate still clears excluded links before matching.

Keep DOM writes centralized in `setActiveRouteLinks`. Extend that helper to
accept resolved route state while retaining its existing path-string calls for
default matching. Custom matching requires the resolved-route context.

Both render-time and deferred mutation syncing use the same helper and rule.
Deferred work reads the latest committed route. Teardown invalidates queued
link work through a lifecycle generation, without allowing stale work to reset
new lifecycle scheduling state.

## Consequences

Applications can express hash, query, metadata, or navigation-section rules
without racing the router's DOM updates. Default consumers need no migration.
Matchers must be side-effect free and must not mutate the observed route.

This does not add scrollspy, native hash-change observation, attribute-change
observation, async matching, or a final DOM-settled navigation hook.

## Alternatives considered

- Delaying consumer class overrides: later DOM changes can overwrite them again.
- Changing the default to hash or prefix matching: would change existing
  consumers' active-state semantics.
- A second consumer-managed DOM synchronization path: would duplicate router
  ownership instead of supplying a consistent matching rule.
