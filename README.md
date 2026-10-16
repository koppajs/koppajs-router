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
    <a href="https://github.com/koppajs/create-koppajs">create-koppajs</a>
    &middot;
    <a href="https://github.com/koppajs/koppajs-vite-plugin">Vite Plugin</a>
    &middot;
    <a href="https://github.com/koppajs/koppajs-router/issues">Issues</a>
  </p>
</div>

<br>

<details>
<summary>Table of Contents</summary>
  <ol>
    <li><a href="#purpose">Purpose</a></li>
    <li><a href="#repository-classification">Repository Classification</a></li>
    <li><a href="#installation">Installation</a></li>
    <li><a href="#public-contract">Public Contract</a></li>
    <li><a href="#ownership-boundaries">Ownership Boundaries</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#runtime-behavior">Runtime Behavior</a></li>
    <li><a href="#navigation-hooks">Navigation Hooks</a></li>
    <li><a href="#runtime-options">Runtime Options</a></li>
    <li><a href="#route-matching-rules">Route Matching Rules</a></li>
    <li><a href="#build-and-distribution">Build And Distribution</a></li>
    <li><a href="#ecosystem-fit">Ecosystem Fit</a></li>
    <li><a href="#architecture-governance">Architecture & Governance</a></li>
    <li><a href="#community-contribution">Community & Contribution</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details>

---

## Purpose

The package exists to provide a deterministic, route-config-driven router
runtime for KoppaJS-style applications.

It is intentionally narrow:

- the package owns path normalization, route matching, redirect following,
  browser history updates, outlet rendering, metadata updates, active-link
  state, and scroll restoration
- the consuming application owns route content, custom element registration,
  page copy, analytics, and business-specific navigation rules

---

## Repository Classification

- `repo_type`: reusable package
- `runtime_responsibility`: browser router runtime
- `build_time_responsibility`: TypeScript build, linting, unit tests, tarball
  smoke testing, and release validation
- `ui_surface`: none inside the package
- `maturity_level`: pre-1.0, contract-stabilizing

---

## Installation

```bash
pnpm add @koppajs/koppajs-router
```

```bash
npm install @koppajs/koppajs-router
```

Consumer requirements:

- a browser environment with the DOM and History API
- an ESM-capable runtime or bundler
- consumer-owned registration of every referenced `componentTag`
- `title`, `description`, and `componentTag` on every final renderable route

Local repository requirements:

- Node.js >= 22
- pnpm >= 10.17.1

---

## Public Contract

The public surface is deliberately small.

Main runtime surface:

- `KoppajsRouter`
- `RouteDefinition`, `ResolvedRoute`, `RedirectedRoute`, `RouteNavigationContext`,
  `RouteBeforeNavigateContext`, `RouteNavigationReason`,
  `RouteBeforeNavigateHook`, `RouteAfterNavigateHook`, and related route types
- `normalizePath()`, `normalizeHash()`, `normalizeBasePath()`
- `toHref()` and `fromLocationPathname()`
- `resolveRoute()` and `resolveRouteByName()`
- `setActiveRouteLinks()` and `setDocumentDescription()`
- `DEFAULT_ROUTE_LINK_SELECTOR`
- `DEFAULT_ROUTE_CHANGE_EVENT_NAME`
- `KOPPAJS_ROUTE_CHANGE_EVENT`

Runtime instance helpers:

- `router.resolve()` / `router.resolveByName()`
- `router.navigate()` / `router.navigateByName()`
- `router.onBeforeNavigate()` / `router.onAfterNavigate()` (each returns an
  unsubscribe function)
- `router.hrefFor()`
- `router.getCurrentPath()` / `router.getCurrentRoute()`

Contract constraints:

- flat and nested route definitions are both supported
- route names must be unique
- unmatched paths throw unless the consumer declares an explicit `path: "*"`
  route
- static segments outrank dynamic segments, and dynamic segments outrank `*`
- active-link matching defaults to path-based comparison ignoring query and hash;
  optional `isLinkActive` replaces that comparison with a consumer-owned rule
- route records are treated as immutable input data

---

## Ownership Boundaries

Package-owned concerns:

- route registry compilation and matching
- named-route resolution and param interpolation
- base-path translation between app paths and browser hrefs
- redirect following with bounded depth
- outlet rendering, title updates, description updates, and route-change events
- active-link synchronization and scroll handling

Consumer-owned concerns:

- route definitions and route metadata
- custom element implementations referenced by `componentTag`
- application copy and page composition
- analytics, business rules, and link exclusion policy
- browser-level end-to-end coverage in real application shells

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

---

## Runtime Behavior

Startup flow:

- the router builds a route registry from the supplied route definitions
- `init()` seeds a router-specific history-state key, attaches delegated click,
  `popstate`, and `pagehide` listeners, and starts route-link observation
- the current browser location is resolved and rendered into the outlet
- if the current history entry has a persisted scroll position, it is restored
  after render

Navigation flow:

- a direct path or named target is resolved into a normalized `ResolvedRoute`
- the browser URL is translated through the configured `basePath`
- the current entry's scroll position is saved, then history state, outlet
  content, metadata, active links, and the route-change event are updated
  together
- scroll behavior is applied after render, including anchor navigation and
  saved-history restoration from memory or persisted history state

---

## Navigation Hooks

Register hooks on the router instance before `init()` if an after hook should
observe the initial render. Hooks are synchronous and belong to the router
runtime; the application owns policies such as authorization and analytics.

```ts
const stopGuard = router.onBeforeNavigate(({ from, to }) => {
  // consumerCanVisit is an application-owned synchronous function.
  if (!consumerCanVisit(to)) return false;
  console.log("Leaving", from?.path ?? "initial location");
});

const stopTracking = router.onAfterNavigate(({ from, to, reason }) => {
  trackRoute({ from: from?.fullPath ?? null, to: to.fullPath, reason });
});

router.init();

// When one integration is no longer needed, remove only its registration:
stopTracking();
// When replacing the entire router, remove its browser listeners and all hooks:
router.destroy();
// stopGuard() is now harmless, because destroy() cleared the registration.
```

`onBeforeNavigate()` runs only for `navigate()` / `navigateByName()` and
intercepted route-link clicks, once the final target has been resolved (including
redirects) and checked for renderability but **before** URL/history, scroll
snapshot, or rendering changes. Returning exactly `false` cancels the attempt;
returning nothing allows it. The `navigate*()` methods still return `void`. A
canceled intercepted click remains intercepted; it does not trigger native
navigation. Pure `resolve*()` and `hrefFor()` calls do not invoke hooks.

`onAfterNavigate()` runs after a successful render and the existing
`koppajs-route-change` event, before deferred scroll work. Its `reason` is
`"load"`, `"navigate"`, or `"popstate"`. There is no cancellable before phase
for load or browser back/forward: the browser URL has already changed. The
existing event name and `RouteChangeDetail` payload are unchanged; event users
do not need to migrate.

Each registration returns its own idempotent unsubscribe function. Hooks run in
registration order; registrations made during dispatch wait until the next
dispatch, while unsubscribe takes effect immediately. `destroy()` clears all
hooks, so register again if the same instance is initialized again. Do not
mutate the observed resolved route or its source record. Navigating _inside a
hook_ throws; navigation from an existing route-change event can supersede an
older route's after hook.

Async hooks are not supported: promise-like return values throw a synchronous
error. A thrown before hook leaves the navigation uncommitted; a thrown after
hook stops later after hooks but cannot undo the already changed URL, rendered
content, or emitted event. Errors from route matching and rendering remain
errors, not cancellations.

---

## Runtime Options

Browser seam options:

- `root`, `document`, `window`

Routing and URL options:

- `basePath`
- `routeChangeEventName`
- `scrollBehavior`

Active-link options:

- `linkSelector`
- `activeClassName`
- `activeAttributeName`
- `shouldSetActiveState`
- `isLinkActive(link, currentRoute)`

Important nuance:

- the default delegated-link selector is `a[data-route]`
- active-link and click handling derive the route target from `data-route` when
  present and otherwise fall back to `href`
- if you want href-only links to participate in delegated handling, provide a
  selector such as `a[data-nav]` or `a[href^="/"]` explicitly

### Custom active-link matching

Without `isLinkActive`, links keep the existing normalized path comparison,
ignoring query and hash. Supply a synchronous boolean callback to replace that
comparison for every eligible link:

```ts
const router = new KoppajsRouter({
  routes,
  outlet,
  isLinkActive: (link, currentRoute) => {
    const target = new URL(
      link.dataset.route ?? link.getAttribute("href") ?? "/",
      window.location.origin,
    );
    return target.pathname === currentRoute.path && target.hash === currentRoute.hash;
  },
});
```

This example expects app-relative `data-route` paths (without the deployment
base path). `currentRoute` is the read-only resolved app route with typed
metadata, params, query, and hash. Return `true` for active and `false` for
inactive; `false` does not fall back to default matching. Do not mutate DOM or
route state, navigate, or return a Promise from the callback. Matcher errors are
not swallowed: synchronous sync errors propagate to the caller, while deferred
sync errors surface through the microtask. Matching is not transactional and
does not roll back an already committed navigation.

`shouldSetActiveState` remains the eligibility gate: excluded links have the
configured active class and attribute removed and never reach `isLinkActive`.
The router still owns those DOM writes; custom matching only supplies the rule.

The same rule runs synchronously before the route-change event and after hooks,
and again in a microtask when route links are added or removed. Each deferred
sync uses the latest committed route. After hooks are **not** a final DOM-settled
notification: manually overriding the same active class or attribute can be
undone by a later sync. Put durable custom rules in `isLinkActive` instead of a
timeout or an after-hook class override.

Attribute-only edits, native `hashchange`, and scrolling do not trigger this
observer. For hash-sensitive rules, navigate through the router; this option
does not implement scrollspy. `destroy()` disconnects observation and invalidates
already queued link work, including across a subsequent `init()`.

For standalone use, `setActiveRouteLinks(root, path, options)` keeps supporting
default matching. For custom matching, pass the resolved route instead:
`setActiveRouteLinks(root, router.getCurrentRoute(), { isLinkActive })`. A custom
matcher with only a path string throws because the route context is missing.

---

## Route Matching Rules

- static path segments win over dynamic `:param` segments, even if declared
  later
- dynamic `:param` segments win over `*` catch-all routes
- catch-all routes preserve the unmatched browser path in `path` and `fullPath`
- unmatched paths never fall back to the first route silently
- redirects inherit params, query, and hash unless the redirect target replaces
  them

---

## Build And Distribution

- source lives in `src/`
- `pnpm run build` emits the publishable package to `dist/`
- the package manifest exports `dist/index.js` and `dist/index.d.ts`
- `pnpm run check:package` verifies that manifest entrypoints and build output
  stay aligned
- `pnpm run test:package` packs the tarball, installs it into a clean temporary
  consumer, and imports the published entrypoint
- `pnpm run check` is the main local quality gate
- `pnpm run validate` is the CI and release validation contract; it runs
  `check` plus the tarball-consumer smoke test

Local verification commands:

```bash
pnpm install
pnpm run check
pnpm run validate
```

---

## Ecosystem Fit

This package is the routing runtime layer in the KoppaJS ecosystem.

- `koppajs-core` and application shells can depend on it without inheriting
  website-specific route content
- consumer applications keep ownership of route tables, component registration,
  and integration-level browser behavior
- this repository intentionally does not include a demo app, Playwright suite,
  or UI surface of its own

---

## Architecture & Governance

Project intent, contributor rules, and documentation contracts live in the local repo meta layer:

- [AI_CONSTITUTION.md](./AI_CONSTITUTION.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DECISION_HIERARCHY.md](./DECISION_HIERARCHY.md)
- [DEVELOPMENT_RULES.md](./DEVELOPMENT_RULES.md)
- [TESTING_STRATEGY.md](./TESTING_STRATEGY.md)
- [RELEASE.md](./RELEASE.md)
- [ROADMAP.md](./ROADMAP.md)
- [CHANGELOG.md](./CHANGELOG.md)
- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- [docs/specs/README.md](./docs/specs/README.md)
- [docs/specs/repository-documentation-contract.md](./docs/specs/repository-documentation-contract.md)
- [docs/meta/README.md](./docs/meta/README.md)
- [docs/quality/README.md](./docs/quality/README.md)

The file-shape contract for `README.md`, `CHANGELOG.md`, `CODE_OF_CONDUCT.md`, and `CONTRIBUTING.md` is defined in [docs/specs/repository-documentation-contract.md](./docs/specs/repository-documentation-contract.md).

Run the local document guard before committing:

```bash
pnpm run check:docs
```

---

## Community & Contribution

Issues and pull requests are welcome:

https://github.com/koppajs/koppajs-router/issues

Contributor workflow details live in [CONTRIBUTING.md](./CONTRIBUTING.md).

Community expectations live in [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

---

## License

Apache License 2.0 — © 2026 KoppaJS, Bastian Bensch
