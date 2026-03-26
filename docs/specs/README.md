# Specifications

Specs define observable behavior before or alongside implementation.

## When A Spec Is Required

Create or update a spec when a change affects:

- public API behavior
- routing semantics
- rendering or navigation lifecycle
- consumer-visible constraints or error handling

Small internal refactors that do not change behavior may only need tests and
architecture documentation updates.

## Spec Template

Each spec should cover:

- description
- inputs
- outputs
- behavior
- constraints
- edge cases
- acceptance criteria
- `evolution_phase`
- `completeness_level`
- `known_gaps`
- `deferred_complexity`
- `technical_debt_items`

## Workflow

- Start with a spec for substantial changes.
- Keep specs implementation-aware enough to be useful, but behavior-focused
  enough to survive refactors.
- Update or supersede specs when the behavior changes.
