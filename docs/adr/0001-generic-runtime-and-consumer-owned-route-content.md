# ADR-0001: Keep The Router Runtime Generic And Consumer-Owned Content Outside

## Status

Accepted

## Context

`@koppajs/koppajs-router` exists to hold reusable browser-routing behavior for
KoppaJS-style applications. The package was extracted from an application-owned
router and now has to resist scope creep: route copy, page registration,
analytics hooks, and other business-specific concerns naturally appear near
navigation code, but they reduce reuse and make the package harder to evolve.

The implementation already reflects a clear boundary. The package resolves
routes, drives History API navigation, renders component tags into an outlet,
updates document metadata, synchronizes active links, and manages scroll
behavior. Consumers still provide the route table, register custom elements,
own their copy and metadata values, and decide how to react to route-change
events.

## Decision

The package will remain a generic, route-config-driven router runtime.

Specifically:

- reusable router logic stays inside this package
- route content and business copy stay in the consumer
- component registration stays in the consumer
- app-specific active-link exclusions stay in the consumer, exposed through
  hooks like `shouldSetActiveState`
- public API evolution should favor generic helpers and runtime options rather
  than application-specific behavior

## Consequences

This keeps the package reusable, easier to document, and easier to test in
isolation. It also gives the meta layer a stable boundary to enforce across
architecture docs, specs, and contribution rules.

The tradeoff is that some convenience behavior must remain outside the package.
Consumers need to provide complete route metadata for renderable routes and
register any elements referenced by `componentTag`.

Changes that push business logic, application copy, or framework-specific page
composition into this package now count as architectural changes and should be
treated with a high bar.

## Alternatives considered

- Keep application-specific route content inside the package:
  rejected because it weakens reuse and makes the package couple to a single
  consumer.
- Provide framework- or app-specific behavior directly in the core runtime:
  rejected because the current package is intentionally browser-native and
  framework-agnostic.
