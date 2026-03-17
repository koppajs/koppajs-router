# Contributing

Work on `@koppajs/koppajs-router` like on a small standalone module with a
living meta layer.

## Read Order

1. [`DECISION_HIERARCHY.md`](./DECISION_HIERARCHY.md)
2. Relevant spec in [`docs/specs/`](./docs/specs/)
3. [`AI_CONSTITUTION.md`](./AI_CONSTITUTION.md)
4. [`ARCHITECTURE.md`](./ARCHITECTURE.md)
5. [`DEVELOPMENT_RULES.md`](./DEVELOPMENT_RULES.md)
6. [`TESTING_STRATEGY.md`](./TESTING_STRATEGY.md)
7. [`README.md`](./README.md)

## Expected Workflow

1. Confirm whether the change needs a spec or ADR.
2. Add or update tests for the intended behavior.
3. Implement the change using existing router patterns where possible.
4. Update docs in the same change, especially when public behavior or
   architecture shifts.
5. Run the required verification commands.

## Required Commands

```bash
pnpm run lint
pnpm run typecheck
pnpm run test:unit
pnpm run build
pnpm run check:package
pnpm run check
```

## Contribution Rules

- Keep the public API generic and route-config driven.
- Do not move app-specific route content or copy into the package.
- Do not change base-path behavior or active-link semantics without tests and a
  spec update.
- Record architectural decisions instead of leaving them implicit.
