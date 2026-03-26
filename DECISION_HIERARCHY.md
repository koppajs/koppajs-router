# Decision Hierarchy

When project documents disagree, resolve the conflict in this order:

1. Approved specs in [`docs/specs/`](./docs/specs/)
2. Accepted ADRs in [`docs/adr/`](./docs/adr/) and any explicitly adopted
   external ADRs listed in [`DECISIONS.md`](./DECISIONS.md)
3. [`AI_CONSTITUTION.md`](./AI_CONSTITUTION.md)
4. [`ARCHITECTURE.md`](./ARCHITECTURE.md) and
   [`docs/architecture/`](./docs/architecture/)
5. [`DEVELOPMENT_RULES.md`](./DEVELOPMENT_RULES.md)
6. [`TESTING_STRATEGY.md`](./TESTING_STRATEGY.md) and
   [`docs/quality/`](./docs/quality/)
7. [`AGENTS.md`](./AGENTS.md) for package-local agent workflow details
8. [`CONTRIBUTING.md`](./CONTRIBUTING.md)
9. [`RELEASE.md`](./RELEASE.md) for release and publish process details
10. [`README.md`](./README.md) and examples

## Conflict Resolution Notes

- Higher-priority documents may narrow or clarify lower-priority documents.
- Lower-priority documents must not silently override higher-priority rules.
- If a needed rule is missing, add it to the highest sensible layer instead of
  repeating it across multiple files.
- When a substantial change affects multiple layers, update all impacted files
  in one change so the hierarchy remains coherent.
