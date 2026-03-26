<a id="readme-top"></a>

<div align="center">
  <img src="https://public-assets-1b57ca06-687a-4142-a525-0635f7649a5c.s3.eu-central-1.amazonaws.com/koppajs/koppajs-logo-text-900x226.png" width="500" alt="KoppaJS Logo">
</div>

<br>

<div align="center">
  <a href="https://www.npmjs.com/package/@koppajs/koppajs-router"><img src="https://img.shields.io/npm/v/@koppajs/koppajs-router?style=flat-square" alt="npm version"></a>
  <a href="https://github.com/koppajs/koppajs-router/actions"><img src="https://img.shields.io/github/actions/workflow/status/koppajs/koppajs-router/ci.yml?branch=main&style=flat-square" alt="CI Status"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue?style=flat-square" alt="License"></a>
</div>

<br>

<div align="center">
  <h1 align="center">@koppajs/koppajs-router</h1>
  <h3 align="center">Official browser router runtime for KoppaJS applications</h3>
  <p align="center">
    <i>History API routing with explicit contracts, deterministic matching, and no framework lock-in.</i>
  </p>
</div>

<br>

<div align="center">
  <p align="center">
    <a href="https://github.com/koppajs/koppajs-documentation">Documentation</a>
    &middot;
    <a href="https://github.com/koppajs/koppajs-core">KoppaJS Core</a>
    &middot;
    <a href="https://github.com/koppajs/koppajs-example">Example Project</a>
    &middot;
    <a href="https://github.com/koppajs/koppajs-router/issues">Issues</a>
  </p>
</div>

<br>

<details>
<summary>Table of Contents</summary>
  <ol>
    <li><a href="#what-is-this-router">What is this router?</a></li>
    <li><a href="#features">Features</a></li>
    <li><a href="#installation">Installation</a></li>
    <li><a href="#requirements">Requirements</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#runtime-behavior">Runtime Behavior</a></li>
    <li><a href="#router-configuration">Router Configuration</a></li>
    <li><a href="#route-matching-rules">Route Matching Rules</a></li>
    <li><a href="#build--distribution">Build & Distribution</a></li>
    <li><a href="#architecture--governance">Architecture & Governance</a></li>
    <li><a href="#community--contribution">Community & Contribution</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details>

---

## What is this router?

`@koppajs/koppajs-router` is the official reusable browser router runtime for
KoppaJS-style applications.

It extracts routing out of the website root and keeps the package boundary
deliberately narrow:

- the package owns URL normalization, route resolution, History API navigation,
  outlet rendering, metadata updates, active-link synchronization, and scroll
  behavior
- the consuming app still owns the route table content, custom element
  registration, page copy, and any business-specific navigation rules

The published package is ESM-only. Use standard `import` syntax, not
`require()`.

`KoppajsRouter` itself is a browser runtime built around the DOM and History
API. Pure helpers such as `resolveRoute()`, `toHref()`, and
`fromLocationPathname()` remain usable in non-browser ESM contexts.

---

## Features

- base-path-aware href translation and path normalization
- flat and nested route-record resolution
- deterministic route matching priority: static segments before dynamic params
  before `*` catch-all routes
- named routes, params, redirects, query strings, and hashes
- History API navigation with explicit unmatched-path handling
- DOM outlet rendering, document title updates, and meta description updates
- active route-link synchronization through `data-route` or `href`
- route-change event emission and scroll restoration behavior
- browser seams for testing via injectable `document`, `window`, and `root`

---

## Installation

```bash
pnpm add @koppajs/koppajs-router
```

```bash
npm install @koppajs/koppajs-router
```

To use the runtime in an application, make sure:

- your app runs in a browser environment with the DOM and History API
- the custom elements referenced by `componentTag` are registered by the
  consumer
- your route table provides `title`, `description`, and `componentTag` for
  every final renderable route

---

## Requirements

For package consumers:

- a browser environment with the DOM and History API
- an ESM-capable build or runtime environment
- consumer-owned custom element registration for all referenced
  `componentTag` values

For local repository work:

- Node.js >= 20
- pnpm >= 10.17.1

---

## Usage

```ts
import { KoppajsRouter, type RouteDefinition } from "@koppajs/koppajs-router";

const routes = [
  {
    path: "/",
    name: "home",
    title: "Home",
    description: "Landing page",
    componentTag: "home-page",
  },
  {
    path: "/services",
    name: "services",
    title: "Services",
    description: "Services overview",
    componentTag: "services-page",
    children: [
      {
        path: ":slug",
        name: "service-detail",
        title: "Service detail",
        description: "Service detail page",
        componentTag: "service-detail-page",
      },
    ],
  },
  {
    path: "/guides",
    name: "guides",
    redirectTo: {
      name: "guides-introduction",
    },
    children: [
      {
        path: "introduction",
        name: "guides-introduction",
        title: "Introduction",
        description: "Guide introduction",
        componentTag: "guides-introduction-page",
      },
    ],
  },
  {
    path: "*",
    name: "not-found",
    title: "Not found",
    description: "Missing page",
    componentTag: "not-found-page",
  },
] satisfies readonly RouteDefinition[];

const outlet = document.querySelector<HTMLElement>("#app-outlet");

if (!outlet) {
  throw new Error("App outlet not found.");
}

const router = new KoppajsRouter({
  routes,
  outlet,
  root: document,
  basePath: import.meta.env.BASE_URL,
  shouldSetActiveState: (link) => !link.classList.contains("nav-link--cta"),
});

router.init();

router.navigate({
  name: "service-detail",
  params: { slug: "accessibility-audit" },
  query: { ref: "nav" },
  hash: "contact-entry",
});
```

Public API highlights:

- `KoppajsRouter`: class-based router runtime
- `normalizePath()`, `normalizeHash()`, `normalizeBasePath()`
- `toHref()` and `fromLocationPathname()`
- `resolveRoute()` and `resolveRouteByName()`
- `router.resolve()` / `router.resolveByName()`
- `router.navigate()` / `router.navigateByName()`
- `router.hrefFor()`
- `router.getCurrentPath()` / `router.getCurrentRoute()`
- `setActiveRouteLinks()` and `setDocumentDescription()`
- `DEFAULT_ROUTE_LINK_SELECTOR`
- `DEFAULT_ROUTE_CHANGE_EVENT_NAME`
- `KOPPAJS_ROUTE_CHANGE_EVENT`

---

## Runtime Behavior

At startup:

- the router builds a route registry from the provided route definitions
- `init()` attaches delegated navigation and `popstate` listeners
- the current browser location is resolved and rendered into the outlet

On navigation:

- a direct path or named target is resolved into a normalized `ResolvedRoute`
- the browser URL is translated through the configured `basePath`
- history state, outlet content, document metadata, active links, and the
  route-change event are updated together
- scroll behavior is applied after render, including anchor navigation and
  saved-history restoration

Important constraints:

- unmatched paths do not silently fall back to the first route
- redirect resolution is bounded to prevent loops
- final rendered routes must provide `title`, `description`, and
  `componentTag`

---

## Router Configuration

Runtime configuration highlights:

- `basePath`: translate app paths beneath a subpath deployment such as
  `/preview/`
- `root`, `document`, `window`: inject browser seams for testing or custom host
  environments
- `routeChangeEventName`: override the emitted browser event name
- `scrollBehavior`: control default forward-navigation scroll behavior
- `linkSelector`, `activeClassName`, `activeAttributeName`,
  `shouldSetActiveState`: customize active-link synchronization

Consumer-side expectations:

- declare a `path: "*"` route if unmatched paths should render a not-found page
- keep route names unique when using named navigation
- use `data-route` on links when you want delegated navigation and active-state
  handling without relying on plain `href`

---

## Route Matching Rules

- static path segments win over dynamic `:param` segments, even if the dynamic
  route appears earlier in the route table
- dynamic `:param` segments win over `*` catch-all routes
- unmatched paths throw a clear error unless a matching `path: "*"` route is
  present
- catch-all routes preserve the unmatched browser path in the resolved route's
  `path` and `fullPath`
- active links are matched by normalized route path only, not by query or hash

---

## Build & Distribution

- source code lives in `src/`
- `pnpm run build` emits the publishable library to `dist/`
- the package manifest exports `dist/index.js` and `dist/index.d.ts`
- the published package is ESM-only and is intended to be consumed through
  `import`
- when consuming this repository directly instead of a published package, build
  first so `dist/` exists
- `pnpm run check:package` verifies that manifest entrypoints and build output
  stay aligned
- `pnpm run test:package` packs the tarball, installs it into a clean temporary
  consumer, and imports the published entrypoint

Local verification commands:

```bash
pnpm install
pnpm run typecheck
pnpm run lint
pnpm run test:unit
pnpm run test:ci
pnpm run check:package
pnpm run build
pnpm run test:package
pnpm run check
```

---

## Architecture & Governance

This package keeps its architecture memory and governance in the repository.

Start here:

- `META_LAYER.md` for the index
- `DECISION_HIERARCHY.md` for precedence rules
- `AI_CONSTITUTION.md` for collaboration and AI workflow rules
- `ARCHITECTURE.md` plus `docs/architecture/` for system structure
- `DEVELOPMENT_RULES.md` for implementation constraints
- `TESTING_STRATEGY.md` plus `docs/quality/` for verification policy
- `RELEASE.md` for the tag-driven release workflow
- `docs/specs/` for behavior specs
- `docs/adr/` for architecture decision records

---

## Community & Contribution

Issues and pull requests are welcome:

https://github.com/koppajs/koppajs-router/issues

Please keep contributions focused on:

- stable public routing behavior
- preserving the documented base-path and active-link contracts
- keeping the runtime generic and free of application-specific page logic

---

## License

Apache-2.0 - Copyright 2026 KoppaJS, Bastian Bensch
