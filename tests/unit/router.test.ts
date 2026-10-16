import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  KOPPAJS_ROUTE_CHANGE_EVENT,
  KoppajsRouter,
  fromLocationPathname,
  resolveRoute,
  resolveRouteByName,
  setActiveRouteLinks,
  toHref,
  type RouteChangeDetail,
  type RouteDefinition,
  type RouteNavigationContext,
  type ResolvedRoute,
} from "../../src/index";

type TestRoute = RouteDefinition<{
  section?: string;
}>;

const routes = [
  {
    path: "/",
    name: "home",
    title: "Home",
    description: "Landing page",
    componentTag: "home-page",
    meta: {
      section: "home",
    },
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
        meta: {
          section: "guides",
        },
      },
    ],
  },
  {
    path: "/services",
    name: "services",
    title: "Services",
    description: "Services page",
    componentTag: "services-page",
    children: [
      {
        path: ":slug",
        name: "service-detail",
        title: "Service detail",
        description: "Service detail page",
        componentTag: "service-detail-page",
        meta: {
          section: "services",
        },
      },
    ],
  },
  {
    path: "/contact",
    name: "contact",
    title: "Contact",
    description: "Contact page",
    componentTag: "contact-page",
    meta: {
      section: "contact",
    },
  },
] satisfies readonly TestRoute[];

const flushRouterWork = async () => {
  await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
};

const flushHistoryTraversal = async () => {
  await new Promise<void>((resolve) => window.setTimeout(() => resolve(), 0));
  await flushRouterWork();
};

const registerTestPage = (tagName: string, html: string) => {
  if (customElements.get(tagName)) {
    return;
  }

  class TestPageElement extends HTMLElement {
    connectedCallback(): void {
      this.innerHTML = html;
    }
  }

  customElements.define(tagName, TestPageElement);
};

type ScrollStateOptions = {
  getMaxScroll?: () => {
    left?: number;
    top?: number;
  };
};

const installScrollState = (options: ScrollStateOptions = {}) => {
  let scrollLeft = 0;
  let scrollTop = 0;

  const applyScroll = (left: number, top: number) => {
    const maxScroll = options.getMaxScroll?.();

    scrollLeft = Math.min(left, maxScroll?.left ?? left);
    scrollTop = Math.min(top, maxScroll?.top ?? top);
  };

  Object.defineProperty(window, "scrollX", {
    configurable: true,
    get: () => scrollLeft,
  });
  Object.defineProperty(window, "scrollY", {
    configurable: true,
    get: () => scrollTop,
  });

  const scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation((xOrOptions, y) => {
    if (typeof xOrOptions === "object" && xOrOptions !== null) {
      const scrollOptions = xOrOptions as ScrollToOptions;
      applyScroll(Number(scrollOptions.left ?? scrollLeft), Number(scrollOptions.top ?? scrollTop));
      return;
    }

    applyScroll(Number(xOrOptions ?? scrollLeft), Number(y ?? scrollTop));
  });

  return {
    scrollToSpy,
    setScroll(top: number, left = 0) {
      scrollLeft = left;
      scrollTop = top;
    },
    getScroll() {
      return {
        left: scrollLeft,
        top: scrollTop,
      };
    },
  };
};

type RouterHistoryTestState = {
  __koppajsRouterKey?: number;
  __koppajsRouterScroll?: {
    left: number;
    top: number;
  };
};

const getRouterHistoryState = (): RouterHistoryTestState =>
  window.history.state as RouterHistoryTestState;

const getRouterHistoryKey = (): number => {
  const historyKey = getRouterHistoryState().__koppajsRouterKey;

  if (typeof historyKey !== "number") {
    throw new Error("Expected router history state to contain a numeric key.");
  }

  return historyKey;
};

describe("koppajs-router", () => {
  beforeEach(() => {
    registerTestPage("home-page", '<h1 id="home-heading">Home</h1>');
    registerTestPage("blog-page", '<section id="blog-overview">Blog overview</section>');
    registerTestPage("blog-post-page", '<article id="blog-post">Blog post</article>');
    registerTestPage("blog-archive-page", '<section id="blog-archive">Archive</section>');
    registerTestPage(
      "blog-not-found-page",
      '<section id="blog-not-found">Missing blog page</section>',
    );
    registerTestPage(
      "guides-introduction-page",
      '<section id="guide-introduction">Guide</section>',
    );
    registerTestPage("services-page", '<h1 id="services-heading">Services</h1>');
    registerTestPage(
      "service-detail-page",
      '<section id="service-detail">Service detail</section>',
    );
    registerTestPage("contact-page", '<section id="contact-form">Contact form</section>');
    registerTestPage("not-found-page", '<section id="not-found-page">Not found</section>');

    document.head.innerHTML = "";
    document.body.innerHTML = "";
    window.history.replaceState({}, "", "/");
    vi.restoreAllMocks();
  });

  it("maps hrefs and location paths across a configured base path, including query and hash state", () => {
    expect(toHref("/", { basePath: "/preview/" })).toBe("/preview/");
    expect(toHref("/services", { basePath: "/preview/" })).toBe("/preview/services");
    expect(toHref("/services?ref=hero#contact-form", { basePath: "/preview/" })).toBe(
      "/preview/services?ref=hero#contact-form",
    );
    expect(fromLocationPathname("/preview", { basePath: "/preview/" })).toBe("/");
    expect(fromLocationPathname("/preview/services", { basePath: "/preview/" })).toBe("/services");
  });

  it("resolves named, nested, parameterized, and redirected routes without mutating route records", () => {
    const resolvedByPath = resolveRoute(
      routes,
      "/services/accessibility-audit?ref=nav#contact-form",
    );

    expect(resolvedByPath.path).toBe("/services/accessibility-audit");
    expect(resolvedByPath.pattern).toBe("/services/:slug");
    expect(resolvedByPath.fullPath).toBe("/services/accessibility-audit?ref=nav#contact-form");
    expect(resolvedByPath.params).toEqual({
      slug: "accessibility-audit",
    });
    expect(resolvedByPath.query).toEqual({
      ref: "nav",
    });
    expect(resolvedByPath.hash).toBe("#contact-form");
    expect(resolvedByPath.componentTag).toBe("service-detail-page");
    expect(routes[2]?.children?.[0]).not.toHaveProperty("params");

    const resolvedByName = resolveRouteByName(routes, "service-detail", {
      params: {
        slug: "conversion-boost",
      },
      query: {
        ref: "footer",
        filter: ["seo", "ux"],
      },
      hash: "contact-form",
    });

    expect(resolvedByName.path).toBe("/services/conversion-boost");
    expect(resolvedByName.query).toEqual({
      ref: "footer",
      filter: ["seo", "ux"],
    });
    expect(resolvedByName.hash).toBe("#contact-form");

    const resolvedByTarget = resolveRoute(routes, {
      name: "service-detail",
      params: {
        slug: "system-audit",
      },
      query: {
        ref: "cta",
      },
      hash: "contact-form",
    });

    expect(resolvedByTarget.fullPath).toBe("/services/system-audit?ref=cta#contact-form");
    expect(resolvedByTarget.params).toEqual({
      slug: "system-audit",
    });

    const redirectedRoute = resolveRoute(routes, "/guides?from=home#guide-introduction");

    expect(redirectedRoute.path).toBe("/guides/introduction");
    expect(redirectedRoute.pattern).toBe("/guides/introduction");
    expect(redirectedRoute.fullPath).toBe("/guides/introduction?from=home#guide-introduction");
    expect(redirectedRoute.redirectedFrom?.path).toBe("/guides");
    expect(redirectedRoute.redirectedFrom?.pattern).toBe("/guides");
    expect(redirectedRoute.redirectedFrom?.record.name).toBe("guides");
  });

  it("prioritizes static routes over dynamic ones and uses wildcard routes as the explicit not-found contract", () => {
    const prioritizedRoutes = [
      {
        path: "/",
        name: "home",
        title: "Home",
        description: "Landing page",
        componentTag: "home-page",
      },
      {
        path: "/blog",
        name: "blog",
        title: "Blog",
        description: "Blog overview",
        componentTag: "blog-page",
        children: [
          {
            path: ":slug",
            name: "blog-post",
            title: "Blog post",
            description: "Blog post page",
            componentTag: "blog-post-page",
          },
          {
            path: "archive",
            name: "blog-archive",
            title: "Archive",
            description: "Archive page",
            componentTag: "blog-archive-page",
          },
          {
            path: "*",
            title: "Missing blog page",
            description: "Blog not found",
            componentTag: "blog-not-found-page",
          },
        ],
      },
    ] satisfies readonly TestRoute[];

    const archiveRoute = resolveRoute(prioritizedRoutes, "/blog/archive");

    expect(archiveRoute.name).toBe("blog-archive");
    expect(archiveRoute.pattern).toBe("/blog/archive");
    expect(archiveRoute.path).toBe("/blog/archive");

    const postRoute = resolveRoute(prioritizedRoutes, "/blog/launch-post");

    expect(postRoute.name).toBe("blog-post");
    expect(postRoute.pattern).toBe("/blog/:slug");
    expect(postRoute.params).toEqual({
      slug: "launch-post",
    });

    const catchAllRoute = resolveRoute(prioritizedRoutes, "/blog/archive/2024?ref=nav#deep-dive");

    expect(catchAllRoute.componentTag).toBe("blog-not-found-page");
    expect(catchAllRoute.pattern).toBe("/blog/*");
    expect(catchAllRoute.path).toBe("/blog/archive/2024");
    expect(catchAllRoute.fullPath).toBe("/blog/archive/2024?ref=nav#deep-dive");
  });

  it("throws a clear error for unmatched paths when no wildcard route exists", () => {
    expect(() => resolveRoute(routes, "/missing")).toThrow(
      'KoppajsRouter could not match path "/missing". Add a "*" route to handle unmatched paths.',
    );

    document.body.innerHTML = '<main id="outlet"></main>';
    window.history.replaceState({}, "", "/missing");

    const outlet = document.querySelector<HTMLElement>("#outlet");
    expect(outlet).toBeTruthy();

    const router = new KoppajsRouter({
      routes,
      outlet: outlet!,
      root: document,
    });

    expect(() => router.init()).toThrow(
      'KoppajsRouter could not match path "/missing". Add a "*" route to handle unmatched paths.',
    );
    router.destroy();
  });

  it("navigates by name, updates document metadata, and emits a rich route-change event", async () => {
    document.body.innerHTML = `
      <app-shell>
        <nav>
          <a data-route="/" href="/" class="nav-link">Home</a>
          <a data-route="/services" href="/services" class="nav-link">Services</a>
          <a data-route="/contact#contact-form" href="/contact#contact-form" class="nav-link">Contact</a>
        </nav>
        <main id="outlet"></main>
      </app-shell>
    `;

    const outlet = document.querySelector<HTMLElement>("#outlet");
    expect(outlet).toBeTruthy();

    const scrollState = installScrollState();
    const routeChangeSpy = vi.fn();
    let routeChangeDetail: RouteChangeDetail<TestRoute> | undefined;

    window.addEventListener(KOPPAJS_ROUTE_CHANGE_EVENT, (event) => {
      routeChangeDetail = (event as CustomEvent<RouteChangeDetail<TestRoute>>).detail;
      routeChangeSpy(routeChangeDetail.path);
    });

    const router = new KoppajsRouter({
      routes,
      outlet: outlet!,
      root: document,
    });

    router.init();
    await flushRouterWork();
    routeChangeSpy.mockClear();

    expect(
      router.hrefFor({
        name: "service-detail",
        params: {
          slug: "accessibility-audit",
        },
        query: {
          ref: "nav",
        },
        hash: "contact-form",
      }),
    ).toBe("/services/accessibility-audit?ref=nav#contact-form");

    expect(
      router.resolve({
        name: "service-detail",
        params: {
          slug: "accessibility-audit",
        },
        query: {
          ref: "nav",
        },
      }).path,
    ).toBe("/services/accessibility-audit");

    router.navigate(
      {
        name: "service-detail",
        params: {
          slug: "accessibility-audit",
        },
        query: {
          ref: "nav",
        },
      },
      { scroll: false },
    );

    await flushRouterWork();

    expect(window.location.pathname).toBe("/services/accessibility-audit");
    expect(window.location.search).toBe("?ref=nav");
    expect(outlet?.querySelector("service-detail-page")).toBeTruthy();
    expect(document.title).toBe("Service detail");
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(
      "Service detail page",
    );
    expect(router.getCurrentPath()).toBe("/services/accessibility-audit");
    expect(router.getCurrentRoute().params).toEqual({
      slug: "accessibility-audit",
    });
    expect(
      document
        .querySelector<HTMLAnchorElement>('a[data-route="/services"]')
        ?.classList.contains("is-active"),
    ).toBe(false);
    expect(scrollState.scrollToSpy).not.toHaveBeenCalledWith(expect.objectContaining({ top: 0 }));
    expect(routeChangeSpy).toHaveBeenCalledWith("/services/accessibility-audit");
    expect(routeChangeDetail?.path).toBe("/services/accessibility-audit");
    expect(routeChangeDetail?.fullPath).toBe("/services/accessibility-audit?ref=nav");
    expect(routeChangeDetail?.hash).toBe("");
    expect(routeChangeDetail?.query).toEqual({
      ref: "nav",
    });
    expect(routeChangeDetail?.route.params).toEqual({
      slug: "accessibility-audit",
    });
    expect(routeChangeDetail?.route.pattern).toBe("/services/:slug");

    router.navigateByName("contact", {
      hash: "contact-form",
      replace: true,
      scroll: false,
    });

    await flushRouterWork();
    expect(window.location.pathname).toBe("/contact");
    expect(window.location.hash).toBe("#contact-form");
    router.destroy();
  });

  it("applies explicit event, scroll, and active-link options without changing route resolution", async () => {
    document.body.innerHTML = `
      <app-shell>
        <nav>
          <a data-nav href="/" class="nav-link">Home</a>
          <a data-nav href="/services" class="nav-link">Services</a>
        </nav>
        <main id="outlet"></main>
      </app-shell>
    `;

    const outlet = document.querySelector<HTMLElement>("#outlet");
    expect(outlet).toBeTruthy();

    const scrollState = installScrollState();
    const defaultEventSpy = vi.fn();
    const customEventSpy = vi.fn();

    window.addEventListener(KOPPAJS_ROUTE_CHANGE_EVENT, defaultEventSpy);
    window.addEventListener("router:changed", customEventSpy);

    const router = new KoppajsRouter({
      routes,
      outlet: outlet!,
      root: document,
      routeChangeEventName: "router:changed",
      scrollBehavior: "auto",
      linkSelector: "a[data-nav]",
      activeClassName: "nav-link--active",
      activeAttributeName: "data-current",
    });

    router.init();
    await flushRouterWork();

    defaultEventSpy.mockClear();
    customEventSpy.mockClear();
    scrollState.scrollToSpy.mockClear();

    router.navigate("/services");
    await flushRouterWork();

    expect(router.resolve("/services").path).toBe("/services");
    expect(customEventSpy).toHaveBeenCalledTimes(1);
    expect(defaultEventSpy).not.toHaveBeenCalled();
    expect(scrollState.scrollToSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        top: 0,
        behavior: "auto",
      }),
    );
    expect(
      document
        .querySelector<HTMLAnchorElement>('a[data-nav][href="/services"]')
        ?.classList.contains("nav-link--active"),
    ).toBe(true);
    expect(
      document
        .querySelector<HTMLAnchorElement>('a[data-nav][href="/services"]')
        ?.getAttribute("data-current"),
    ).toBe("page");
    expect(
      document
        .querySelector<HTMLAnchorElement>('a[data-nav][href="/"]')
        ?.classList.contains("nav-link--active"),
    ).toBe(false);
    router.destroy();
  });

  it("renders an explicit wildcard route when the current location is unmatched", async () => {
    const routesWithNotFound = [
      ...routes,
      {
        path: "*",
        name: "not-found",
        title: "Not found",
        description: "Missing page",
        componentTag: "not-found-page",
        meta: {
          section: "missing",
        },
      },
    ] satisfies readonly TestRoute[];

    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);

    document.body.innerHTML = '<main id="outlet"></main>';
    window.history.replaceState({}, "", "/missing?ref=nav#not-found-page");

    const outlet = document.querySelector<HTMLElement>("#outlet");
    expect(outlet).toBeTruthy();

    const router = new KoppajsRouter({
      routes: routesWithNotFound,
      outlet: outlet!,
      root: document,
    });

    router.init();
    await flushRouterWork();

    expect(outlet?.querySelector("not-found-page")).toBeTruthy();
    expect(document.title).toBe("Not found");
    expect(router.getCurrentRoute().pattern).toBe("/*");
    expect(router.getCurrentRoute().path).toBe("/missing");
    expect(router.getCurrentRoute().fullPath).toBe("/missing?ref=nav#not-found-page");
    router.destroy();
  });

  it("keeps excluded links out of the active-state contract and matches links by path only", () => {
    document.body.innerHTML = `
      <nav>
        <a data-route="/contact#contact-form" href="/contact#contact-form" class="nav-link">Contact</a>
        <a data-route="/contact#contact-form" href="/contact#contact-form" class="nav-link nav-link--cta">CTA</a>
      </nav>
    `;

    setActiveRouteLinks(document, "/contact", {
      shouldSetActiveState: (link) => !link.classList.contains("nav-link--cta"),
    });

    expect(
      document
        .querySelector<HTMLAnchorElement>("a.nav-link:not(.nav-link--cta)")
        ?.classList.contains("is-active"),
    ).toBe(true);
    expect(
      document.querySelector<HTMLAnchorElement>("a.nav-link--cta")?.classList.contains("is-active"),
    ).toBe(false);
    expect(
      document.querySelector<HTMLAnchorElement>("a.nav-link--cta")?.hasAttribute("aria-current"),
    ).toBe(false);
  });

  it("uses custom matching with a resolved route and preserves exclusion priority", () => {
    document.body.innerHTML = `
      <a id="selected" data-route="/services">Section</a>
      <a id="exact" data-route="/contact">Contact</a>
      <a id="excluded" data-route="/contact" class="is-active" aria-current="page">CTA</a>
    `;
    const route = resolveRoute(routes, "/contact?tab=team#about");
    const matcher = vi.fn(
      (link: HTMLAnchorElement, currentRoute: Readonly<ResolvedRoute<TestRoute>>) => {
        expect(currentRoute).toBe(route);
        return link.id === "selected" && currentRoute.hash === "#about";
      },
    );
    setActiveRouteLinks(document, route, {
      isLinkActive: matcher,
      shouldSetActiveState: (link) => link.id !== "excluded",
    });
    expect(matcher).toHaveBeenCalledTimes(2);
    expect(document.querySelector("#selected")?.getAttribute("aria-current")).toBe("page");
    expect(document.querySelector("#exact")?.classList.contains("is-active")).toBe(false);
    expect(document.querySelector("#excluded")?.hasAttribute("aria-current")).toBe(false);
    expect(document.querySelector("#excluded")?.classList.contains("is-active")).toBe(false);
  });

  it("rejects custom matching without a resolved route", () => {
    expect(() => {
      setActiveRouteLinks(document, "/contact", { isLinkActive: () => true });
    }).toThrow("resolved route");
  });

  it("keeps custom matching consistent across load, navigation, history, and late links", async () => {
    installScrollState();
    const root = document.createElement("section");
    root.innerHTML = `
      <a id="custom" data-route="/services">About</a>
      <a id="exact" data-route="/contact">Contact</a>
      <main id="outlet"></main>
    `;
    window.history.replaceState({}, "", "/preview/contact?tab=team#about");
    const matcher = vi.fn(
      (link: HTMLAnchorElement, route: Readonly<ResolvedRoute<TestRoute>>) =>
        link.id !== "exact" && route.hash === "#about" && route.meta?.section === "contact",
    );
    const router = new KoppajsRouter({
      routes,
      root,
      outlet: root.querySelector<HTMLElement>("main")!,
      basePath: "/preview/",
      isLinkActive: matcher,
      activeClassName: "selected",
      activeAttributeName: "data-current",
    });
    const expectSelected = (id: string, active: boolean) => {
      expect(root.querySelector(`#${id}`)?.classList.contains("selected")).toBe(active);
      expect(root.querySelector(`#${id}`)?.getAttribute("data-current")).toBe(
        active ? "page" : null,
      );
    };
    const after = vi.fn(() => expectSelected("custom", router.getCurrentRoute().hash === "#about"));
    router.onAfterNavigate(after);
    router.init();
    expectSelected("custom", true);
    expectSelected("exact", false);
    const initialState: unknown = window.history.state;
    root.insertAdjacentHTML("beforeend", '<a id="late" data-route="/">Late</a>');
    await flushRouterWork();
    expectSelected("late", true);
    expectSelected("custom", true);
    router.navigate("/contact#other", { scroll: false });
    expectSelected("custom", false);
    expectSelected("late", false);
    router.navigateByName("contact", { hash: "about", scroll: false });
    expectSelected("custom", true);
    expectSelected("late", true);
    router.navigate("/services", { scroll: false });
    window.history.replaceState(initialState, "", "/preview/contact?tab=team#about");
    window.dispatchEvent(new PopStateEvent("popstate", { state: initialState }));
    expectSelected("custom", true);
    root.querySelector("#late")?.remove();
    await flushRouterWork();
    expectSelected("custom", true);
    expect(matcher).toHaveBeenLastCalledWith(
      expect.any(HTMLAnchorElement),
      router.getCurrentRoute(),
    );
    expect(after).toHaveBeenCalledTimes(5);
    router.destroy();
  });

  it("uses the latest route when a queued link sync follows another navigation", async () => {
    installScrollState();
    const root = document.createElement("section");
    root.innerHTML = "<main></main>";
    const observedRoutes: string[] = [];
    const router = new KoppajsRouter({
      routes,
      root,
      outlet: root.querySelector("main")!,
      isLinkActive: (link, route) => {
        observedRoutes.push(route.fullPath);
        return link.dataset.route === route.path;
      },
    });
    router.init();
    root.insertAdjacentHTML("beforeend", '<a data-route="/contact">Contact</a>');
    await Promise.resolve();
    router.navigate("/contact?tab=team", { scroll: false });
    observedRoutes.length = 0;
    await flushRouterWork();
    expect(observedRoutes).toEqual(["/contact?tab=team"]);
    expect(root.querySelector("a")?.getAttribute("aria-current")).toBe("page");
    router.destroy();
  });

  it("preserves default matching with resolved routes and propagates matcher errors", () => {
    const root = document.createElement("section");
    root.innerHTML = '<a data-route="/contact?tab=other#one">Contact</a>';
    const route = resolveRoute(routes, "/contact?tab=team#two");
    setActiveRouteLinks(root, route);
    expect(root.querySelector("a")?.getAttribute("aria-current")).toBe("page");
    expect(() =>
      setActiveRouteLinks(root, route, {
        isLinkActive: () => {
          throw new Error("Matching failed");
        },
      }),
    ).toThrow("Matching failed");
  });

  it("rechecks manual after-hook state on link mutations using the current path", async () => {
    installScrollState();
    const root = document.createElement("section");
    root.innerHTML = `
      <a id="exact" data-route="/contact#one">Contact</a>
      <a id="manual" data-route="/services">Manual</a>
      <main></main>
    `;
    const router = new KoppajsRouter({ routes, root, outlet: root.querySelector("main")! });
    router.onAfterNavigate(() => root.querySelector("#manual")!.classList.add("is-active"));
    router.init();
    router.navigate("/contact?tab=team#two", { scroll: false });
    expect(root.querySelector("#manual")?.classList.contains("is-active")).toBe(true);
    root.insertAdjacentHTML("beforeend", '<a data-route="/">Late</a>');
    await flushRouterWork();
    expect(root.querySelector("#manual")?.classList.contains("is-active")).toBe(false);
    expect(root.querySelector("#exact")?.getAttribute("aria-current")).toBe("page");
    router.destroy();
  });

  it.each([false, true])(
    "invalidates queued link syncing on destroy (reinit: %s)",
    async (reinit) => {
      installScrollState();
      const root = document.createElement("section");
      root.innerHTML = "<main></main>";
      const matcher = vi.fn(() => true);
      const router = new KoppajsRouter({
        routes,
        root,
        outlet: root.querySelector("main")!,
        isLinkActive: matcher,
      });
      router.init();
      root.insertAdjacentHTML("beforeend", '<a id="late" data-route="/">Late</a>');
      await Promise.resolve(); // Deliver the observer, leaving its sync microtask queued.
      router.destroy();
      if (reinit) router.init();
      matcher.mockClear();
      await flushRouterWork();
      expect(matcher).not.toHaveBeenCalled();
      expect(root.querySelector("#late")?.hasAttribute("aria-current")).toBe(reinit);
      if (reinit) {
        root.insertAdjacentHTML("beforeend", '<a id="fresh" data-route="/">Fresh</a>');
        await flushRouterWork();
        expect(root.querySelector("#fresh")?.getAttribute("aria-current")).toBe("page");
      }
      router.destroy();
    },
  );

  it("syncs active links when route links render after router init", async () => {
    window.history.replaceState({}, "", "/services");
    document.body.innerHTML = `
      <app-shell>
        <main id="outlet"></main>
      </app-shell>
    `;

    const outlet = document.querySelector<HTMLElement>("#outlet");
    expect(outlet).toBeTruthy();

    const router = new KoppajsRouter({
      routes,
      outlet: outlet!,
      root: document,
    });

    router.init();

    document.querySelector("app-shell")?.insertAdjacentHTML(
      "afterbegin",
      `
        <nav class="top-nav">
          <a data-route="/" href="/" class="nav-link">Home</a>
          <a data-route="/services" href="/services" class="nav-link">Services</a>
        </nav>
      `,
    );

    await flushRouterWork();

    expect(
      document
        .querySelector<HTMLAnchorElement>('a[data-route="/services"]')
        ?.classList.contains("is-active"),
    ).toBe(true);
    expect(
      document
        .querySelector<HTMLAnchorElement>('a[data-route="/services"]')
        ?.getAttribute("aria-current"),
    ).toBe("page");
  });

  it("handles anchor navigation on load and restores saved scroll instantly on browser history traversal", async () => {
    const scrollState = installScrollState();

    if (!("scrollIntoView" in HTMLElement.prototype)) {
      Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
        configurable: true,
        value: () => undefined,
      });
    }

    const scrollIntoViewSpy = vi
      .spyOn(HTMLElement.prototype, "scrollIntoView")
      .mockImplementation(function mockScrollIntoView(this: HTMLElement) {
        if (this.id === "contact-form") {
          scrollState.setScroll(480);
        }
      });

    document.body.innerHTML = `
      <app-shell>
        <main id="outlet"></main>
      </app-shell>
    `;

    window.history.replaceState({}, "", "/contact#contact-form");

    const outlet = document.querySelector<HTMLElement>("#outlet");
    expect(outlet).toBeTruthy();

    const router = new KoppajsRouter({
      routes,
      outlet: outlet!,
      root: document,
    });

    router.init();
    await flushRouterWork();

    expect(outlet?.querySelector("contact-page")).toBeTruthy();
    expect(scrollIntoViewSpy).toHaveBeenCalled();
    expect(router.getCurrentRoute().hash).toBe("#contact-form");

    const firstHistoryKey = getRouterHistoryKey();

    scrollState.setScroll(240);
    router.navigate("/services");
    await flushRouterWork();

    const secondHistoryKey = getRouterHistoryKey();

    expect(secondHistoryKey).not.toBe(firstHistoryKey);

    scrollState.setScroll(860);
    window.history.replaceState(
      {
        __koppajsRouterKey: firstHistoryKey,
        __koppajsRouterScroll: {
          left: 0,
          top: 999,
        },
      },
      "",
      "/contact#contact-form",
    );
    window.dispatchEvent(
      new PopStateEvent("popstate", {
        state: {
          __koppajsRouterKey: firstHistoryKey,
          __koppajsRouterScroll: {
            left: 0,
            top: 999,
          },
        },
      }),
    );

    await flushRouterWork();

    expect(scrollState.getScroll().top).toBe(240);
    expect(scrollState.scrollToSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        top: 240,
        behavior: "instant",
      }),
    );
    expect(router.getCurrentRoute().path).toBe("/contact");
    expect(router.getCurrentRoute().hash).toBe("#contact-form");
  });

  it("restores scroll instantly on real browser back and forward traversal", async () => {
    const scrollState = installScrollState();

    document.body.innerHTML = `
      <app-shell>
        <main id="outlet"></main>
      </app-shell>
    `;

    window.history.replaceState({}, "", "/");

    const outlet = document.querySelector<HTMLElement>("#outlet");
    expect(outlet).toBeTruthy();

    const router = new KoppajsRouter({
      routes,
      outlet: outlet!,
      root: document,
      scrollBehavior: "auto",
    });

    router.init();
    await flushRouterWork();

    scrollState.setScroll(1200);
    router.navigate("/services");
    await flushRouterWork();

    scrollState.setScroll(800);
    scrollState.scrollToSpy.mockClear();
    window.history.back();
    await flushHistoryTraversal();

    expect(window.location.pathname).toBe("/");
    expect(scrollState.getScroll().top).toBe(1200);
    expect(scrollState.scrollToSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        top: 1200,
        behavior: "instant",
      }),
    );

    scrollState.scrollToSpy.mockClear();
    window.history.forward();
    await flushHistoryTraversal();

    expect(window.location.pathname).toBe("/services");
    expect(scrollState.getScroll().top).toBe(800);
    expect(scrollState.scrollToSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        top: 800,
        behavior: "instant",
      }),
    );
  });

  it("restores persisted target-state scroll instantly when the runtime map is empty", async () => {
    const scrollState = installScrollState();

    document.body.innerHTML = `
      <app-shell>
        <main id="outlet"></main>
      </app-shell>
    `;

    window.history.replaceState({ __koppajsRouterKey: 9 }, "", "/services");

    const outlet = document.querySelector<HTMLElement>("#outlet");
    expect(outlet).toBeTruthy();

    const router = new KoppajsRouter({
      routes,
      outlet: outlet!,
      root: document,
    });

    router.init();
    await flushRouterWork();

    const targetState = {
      __koppajsRouterKey: 4,
      __koppajsRouterScroll: {
        left: 16,
        top: 640,
      },
    };

    scrollState.setScroll(1200, 8);
    window.history.replaceState(targetState, "", "/contact");
    window.dispatchEvent(
      new PopStateEvent("popstate", {
        state: targetState,
      }),
    );

    await flushRouterWork();

    expect(scrollState.getScroll()).toEqual({
      left: 16,
      top: 640,
    });
    expect(scrollState.scrollToSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        left: 16,
        top: 640,
        behavior: "instant",
      }),
    );
    expect(router.getCurrentRoute().path).toBe("/contact");
  });

  it("restores persisted scroll instantly on router startup after a reload", async () => {
    const scrollState = installScrollState();

    document.body.innerHTML = `
      <app-shell>
        <main id="outlet"></main>
      </app-shell>
    `;

    window.history.replaceState(
      {
        __koppajsRouterKey: 12,
        __koppajsRouterScroll: {
          left: 4,
          top: 880,
        },
      },
      "",
      "/services",
    );

    const outlet = document.querySelector<HTMLElement>("#outlet");
    expect(outlet).toBeTruthy();

    const router = new KoppajsRouter({
      routes,
      outlet: outlet!,
      root: document,
    });

    router.init();
    await flushRouterWork();

    expect(scrollState.getScroll()).toEqual({
      left: 4,
      top: 880,
    });
    expect(scrollState.scrollToSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        left: 4,
        top: 880,
        behavior: "instant",
      }),
    );
    expect(router.getCurrentRoute().path).toBe("/services");
  });

  it("retries instant persisted scroll restore while async route layout expands", async () => {
    let maxScrollTop = 320;
    const scrollState = installScrollState({
      getMaxScroll: () => ({
        left: 0,
        top: maxScrollTop,
      }),
    });

    document.body.innerHTML = `
      <app-shell>
        <main id="outlet"></main>
      </app-shell>
    `;

    window.history.replaceState(
      {
        __koppajsRouterKey: 12,
        __koppajsRouterScroll: {
          left: 0,
          top: 960,
        },
      },
      "",
      "/services",
    );

    const outlet = document.querySelector<HTMLElement>("#outlet");
    expect(outlet).toBeTruthy();

    const router = new KoppajsRouter({
      routes,
      outlet: outlet!,
      root: document,
    });

    router.init();
    await flushRouterWork();

    expect(scrollState.getScroll().top).toBe(320);

    maxScrollTop = 960;
    await flushRouterWork();

    const instantRestoreCalls = scrollState.scrollToSpy.mock.calls.filter(([xOrOptions]) => {
      if (typeof xOrOptions !== "object" || xOrOptions === null) {
        return false;
      }

      const scrollOptions = xOrOptions as ScrollToOptions;
      return scrollOptions.top === 960 && scrollOptions.behavior === "instant";
    });

    expect(scrollState.getScroll().top).toBe(960);
    expect(instantRestoreCalls.length).toBeGreaterThan(1);
  });

  it("preserves persisted forward scroll after a router restart and back traversal", async () => {
    const scrollState = installScrollState();

    document.body.innerHTML = `
      <app-shell>
        <main id="outlet"></main>
      </app-shell>
    `;

    window.history.replaceState({}, "", "/");

    const outlet = document.querySelector<HTMLElement>("#outlet");
    expect(outlet).toBeTruthy();

    const createRouter = () =>
      new KoppajsRouter({
        routes,
        outlet: outlet!,
        root: document,
        scrollBehavior: "auto",
      });

    let router = createRouter();

    router.init();
    await flushRouterWork();

    scrollState.setScroll(1200);
    router.navigate("/services");
    await flushRouterWork();

    scrollState.setScroll(800);
    window.dispatchEvent(new Event("pagehide"));
    router.destroy();

    router = createRouter();
    router.init();
    await flushRouterWork();

    expect(scrollState.getScroll().top).toBe(800);

    window.history.back();
    await flushHistoryTraversal();

    expect(window.location.pathname).toBe("/");
    expect(scrollState.getScroll().top).toBe(1200);

    window.history.forward();
    await flushHistoryTraversal();

    expect(window.location.pathname).toBe("/services");
    expect(scrollState.getScroll().top).toBe(800);
  });

  it("saves current scroll into history state on pagehide", async () => {
    const scrollState = installScrollState();

    document.body.innerHTML = `
      <app-shell>
        <main id="outlet"></main>
      </app-shell>
    `;

    window.history.replaceState({}, "", "/services");

    const outlet = document.querySelector<HTMLElement>("#outlet");
    expect(outlet).toBeTruthy();

    const router = new KoppajsRouter({
      routes,
      outlet: outlet!,
      root: document,
    });

    router.init();
    await flushRouterWork();

    const historyKey = getRouterHistoryKey();

    scrollState.setScroll(520, 12);
    window.dispatchEvent(new Event("pagehide"));

    expect(getRouterHistoryState()).toEqual(
      expect.objectContaining({
        __koppajsRouterKey: historyKey,
        __koppajsRouterScroll: {
          left: 12,
          top: 520,
        },
      }),
    );
  });

  it("does not copy persisted scroll state into new history entries", async () => {
    const scrollState = installScrollState();

    document.body.innerHTML = `
      <app-shell>
        <main id="outlet"></main>
      </app-shell>
    `;

    window.history.replaceState({}, "", "/");

    const outlet = document.querySelector<HTMLElement>("#outlet");
    expect(outlet).toBeTruthy();

    const router = new KoppajsRouter({
      routes,
      outlet: outlet!,
      root: document,
    });

    router.init();
    await flushRouterWork();

    scrollState.setScroll(720);
    window.dispatchEvent(new Event("pagehide"));

    expect(getRouterHistoryState().__koppajsRouterScroll).toEqual({
      left: 0,
      top: 720,
    });

    router.navigate("/services");
    await flushRouterWork();

    expect(getRouterHistoryState().__koppajsRouterScroll).toBeUndefined();
  });

  it("assigns monotonic history keys across navigation after browser history traversal", async () => {
    const scrollState = installScrollState();

    document.body.innerHTML = `
      <app-shell>
        <main id="outlet"></main>
      </app-shell>
    `;

    window.history.replaceState({}, "", "/");

    const outlet = document.querySelector<HTMLElement>("#outlet");
    expect(outlet).toBeTruthy();

    const router = new KoppajsRouter({
      routes,
      outlet: outlet!,
      root: document,
    });

    router.init();
    await flushRouterWork();

    const firstHistoryKey = (window.history.state as { __koppajsRouterKey: number })
      .__koppajsRouterKey;

    router.navigate("/services", { scroll: false });
    await flushRouterWork();

    const secondHistoryKey = (window.history.state as { __koppajsRouterKey: number })
      .__koppajsRouterKey;

    window.history.replaceState({ __koppajsRouterKey: firstHistoryKey }, "", "/");
    window.dispatchEvent(
      new PopStateEvent("popstate", {
        state: { __koppajsRouterKey: firstHistoryKey },
      }),
    );
    await flushRouterWork();

    router.navigate("/contact", { replace: true, scroll: false });
    await flushRouterWork();

    const thirdHistoryKey = (window.history.state as { __koppajsRouterKey: number })
      .__koppajsRouterKey;

    expect(Number.isInteger(firstHistoryKey)).toBe(true);
    expect(firstHistoryKey).toBeGreaterThan(0);
    expect(secondHistoryKey).toBe(firstHistoryKey + 1);
    expect(thirdHistoryKey).toBe(secondHistoryKey + 1);
    expect(scrollState.scrollToSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        top: 0,
        behavior: "instant",
      }),
    );
  });

  it("restores scroll restoration and disconnects route-link syncing on destroy", async () => {
    const scrollState = installScrollState();
    let scrollRestoration: History["scrollRestoration"] = "auto";

    Object.defineProperty(window.history, "scrollRestoration", {
      configurable: true,
      get: () => scrollRestoration,
      set: (value: History["scrollRestoration"]) => {
        scrollRestoration = value;
      },
    });

    document.body.innerHTML = `
      <app-shell>
        <main id="outlet"></main>
      </app-shell>
    `;

    const outlet = document.querySelector<HTMLElement>("#outlet");
    expect(outlet).toBeTruthy();

    window.history.replaceState({}, "", "/services");

    const router = new KoppajsRouter({
      routes,
      outlet: outlet!,
      root: document,
    });

    router.init();
    await flushRouterWork();

    expect(window.history.scrollRestoration).toBe("manual");

    const historyKey = getRouterHistoryKey();
    scrollState.setScroll(350, 6);
    router.destroy();

    expect(window.history.scrollRestoration).toBe("auto");
    expect(getRouterHistoryState()).toEqual(
      expect.objectContaining({
        __koppajsRouterKey: historyKey,
        __koppajsRouterScroll: {
          left: 6,
          top: 350,
        },
      }),
    );

    document.querySelector("app-shell")?.insertAdjacentHTML(
      "afterbegin",
      `
        <nav class="top-nav">
          <a data-route="/services" href="/services" class="nav-link">Services</a>
        </nav>
      `,
    );

    await flushRouterWork();

    expect(
      document
        .querySelector<HTMLAnchorElement>('a[data-route="/services"]')
        ?.classList.contains("is-active"),
    ).toBe(false);
  });

  describe("navigation hooks", () => {
    const createHookRouter = (
      options: Partial<ConstructorParameters<typeof KoppajsRouter>[0]> = {},
    ) => {
      document.body.innerHTML = `
        <nav><a data-route="/contact" href="/contact">Contact</a></nav>
        <main id="outlet"></main>
      `;
      const outlet = document.querySelector<HTMLElement>("#outlet")!;
      const router = new KoppajsRouter({ routes, outlet, root: document, ...options });
      return { router, outlet };
    };

    it("runs before hooks in order on final direct and named targets and preserves event order", () => {
      const { router, outlet } = createHookRouter();
      const order: string[] = [];
      const event = vi.fn(() => order.push("event"));
      window.addEventListener(KOPPAJS_ROUTE_CHANGE_EVENT, event);
      router.onBeforeNavigate(({ from, to, reason }) => {
        expect(reason).toBe("navigate");
        order.push(`first:${from?.path}->${to.fullPath}`);
      });
      router.onBeforeNavigate(({ to }) => {
        order.push(`second:${to.path}`);
      });
      router.onAfterNavigate(({ from, to, reason }) => {
        expect(outlet.querySelector(to.componentTag!)).toBeTruthy();
        order.push(`after:${from?.path ?? "null"}->${to.fullPath}:${reason}`);
      });
      router.init();
      expect(order).toEqual(["event", "after:null->/:load"]);
      order.length = 0;
      router.navigate("/guides?ref=nav#section", { scroll: false });
      expect(order).toEqual([
        "first:/->/guides/introduction?ref=nav#section",
        "second:/guides/introduction",
        "event",
        "after:/->/guides/introduction?ref=nav#section:navigate",
      ]);
      order.length = 0;
      router.navigateByName("contact", { replace: true, scroll: false });
      expect(order).toEqual([
        "first:/guides/introduction->/contact",
        "second:/contact",
        "event",
        "after:/guides/introduction->/contact:navigate",
      ]);
      router.destroy();
      window.removeEventListener(KOPPAJS_ROUTE_CHANGE_EVENT, event);
    });

    it("cancels programmatic and intercepted-click navigation before any side effects", () => {
      const root = document.createDocumentFragment();
      const { router, outlet } = createHookRouter({ basePath: "/preview/", root });
      root.append(document.querySelector("a")!, outlet);
      window.history.replaceState({}, "", "/preview/");
      const scroll = installScrollState();
      const event = vi.fn();
      window.addEventListener(KOPPAJS_ROUTE_CHANGE_EVENT, event);
      router.init();
      event.mockClear();
      const oldState = structuredClone(window.history.state as RouterHistoryTestState);
      const oldMarkup = outlet.innerHTML;
      const oldTitle = document.title;
      const oldDescription = document
        .querySelector('meta[name="description"]')
        ?.getAttribute("content");
      const after = vi.fn();
      router.onBeforeNavigate(() => false);
      router.onAfterNavigate(after);
      router.navigateByName("contact");
      const click = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
      root.querySelector("a")?.dispatchEvent(click);
      expect(click.defaultPrevented).toBe(true);
      expect(window.location.pathname).toBe("/preview/");
      expect(window.history.state).toEqual(oldState);
      expect(outlet.innerHTML).toBe(oldMarkup);
      expect(document.title).toBe(oldTitle);
      expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(
        oldDescription,
      );
      expect(router.getCurrentRoute().path).toBe("/");
      expect(event).not.toHaveBeenCalled();
      expect(after).not.toHaveBeenCalled();
      expect(scroll.scrollToSpy).not.toHaveBeenCalled();
      router.destroy();
      window.removeEventListener(KOPPAJS_ROUTE_CHANGE_EVENT, event);
    });

    it("unsubscribes immediately, defers added subscriptions, and clears them on destroy", () => {
      const { router } = createHookRouter();
      router.init();
      const calls: string[] = [];
      let stopSecond = () => {};
      const stopFirst = router.onBeforeNavigate(() => {
        calls.push("first");
        stopSecond();
        router.onBeforeNavigate(() => {
          calls.push("late");
        });
      });
      stopSecond = router.onBeforeNavigate(() => {
        calls.push("second");
      });
      router.navigate("/contact", { scroll: false });
      expect(calls).toEqual(["first"]);
      stopFirst();
      stopFirst();
      router.navigate("/", { scroll: false });
      expect(calls).toEqual(["first", "late"]);
      router.destroy();
      router.init();
      router.navigate("/contact", { scroll: false });
      expect(calls).toEqual(["first", "late"]);
      router.destroy();
    });

    it("propagates before errors without commit and after errors after commit", () => {
      const { router, outlet } = createHookRouter();
      router.init();
      const stopBefore = router.onBeforeNavigate(() => {
        throw new Error("guard failed");
      });
      expect(() => router.navigate("/contact")).toThrow("guard failed");
      expect(window.location.pathname).toBe("/");
      expect(outlet.querySelector("home-page")).toBeTruthy();
      stopBefore();
      const later = vi.fn();
      const event = vi.fn();
      window.addEventListener(KOPPAJS_ROUTE_CHANGE_EVENT, event);
      router.onAfterNavigate(() => {
        throw new Error("observer failed");
      });
      router.onAfterNavigate(later);
      expect(() => router.navigate("/contact", { scroll: false })).toThrow("observer failed");
      expect(window.location.pathname).toBe("/contact");
      expect(outlet.querySelector("contact-page")).toBeTruthy();
      expect(event).toHaveBeenCalledTimes(1);
      expect(later).not.toHaveBeenCalled();
      router.destroy();
      window.removeEventListener(KOPPAJS_ROUTE_CHANGE_EVENT, event);
    });

    it("rejects async returns and nested navigation from hooks", () => {
      const { router } = createHookRouter();
      router.init();
      const stopAsync = router.onBeforeNavigate((() =>
        Promise.resolve(false)) as unknown as () => false);
      expect(() => router.navigate("/contact")).toThrow(/synchronous/);
      expect(window.location.pathname).toBe("/");
      stopAsync();
      router.onBeforeNavigate(() => {
        expect(() => router.navigate("/services")).toThrow(/inside a navigation hook/);
        return false;
      });
      router.navigate("/contact");
      expect(window.location.pathname).toBe("/");
      router.destroy();
    });

    it("skips superseded after hooks when a route-change listener navigates again", () => {
      const { router } = createHookRouter();
      router.init();
      const observed: RouteNavigationContext[] = [];
      router.onAfterNavigate((context) => {
        observed.push(context);
      });
      const redirectInEvent = (event: Event) => {
        if ((event as CustomEvent<RouteChangeDetail>).detail.path === "/contact") {
          router.navigate("/services", { scroll: false });
        }
      };
      window.addEventListener(KOPPAJS_ROUTE_CHANGE_EVENT, redirectInEvent);
      router.navigate("/contact", { scroll: false });
      expect(window.location.pathname).toBe("/services");
      expect(observed).toHaveLength(1);
      expect(observed[0]?.from?.path).toBe("/contact");
      expect(observed[0]?.to.path).toBe("/services");
      router.destroy();
      window.removeEventListener(KOPPAJS_ROUTE_CHANGE_EVENT, redirectInEvent);
    });

    it("rejects async after results after committing and rejects nested navigation", () => {
      const { router, outlet } = createHookRouter();
      router.init();
      const stopNested = router.onAfterNavigate(() => {
        expect(() => router.navigateByName("services")).toThrow(/inside a navigation hook/);
      });
      router.navigate("/services", { scroll: false });
      stopNested();
      router.onAfterNavigate((() => Promise.resolve()) as unknown as () => void);
      expect(() => router.navigate("/contact", { scroll: false })).toThrow(/synchronous/);
      expect(window.location.pathname).toBe("/contact");
      expect(outlet.querySelector("contact-page")).toBeTruthy();
      router.destroy();
    });

    it("keeps frozen route records untouched and validates rendering before hooks and history", () => {
      const frozen = [
        Object.freeze({
          path: "/",
          title: "Home",
          description: "Landing page",
          componentTag: "home-page",
        }),
        Object.freeze({ path: "/incomplete" }),
      ];
      const { router } = createHookRouter({ routes: frozen, document, window });
      const before = vi.fn();
      router.onBeforeNavigate(before);
      router.init();
      const oldState = structuredClone(window.history.state as RouterHistoryTestState);
      expect(() => router.navigate("/incomplete")).toThrow(/cannot render route/);
      expect(before).not.toHaveBeenCalled();
      expect(window.history.state).toEqual(oldState);
      router.navigate("/", { replace: true, scroll: false });
      expect(before).toHaveBeenCalledTimes(1);
      expect(router.getCurrentRoute().record).toBe(frozen[0]);
      expect(frozen[0]).not.toHaveProperty("params");
      router.destroy();
    });

    it("allows duplicate callback registrations to be stopped independently", () => {
      const { router } = createHookRouter();
      router.init();
      const callback = vi.fn();
      const stopOne = router.onAfterNavigate(callback);
      router.onAfterNavigate(callback);
      router.navigate("/contact", { scroll: false });
      expect(callback).toHaveBeenCalledTimes(2);
      stopOne();
      router.navigate("/", { scroll: false });
      expect(callback).toHaveBeenCalledTimes(3);
      router.destroy();
    });

    it("observes load and popstate without a cancellable before phase", async () => {
      installScrollState();
      const { router } = createHookRouter();
      const before = vi.fn();
      const observed: RouteNavigationContext[] = [];
      router.onBeforeNavigate(before);
      router.onAfterNavigate((context) => {
        observed.push(context);
      });
      router.init();
      expect(before).not.toHaveBeenCalled();
      expect(observed[0]?.from).toBeNull();
      expect(observed[0]?.reason).toBe("load");
      router.navigate("/contact", { scroll: false });
      observed.length = 0;
      before.mockClear();
      window.history.back();
      await flushHistoryTraversal();
      expect(before).not.toHaveBeenCalled();
      expect(observed).toHaveLength(1);
      expect(observed[0]?.from?.path).toBe("/contact");
      expect(observed[0]?.to.path).toBe("/");
      expect(observed[0]?.reason).toBe("popstate");
      observed.length = 0;
      window.history.replaceState({ __koppajsRouterKey: 99 }, "", "/contact");
      window.dispatchEvent(
        new PopStateEvent("popstate", {
          state: { __koppajsRouterKey: 99 },
        }),
      );
      expect(before).not.toHaveBeenCalled();
      expect(observed).toHaveLength(1);
      expect(observed[0]?.from?.path).toBe("/");
      expect(observed[0]?.to.path).toBe("/contact");
      expect(observed[0]?.reason).toBe("popstate");
      router.destroy();
    });
  });

  it("throws a clear error when the final resolved route is not renderable", () => {
    document.body.innerHTML = '<main id="outlet"></main>';

    const outlet = document.querySelector<HTMLElement>("#outlet");
    expect(outlet).toBeTruthy();

    const incompleteRoutes = [
      {
        path: "/",
        name: "home",
      },
    ] satisfies readonly RouteDefinition[];

    const router = new KoppajsRouter({
      routes: incompleteRoutes,
      outlet: outlet!,
      root: document,
    });

    expect(() => router.init()).toThrow(
      'KoppajsRouter cannot render route "/" because title, description, and componentTag are required on the final resolved route.',
    );
  });
});
