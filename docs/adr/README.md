# Architecture Decision Records

This directory holds package-local ADRs for decisions that are specific to
`@koppajs/koppajs-router`.

## When To Write A Local ADR

Write an ADR when a change materially affects:

- public API compatibility strategy
- architectural boundaries or source layout
- runtime dependencies or supported environments
- the router lifecycle, rendering model, or decision workflow

Do not duplicate external ADR systems unnecessarily. If a broader workspace
already owns a decision, record the adoption in `DECISIONS.md` and only add a
local ADR when this package adds package-specific consequences.

## Required ADR Structure

Every ADR must contain these sections:

- Context
- Decision
- Consequences
- Alternatives considered

Use [`template.md`](./template.md) as the starting point.

## Naming

- Use zero-padded numeric prefixes such as `0001-short-title.md`.
- Keep titles short and decision-focused.
- Update `DECISIONS.md` whenever you add, supersede, or retire an ADR.
