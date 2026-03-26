# @koppajs/koppajs-router

`@koppajs/koppajs-router` is the KoppaJS browser router runtime. It keeps URL
resolution, History API navigation, outlet rendering, metadata updates,
active-link synchronization, and scroll behavior inside one reusable package
while leaving route content and application logic in the consumer.

The published package is ESM-only. Use `import`, not `require()`.

## Purpose

The package exists to provide a deterministic, route-config-driven router
runtime for KoppaJS-style applications.

It is intentionally narrow:

- the package owns path normalization, route matching, redirect following,
  browser history updates, outlet rendering, metadata updates, active-link
  state, and scroll restoration
- the consuming application owns route content, custom element registration,
  page copy, analytics, and business-specific navigation rules

## Repository Classification

- `repo_type`: reusable package
- `runtime_responsibility`: browser router runtime
- `build_time_responsibility`: TypeScript build, linting, unit tests, tarball
  smoke testing, and release validation
- `ui_surface`: none inside the package
- `maturity_level`: pre-1.0, contract-stabilizing

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

- Node.js >= 20
- pnpm >= 10.17.1

## Public Contract

The public surface is deliberately small.

Main runtime surface:

- `KoppajsRouter`
- `RouteDefinition`, `ResolvedRoute`, `RedirectedRoute`, and related route
  types
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
- `router.hrefFor()`
- `router.getCurrentPath()` / `router.getCurrentRoute()`

Contract constraints:

- flat and nested route definitions are both supported
- route names must be unique
- unmatched paths throw unless the consumer declares an explicit `path: "*"`
  route
- static segments outrank dynamic segments, and dynamic segments outrank `*`
- active-link matching is path-based and ignores query and hash state
- route records are treated as immutable input data

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

## Runtime Behavior

Startup flow:

- the router builds a route registry from the supplied route definitions
- `init()` seeds a router-specific history-state key, attaches delegated click
  and `popstate` listeners, and starts route-link observation
- the current browser location is resolved and rendered into the outlet

Navigation flow:

- a direct path or named target is resolved into a normalized `ResolvedRoute`
- the browser URL is translated through the configured `basePath`
- history state, outlet content, metadata, active links, and the route-change
  event are updated together
- scroll behavior is applied after render, including anchor navigation and
  saved-history restoration

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

Important nuance:

- the default delegated-link selector is `a[data-route]`
- active-link and click handling derive the route target from `data-route` when
  present and otherwise fall back to `href`
- if you want href-only links to participate in delegated handling, provide a
  selector such as `a[data-nav]` or `a[href^="/"]` explicitly

## Route Matching Rules

- static path segments win over dynamic `:param` segments, even if declared
  later
- dynamic `:param` segments win over `*` catch-all routes
- catch-all routes preserve the unmatched browser path in `path` and `fullPath`
- unmatched paths never fall back to the first route silently
- redirects inherit params, query, and hash unless the redirect target replaces
  them

## Build And Distribution

- source lives in `src/`
- `pnpm run build` emits the publishable package to `dist/`
- the package manifest exports `dist/index.js` and `dist/index.d.ts`
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
pnpm run build
pnpm run check:package
pnpm run test:package
pnpm run check
```

## Ecosystem Fit

This package is the routing runtime layer in the KoppaJS ecosystem.

- `koppajs-core` and application shells can depend on it without inheriting
  website-specific route content
- consumer applications keep ownership of route tables, component registration,
  and integration-level browser behavior
- this repository intentionally does not include a demo app, Playwright suite,
  or UI surface of its own

## Governance

The repository keeps its design memory next to the code.

Read in this order:

1. `DECISION_HIERARCHY.md`
2. relevant spec in `docs/specs/`
3. `AI_CONSTITUTION.md`
4. `ARCHITECTURE.md`
5. `DEVELOPMENT_RULES.md`
6. `TESTING_STRATEGY.md`
7. `README.md`

Supporting governance and architecture files:

- `META_LAYER.md`
- `DECISIONS.md`
- `docs/adr/`
- `docs/architecture/`
- `docs/meta/`
- `docs/quality/`
- `RELEASE.md`
- `CONTRIBUTING.md`
- `ROADMAP.md`

## Contribution Focus

Contributions should preserve:

- base-path behavior
- active-link semantics
- explicit unmatched-path handling
- generic package boundaries with no application-specific page logic

Issues and pull requests:

- <https://github.com/koppajs/koppajs-router/issues>

## License

Apache-2.0. Copyright 2026 KoppaJS, Bastian Bensch.
