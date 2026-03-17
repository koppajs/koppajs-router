# Meta Layer

This file is the entry point into the repository's meta layer. The goal is to
keep the router's architecture memory, quality rules, decision history, and AI
workflow aligned with the actual package.

## Core Documents

- [`DECISION_HIERARCHY.md`](./DECISION_HIERARCHY.md)
- [`AI_CONSTITUTION.md`](./AI_CONSTITUTION.md)
- [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- [`DEVELOPMENT_RULES.md`](./DEVELOPMENT_RULES.md)
- [`TESTING_STRATEGY.md`](./TESTING_STRATEGY.md)
- [`RELEASE.md`](./RELEASE.md)
- [`DECISIONS.md`](./DECISIONS.md)
- [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- [`ROADMAP.md`](./ROADMAP.md)

## Supporting Directories

- [`docs/meta/`](./docs/meta/)
- [`docs/architecture/`](./docs/architecture/)
- [`docs/adr/`](./docs/adr/)
- [`docs/specs/`](./docs/specs/)
- [`docs/quality/`](./docs/quality/)

## Maintenance Contract

Whenever architecture, module boundaries, workflow, or public behavior changes,
update the affected meta-layer documents in the same change. The meta layer is
part of the product surface for this repository and should be reviewed like
code.
