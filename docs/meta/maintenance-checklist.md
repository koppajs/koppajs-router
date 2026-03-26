# Meta-Layer Maintenance Checklist

Use this checklist whenever the repository changes.

## Update Triggers

- New public export or changed public API:
  update `README.md`, `docs/specs/`, tests, and possibly `docs/adr/`.
- New routing behavior or edge case:
  update `docs/specs/router-runtime.md`, tests, and `ARCHITECTURE.md` if the
  flow changed.
- New architectural pattern or module split:
  update `ARCHITECTURE.md`, `docs/architecture/module-boundaries.md`, and add
  an ADR if the decision is substantial.
- New coding convention or dependency rule:
  update `DEVELOPMENT_RULES.md`.
- New package entrypoint, build-output, or distribution behavior:
  update `ARCHITECTURE.md`, `README.md`, and `DECISIONS.md` or `docs/adr/` if
  the change is architectural.
- New local hook automation:
  document why it exists, keep it fast, and mirror the policy in
  `docs/quality/README.md`.
- New release workflow, npm publish rule, or versioning convention:
  update `RELEASE.md`, `.github/workflows/`, and the affected root docs.
- New quality gate, test level, or verification expectation:
  update `TESTING_STRATEGY.md` and `docs/quality/README.md`.
- New collaboration workflow for AI or developers:
  update `AI_CONSTITUTION.md`, `AGENTS.md`, and `CONTRIBUTING.md`.

## Periodic Audit Prompts

When this repository is re-audited, verify:

- the documented module boundaries still match `src/`
- the documented quality gates still match `package.json` and `vitest.config.ts`
- the specs still describe the observable router behavior
- ADRs still explain the biggest architecture-level decisions
