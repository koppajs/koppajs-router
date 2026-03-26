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

const installScrollState = () => {
  let scrollLeft = 0;
  let scrollTop = 0;

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
      scrollLeft = Number(scrollOptions.left ?? scrollLeft);
      scrollTop = Number(scrollOptions.top ?? scrollTop);
      return;
    }

    scrollLeft = Number(xOrOptions ?? scrollLeft);
    scrollTop = Number(y ?? scrollTop);
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

  it("handles anchor navigation on load and restores saved scroll on browser history traversal", async () => {
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

    const firstHistoryKey = (window.history.state as { __koppajsRouterKey: number })
      .__koppajsRouterKey;

    scrollState.setScroll(240);
    router.navigate("/services");
    await flushRouterWork();

    const secondHistoryKey = (window.history.state as { __koppajsRouterKey: number })
      .__koppajsRouterKey;

    expect(secondHistoryKey).not.toBe(firstHistoryKey);

    scrollState.setScroll(860);
    window.history.replaceState(
      { __koppajsRouterKey: firstHistoryKey },
      "",
      "/contact#contact-form",
    );
    window.dispatchEvent(
      new PopStateEvent("popstate", {
        state: { __koppajsRouterKey: firstHistoryKey },
      }),
    );

    await flushRouterWork();

    expect(scrollState.getScroll().top).toBe(240);
    expect(scrollState.scrollToSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        top: 240,
        behavior: "auto",
      }),
    );
    expect(router.getCurrentRoute().path).toBe("/contact");
    expect(router.getCurrentRoute().hash).toBe("#contact-form");
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
        behavior: "auto",
      }),
    );
  });

  it("restores scroll restoration and disconnects route-link syncing on destroy", async () => {
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

    router.destroy();

    expect(window.history.scrollRestoration).toBe("auto");

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
