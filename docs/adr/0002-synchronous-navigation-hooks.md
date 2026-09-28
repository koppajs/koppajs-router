# ADR-0002: Synchronous Per-Instance Navigation Hooks

## Status

Accepted

## Context

The router resolves final routes before imperative History API writes, then
renders and emits a route-change event. Consumers need a generic point to reject
imperative navigation and a typed way to observe completed rendering. On initial
load and `popstate`, the browser has already selected the location; reversing
history to simulate cancellation would threaten scroll and history correctness.
Route content and business rules remain consumer-owned under
[ADR-0001](./0001-generic-runtime-and-consumer-owned-route-content.md).

## Decision

Add per-router `onBeforeNavigate` and `onAfterNavigate` registrations returning
idempotent unsubscribe functions. Before runs synchronously after final
resolution and renderability validation but before scroll/history writes on
imperative navigation only. Only `false` cancels. After runs after the existing
route-change event on successful load, imperative navigation, and browser
traversal but before deferred scrolling. Contexts expose read-only previous and
final routes; hooks cannot rewrite destinations. Registrations run in order and
are cleared by `destroy()`.

Keep `navigate*()` returning `void` and preserve the existing event payload.
Promise-like results are errors rather than implicit approval. Before errors
leave navigation uncommitted; after errors cannot undo a committed route. Nested
navigation from a hook is rejected before new side effects. Navigation from an
existing route-change event can supersede the older route's after dispatch.

## Consequences

Consumers can supply their own synchronous policies and post-render observers
without app-specific runtime code or new dependencies. Existing consumers need
no migration. Initial load and back/forward cannot be canceled through these
hooks; asynchronous authorization would require a separate future contract.
Tests must cover ordering, cancellation before side effects, teardown,
reentrancy, redirects, event compatibility, browser seams, and package exports.

## Alternatives considered

- A cancelable DOM event: rejected because it conflates notification with
  navigation control and is less direct for typed per-instance subscriptions.
- Async guards or reversible `popstate`: rejected because they change the
  synchronous `void` API and browser history/scroll timing.
- Route-record or component hooks: rejected because application behavior and
  component lifecycles do not belong in the generic router.
