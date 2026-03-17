# @koppajs/koppajs-router

`@koppajs/koppajs-router` extracts the reusable History API router runtime out
of the website root and exposes it as a standalone package for KoppaJS
applications.

## Scope

The package owns:

- path normalization and base-path-aware href translation
- flat and nested route-record resolution
- named routes, params, redirects, and richer resolved-route state
- query/hash-aware History API navigation
- anchor scrolling and history scroll restoration
- document title and meta-description updates
- active route-link synchronization
- route-change event emission

The consuming app still owns:

- its route table
- business copy and metadata
- page component registration
- any app-specific active-link exclusions

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

## API Overview

- `KoppajsRouter`: class-based router runtime
- `normalizePath()`: canonical path normalization helper
- `normalizeHash()`: canonical hash normalization helper
- `normalizeBasePath()`: normalize configured base paths such as `/preview/`
- `toHref()`: map a route path string, including optional query/hash, to a browser href beneath the configured base path
- `fromLocationPathname()`: translate a browser pathname back into an app route path
- `resolveRoute()`: resolve either a direct path or a named route target object against a provided route table
- `resolveRouteByName()`: resolve a named route target with params/query/hash
- `router.resolve()` / `router.resolveByName()`: instance helpers that return the active `ResolvedRoute`
- `router.navigate()` / `router.navigateByName()`: direct-path and named-route navigation helpers
- `router.hrefFor()`: build a base-path-aware href from either a direct path or a named route target object
- `router.getCurrentPath()`: read the normalized active path
- `router.getCurrentRoute()`: read the richer active-route state, including `params`, `query`, `hash`, and `redirectedFrom`
- `router.destroy()`: tear down browser listeners and restore the previous scroll-restoration setting
- `setActiveRouteLinks()`: synchronize active classes and `aria-current` for route links
- `setDocumentDescription()`: upsert the document description meta tag
- `DEFAULT_ROUTE_LINK_SELECTOR`: default delegated link selector used by the router
- `DEFAULT_ROUTE_CHANGE_EVENT_NAME`: default emitted route-change event name
- `KOPPAJS_ROUTE_CHANGE_EVENT`: default event name emitted on navigation

## Router Configuration Highlights

- `basePath`: translate app paths beneath a subpath deployment such as
  `/preview/`
- `root`, `document`, `window`: inject browser seams for testing or custom host
  environments
- `routeChangeEventName`: override the emitted browser event name
- `scrollBehavior`: control default forward-navigation scroll behavior
- `linkSelector`, `activeClassName`, `activeAttributeName`,
  `shouldSetActiveState`: customize active-link synchronization

## Build And Distribution

- source code lives in `src/`
- `pnpm run build` emits the publishable library to `dist/`
- the package manifest exports `dist/index.js` and `dist/index.d.ts`
- when consuming this repository directly instead of a published package, build
  first so `dist/` exists
- `pnpm run check:package` verifies that manifest entrypoints and build output
  stay aligned

## Local Commands

```bash
pnpm install
pnpm run typecheck
pnpm run lint
pnpm run test:unit
pnpm run test:ci
pnpm run check:package
pnpm run build
pnpm run check
```

## Project Meta Layer

This package keeps its architecture memory and governance in the repository:

- `META_LAYER.md` for the index
- `DECISION_HIERARCHY.md` for precedence rules
- `AI_CONSTITUTION.md` for collaboration and AI workflow rules
- `ARCHITECTURE.md` plus `docs/architecture/` for system structure
- `DEVELOPMENT_RULES.md` for implementation constraints
- `TESTING_STRATEGY.md` plus `docs/quality/` for verification policy
- `RELEASE.md` for the tag-driven release workflow
- `docs/specs/` for behavior specs
- `docs/adr/` for architecture decision records
