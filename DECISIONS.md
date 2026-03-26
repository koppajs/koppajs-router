# Decisions

This file is the decision index for `@koppajs/koppajs-router`. It points to
accepted package-local ADRs, records standing decisions, and notes when the
package adopts decisions from a broader KoppaJS workspace.

## Standing Decisions

- The package remains a generic, route-config-driven router runtime.
- Route content, application copy, and page registration stay in the consumer.
- Base-path handling and active-link synchronization are regression-sensitive
  contracts.
- The published package stays ESM-only, and release candidates must pass a
  tarball-based consumer smoke check.
- Public API changes require tests, documentation updates, and usually a spec
  update.
- Package governance stays thin: only package-local decisions belong here,
  while externally governed decisions should be referenced rather than copied.

## Package-Local ADR Index

| ADR                                                                             | Topic                    | Why it matters                                                                                                     |
| ------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| [ADR-0001](./docs/adr/0001-generic-runtime-and-consumer-owned-route-content.md) | Generic runtime boundary | Captures the package's core responsibility split between reusable router runtime and consumer-owned route content. |

## Adopted External Decisions

If this repository is consumed inside a larger KoppaJS workspace, record any
adopted upstream ADRs here with a short note about why they matter to this
package. Keep this section as a thin reference layer instead of duplicating the
external ADR text.

## When To Add An ADR

Create a package-local ADR when a change affects:

- public API shape or compatibility strategy
- source-file/module boundaries at architectural scale
- runtime dependencies or platform support
- the router lifecycle, rendering model, or decision-making workflow
