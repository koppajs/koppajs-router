# Changelog

All notable changes to `@koppajs/koppajs-router` will be tracked here.

## Unreleased

## 0.1.0

- initial workspace extraction of the reusable KoppaJS router runtime
- deterministic route resolution for flat and nested route definitions,
  including named routes, params, redirects, and explicit wildcard not-found
  handling
- base-path-aware browser routing with outlet rendering, metadata updates,
  active-link synchronization, route-change events, and scroll restoration
- ESM-only published package contract with `dist/` as the canonical output
- tarball-based package consumer smoke test plus package entrypoint validation
- repository-local meta layer, specs, ADR support, CI, and tag-driven release
  workflow alignment
