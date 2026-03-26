export type PrimitiveRouteValue = string | number | boolean;

export type RouteParamsInput = Readonly<Record<string, PrimitiveRouteValue>>;

export type RouteParams = Readonly<Record<string, string>>;

export type RouteQueryInputValue =
  | PrimitiveRouteValue
  | null
  | undefined
  | readonly (PrimitiveRouteValue | null | undefined)[];

export type RouteQueryInput = Readonly<Record<string, RouteQueryInputValue>>;

export type RouteQueryValue = string | readonly string[];

export type RouteQuery = Readonly<Record<string, RouteQueryValue>>;

export type NamedRouteTarget = {
  name: string;
  params?: RouteParamsInput;
  query?: RouteQueryInput;
  hash?: string;
};

export type RouteTarget = string | NamedRouteTarget;

export type RouteRedirectTarget = RouteTarget;

export type RouteMeta = Record<string, unknown>;

export type RouteDefinition<TMeta extends RouteMeta = RouteMeta> = {
  path: string;
  title?: string;
  description?: string;
  componentTag?: string;
  name?: string;
  children?: readonly RouteDefinition<TMeta>[];
  redirectTo?: RouteRedirectTarget;
  meta?: TMeta;
};

export type RedirectedRoute<TRoute extends RouteDefinition = RouteDefinition> = Omit<
  TRoute,
  "path" | "children" | "redirectTo"
> & {
  path: string;
  pattern: string;
  fullPath: string;
  params: RouteParams;
  query: RouteQuery;
  hash: string;
  record: TRoute;
};

export type ResolvedRoute<TRoute extends RouteDefinition = RouteDefinition> = Omit<
  TRoute,
  "path" | "children" | "redirectTo"
> & {
  path: string;
  pattern: string;
  fullPath: string;
  params: RouteParams;
  query: RouteQuery;
  hash: string;
  record: TRoute;
  redirectedFrom?: RedirectedRoute<TRoute>;
};

export type ResolvePathOptions = {
  query?: RouteQueryInput;
  hash?: string;
};

export type NavigateOptions = ResolvePathOptions & {
  replace?: boolean;
  scroll?: boolean;
};

export type ResolveNamedRouteOptions = ResolvePathOptions & {
  params?: RouteParamsInput;
};

export type NavigateByNameOptions = ResolveNamedRouteOptions & {
  replace?: boolean;
  scroll?: boolean;
};

export type RouteChangeDetail<TRoute extends RouteDefinition = RouteDefinition> = {
  path: string;
  fullPath: string;
  hash: string;
  query: RouteQuery;
  route: ResolvedRoute<TRoute>;
};

export type ActiveRouteLinkOptions = {
  linkSelector?: string;
  activeClassName?: string;
  activeAttributeName?: string;
  shouldSetActiveState?: (link: HTMLAnchorElement) => boolean;
};

export type RouterRoot = Document | DocumentFragment | HTMLElement;

export type KoppajsRouterOptions<TRoute extends RouteDefinition = RouteDefinition> =
  ActiveRouteLinkOptions & {
    routes: readonly TRoute[];
    outlet: HTMLElement;
    root?: RouterRoot;
    document?: Document;
    window?: Window;
    basePath?: string;
    routeChangeEventName?: string;
    scrollBehavior?: ScrollBehavior;
  };

export type BasePathOptions = {
  basePath?: string;
};

export const DEFAULT_ROUTE_LINK_SELECTOR = "a[data-route]";
export const DEFAULT_ROUTE_CHANGE_EVENT_NAME = "koppajs-route-change";
export const KOPPAJS_ROUTE_CHANGE_EVENT = DEFAULT_ROUTE_CHANGE_EVENT_NAME;

const DEFAULT_ACTIVE_CLASS_NAME = "is-active";
const DEFAULT_ACTIVE_ATTRIBUTE_NAME = "aria-current";
const DEFAULT_SCROLL_BEHAVIOR: ScrollBehavior = "smooth";
const ELEMENT_NODE = 1;
const MATCHER_ORIGIN = "https://koppajs-router.local";
const HISTORY_STATE_KEY = "__koppajsRouterKey";
const MAX_REDIRECT_DEPTH = 20;

type ParsedRouteTarget = {
  path: string;
  query: RouteQuery;
  hash: string;
  fullPath: string;
};

type RouteEntry<TRoute extends RouteDefinition = RouteDefinition> = {
  record: TRoute;
  fullPathTemplate: string;
  matcher: RegExp;
  paramNames: readonly string[];
};

type RankedRouteEntry<TRoute extends RouteDefinition = RouteDefinition> = RouteEntry<TRoute> & {
  specificity: readonly number[];
  insertionOrder: number;
};

type RouteRegistry<TRoute extends RouteDefinition = RouteDefinition> = {
  entries: readonly RouteEntry<TRoute>[];
  names: ReadonlyMap<string, RouteEntry<TRoute>>;
};

type ScrollPosition = {
  left: number;
  top: number;
};

type RenderReason = "load" | "navigate" | "popstate";

const isNamedRouteTarget = (target: RouteTarget): target is NamedRouteTarget =>
  typeof target === "object" && target !== null && "name" in target;

const normalizePrimitiveRouteValue = (value: PrimitiveRouteValue): string => String(value);

export const normalizePath = (path: string): string => {
  if (!path || path === "") {
    return "/";
  }

  const [pathname] = path.split(/[?#]/, 1);
  const cleaned = pathname.replace(/\/+$/, "") || "/";
  return cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
};

export const normalizeHash = (hash: string): string => {
  if (!hash || hash === "#") {
    return "";
  }

  return hash.startsWith("#") ? hash : `#${hash}`;
};

export const normalizeBasePath = (basePath = "/"): string => {
  if (!basePath || basePath === "/") {
    return "/";
  }

  const withLeadingSlash = basePath.startsWith("/") ? basePath : `/${basePath}`;
  const collapsed = withLeadingSlash.replace(/\/+/g, "/");
  return collapsed.endsWith("/") ? collapsed : `${collapsed}/`;
};

const parseQueryString = (searchParams: URLSearchParams): RouteQuery => {
  const query: Record<string, string | string[]> = {};

  searchParams.forEach((value, key) => {
    const existing = query[key];

    if (existing === undefined) {
      query[key] = value;
      return;
    }

    if (Array.isArray(existing)) {
      existing.push(value);
      return;
    }

    query[key] = [existing, value];
  });

  return query;
};

const createMatcherUrl = (target: string): URL => {
  const normalizedTarget =
    !target || target === ""
      ? "/"
      : target.startsWith("/")
        ? target
        : target.startsWith("?") || target.startsWith("#")
          ? `/${target}`
          : `/${target}`;

  return new URL(normalizedTarget, MATCHER_ORIGIN);
};

const stringifyQuery = (query: RouteQuery | RouteQueryInput | undefined): string => {
  if (!query) {
    return "";
  }

  const searchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item === null || item === undefined) {
          return;
        }

        searchParams.append(key, String(item));
      });
      return;
    }

    searchParams.append(key, String(value));
  });

  const serialized = searchParams.toString();
  return serialized === "" ? "" : `?${serialized}`;
};

const buildFullPath = (path: string, query: RouteQuery, hash: string): string =>
  `${normalizePath(path)}${stringifyQuery(query)}${normalizeHash(hash)}`;

const parseRouteTarget = (target: string): ParsedRouteTarget => {
  const url = createMatcherUrl(target);
  const path = normalizePath(decodeURIComponent(url.pathname));
  const query = parseQueryString(url.searchParams);
  const hash = url.hash === "" ? "" : `#${decodeURIComponent(url.hash.slice(1))}`;

  return {
    path,
    query,
    hash,
    fullPath: buildFullPath(path, query, hash),
  };
};

export const toHref = (routeTarget: string, options: BasePathOptions = {}): string => {
  const basePath = normalizeBasePath(options.basePath);
  const parsedTarget = parseRouteTarget(routeTarget);

  if (parsedTarget.path === "/") {
    return `${basePath}${stringifyQuery(parsedTarget.query)}${parsedTarget.hash}`;
  }

  return `${basePath}${parsedTarget.path.slice(1)}${stringifyQuery(parsedTarget.query)}${parsedTarget.hash}`;
};

export const fromLocationPathname = (pathname: string, options: BasePathOptions = {}): string => {
  const normalizedPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const basePath = normalizeBasePath(options.basePath);

  if (basePath === "/") {
    return normalizePath(normalizedPathname);
  }

  const basePathWithoutTrailingSlash = basePath.slice(0, -1);

  if (normalizedPathname === basePathWithoutTrailingSlash) {
    return "/";
  }

  if (normalizedPathname.startsWith(basePath)) {
    const subPath = normalizedPathname.slice(basePath.length - 1);
    return normalizePath(subPath);
  }

  return normalizePath(normalizedPathname);
};

const buildRoutePath = (parentPath: string | null, routePath: string): string => {
  if (parentPath === null) {
    return normalizePath(routePath);
  }

  if (!routePath || routePath === "/") {
    return normalizePath(parentPath);
  }

  if (routePath.startsWith("/")) {
    return normalizePath(routePath);
  }

  const normalizedParentPath = normalizePath(parentPath);
  const normalizedRoutePath = routePath.replace(/^\/+/, "");
  return normalizePath(
    normalizedParentPath === "/"
      ? `/${normalizedRoutePath}`
      : `${normalizedParentPath}/${normalizedRoutePath}`,
  );
};

const getRouteSpecificity = (templatePath: string): readonly number[] => {
  const normalizedTemplatePath = normalizePath(templatePath);

  if (normalizedTemplatePath === "/") {
    return [4];
  }

  return normalizedTemplatePath
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      if (segment === "*") {
        return 1;
      }

      if (segment.startsWith(":")) {
        return 2;
      }

      return 3;
    });
};

const compareRouteSpecificity = (left: readonly number[], right: readonly number[]): number => {
  const maxLength = Math.max(left.length, right.length);

  for (let index = 0; index < maxLength; index += 1) {
    const difference = (right[index] ?? 0) - (left[index] ?? 0);

    if (difference !== 0) {
      return difference;
    }
  }

  return right.length - left.length;
};

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const compileRouteMatcher = (templatePath: string): Pick<RouteEntry, "matcher" | "paramNames"> => {
  if (templatePath === "/") {
    return {
      matcher: /^\/$/,
      paramNames: [],
    };
  }

  const paramNames: string[] = [];
  const matcherSource = normalizePath(templatePath)
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      if (segment === "*") {
        return ".*";
      }

      if (!segment.startsWith(":")) {
        return escapeRegex(segment);
      }

      const paramName = segment.slice(1);
      paramNames.push(paramName);
      return "([^/]+)";
    })
    .join("/");

  return {
    matcher: new RegExp(`^/${matcherSource}$`),
    paramNames,
  };
};

const buildRouteRegistry = <TRoute extends RouteDefinition>(
  routes: readonly TRoute[],
): RouteRegistry<TRoute> => {
  const entries: RankedRouteEntry<TRoute>[] = [];
  const names = new Map<string, RouteEntry<TRoute>>();
  let insertionOrder = 0;

  const visit = (routeList: readonly TRoute[], parentPath: string | null): void => {
    routeList.forEach((route) => {
      const fullPathTemplate = buildRoutePath(parentPath, route.path);
      const compiled = compileRouteMatcher(fullPathTemplate);
      const entry = {
        record: route,
        fullPathTemplate,
        matcher: compiled.matcher,
        paramNames: compiled.paramNames,
        specificity: getRouteSpecificity(fullPathTemplate),
        insertionOrder,
      } satisfies RankedRouteEntry<TRoute>;

      entries.push(entry);
      insertionOrder += 1;

      if (route.name) {
        const existing = names.get(route.name);

        if (existing) {
          throw new Error(`KoppajsRouter received duplicate route name "${route.name}".`);
        }

        names.set(route.name, entry);
      }

      if (route.children && route.children.length > 0) {
        visit(route.children as readonly TRoute[], fullPathTemplate);
      }
    });
  };

  visit(routes, null);

  return {
    entries: entries
      .slice()
      .sort((left, right) => {
        const specificityComparison = compareRouteSpecificity(left.specificity, right.specificity);

        if (specificityComparison !== 0) {
          return specificityComparison;
        }

        return left.insertionOrder - right.insertionOrder;
      })
      .map((entry) => ({
        record: entry.record,
        fullPathTemplate: entry.fullPathTemplate,
        matcher: entry.matcher,
        paramNames: entry.paramNames,
      })),
    names,
  };
};

const normalizeRouteParams = (params: RouteParamsInput | RouteParams | undefined): RouteParams => {
  if (!params) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, normalizePrimitiveRouteValue(value)]),
  );
};

const applyParamsToPathTemplate = (templatePath: string, params: RouteParams): string =>
  normalizePath(
    templatePath.replace(/:([A-Za-z0-9_]+)/g, (_, paramName: string) => {
      const value = params[paramName];

      if (value === undefined) {
        throw new Error(
          `KoppajsRouter cannot resolve path "${templatePath}" because param "${paramName}" is missing.`,
        );
      }

      return encodeURIComponent(value);
    }),
  );

const matchRouteEntry = <TRoute extends RouteDefinition>(
  entry: RouteEntry<TRoute>,
  path: string,
): RouteParams | null => {
  const match = normalizePath(path).match(entry.matcher);

  if (!match) {
    return null;
  }

  return Object.fromEntries(
    entry.paramNames.map((paramName, index) => [
      paramName,
      decodeURIComponent(match[index + 1] ?? ""),
    ]),
  );
};

const omitRouteRecordFields = <TRoute extends RouteDefinition>(record: TRoute) => {
  const routeData = { ...record } as Partial<TRoute>;
  delete routeData.children;
  delete routeData.redirectTo;
  delete routeData.path;
  return routeData as Omit<TRoute, "path" | "children" | "redirectTo">;
};

const createRedirectedRoute = <TRoute extends RouteDefinition>(
  entry: RouteEntry<TRoute>,
  path: string,
  params: RouteParams,
  query: RouteQuery,
  hash: string,
): RedirectedRoute<TRoute> => ({
  ...omitRouteRecordFields(entry.record),
  path,
  pattern: entry.fullPathTemplate,
  fullPath: buildFullPath(path, query, hash),
  params,
  query,
  hash,
  record: entry.record,
});

const createResolvedRoute = <TRoute extends RouteDefinition>(
  entry: RouteEntry<TRoute>,
  path: string,
  params: RouteParams,
  query: RouteQuery,
  hash: string,
  redirectedFrom?: RedirectedRoute<TRoute>,
): ResolvedRoute<TRoute> => ({
  ...omitRouteRecordFields(entry.record),
  path,
  pattern: entry.fullPathTemplate,
  fullPath: buildFullPath(path, query, hash),
  params,
  query,
  hash,
  record: entry.record,
  ...(redirectedFrom ? { redirectedFrom } : {}),
});

const isCatchAllRouteEntry = (entry: RouteEntry): boolean =>
  normalizePath(entry.fullPathTemplate).split("/").filter(Boolean).includes("*");

const resolveMatchedPath = <TRoute extends RouteDefinition>(
  entry: RouteEntry<TRoute>,
  requestedPath: string,
  params: RouteParams,
): string => {
  if (isCatchAllRouteEntry(entry)) {
    return normalizePath(requestedPath);
  }

  return applyParamsToPathTemplate(entry.fullPathTemplate, params);
};

const findMatchingEntry = <TRoute extends RouteDefinition>(
  registry: RouteRegistry<TRoute>,
  path: string,
): { entry: RouteEntry<TRoute>; params: RouteParams } => {
  const normalizedPath = normalizePath(path);

  for (const entry of registry.entries) {
    const params = matchRouteEntry(entry, normalizedPath);

    if (params) {
      return {
        entry,
        params,
      };
    }
  }

  throw new Error(
    `KoppajsRouter could not match path "${normalizedPath}". Add a "*" route to handle unmatched paths.`,
  );
};

const resolveNamedRouteTarget = <TRoute extends RouteDefinition>(
  registry: RouteRegistry<TRoute>,
  target: NamedRouteTarget,
  fallbackQuery: RouteQuery = {},
  fallbackHash = "",
): ParsedRouteTarget => {
  const entry = registry.names.get(target.name);

  if (!entry) {
    throw new Error(`KoppajsRouter could not resolve named route "${target.name}".`);
  }

  const params = normalizeRouteParams(target.params);
  const path = applyParamsToPathTemplate(entry.fullPathTemplate, params);
  const query = target.query
    ? parseQueryString(new URLSearchParams(stringifyQuery(target.query)))
    : fallbackQuery;
  const hash = target.hash !== undefined ? normalizeHash(target.hash) : fallbackHash;

  return {
    path,
    query,
    hash,
    fullPath: buildFullPath(path, query, hash),
  };
};

const resolveRedirectTarget = <TRoute extends RouteDefinition>(
  registry: RouteRegistry<TRoute>,
  target: RouteRedirectTarget,
  matchedParams: RouteParams,
  query: RouteQuery,
  hash: string,
): ParsedRouteTarget => {
  if (isNamedRouteTarget(target)) {
    return resolveNamedRouteTarget(
      registry,
      {
        ...target,
        params: target.params ?? matchedParams,
      },
      query,
      hash,
    );
  }

  const parsedTarget = parseRouteTarget(target);
  const redirectedPath = applyParamsToPathTemplate(parsedTarget.path, matchedParams);
  const redirectedQuery = Object.keys(parsedTarget.query).length > 0 ? parsedTarget.query : query;
  const redirectedHash = parsedTarget.hash !== "" ? parsedTarget.hash : hash;

  return {
    path: redirectedPath,
    query: redirectedQuery,
    hash: redirectedHash,
    fullPath: buildFullPath(redirectedPath, redirectedQuery, redirectedHash),
  };
};

const resolveRouteFromParsedTarget = <TRoute extends RouteDefinition>(
  registry: RouteRegistry<TRoute>,
  target: ParsedRouteTarget,
  redirectedFrom?: RedirectedRoute<TRoute>,
  depth = 0,
): ResolvedRoute<TRoute> => {
  if (depth > MAX_REDIRECT_DEPTH) {
    throw new Error("KoppajsRouter detected a redirect loop while resolving the current route.");
  }

  const { entry, params } = findMatchingEntry(registry, target.path);
  const currentPath = resolveMatchedPath(entry, target.path, params);
  const currentRedirectSource =
    redirectedFrom ?? createRedirectedRoute(entry, currentPath, params, target.query, target.hash);

  if (entry.record.redirectTo) {
    const redirectedTarget = resolveRedirectTarget(
      registry,
      entry.record.redirectTo,
      params,
      target.query,
      target.hash,
    );

    return resolveRouteFromParsedTarget(
      registry,
      redirectedTarget,
      redirectedFrom ?? currentRedirectSource,
      depth + 1,
    );
  }

  return createResolvedRoute(entry, currentPath, params, target.query, target.hash, redirectedFrom);
};

const resolveRouteFromPathInternal = <TRoute extends RouteDefinition>(
  registry: RouteRegistry<TRoute>,
  path: string,
  options: ResolvePathOptions = {},
): ResolvedRoute<TRoute> => {
  const parsedTarget = parseRouteTarget(path);
  const query = options.query
    ? parseQueryString(new URLSearchParams(stringifyQuery(options.query)))
    : parsedTarget.query;
  const hash = options.hash !== undefined ? normalizeHash(options.hash) : parsedTarget.hash;

  return resolveRouteFromParsedTarget(registry, {
    path: parsedTarget.path,
    query,
    hash,
    fullPath: buildFullPath(parsedTarget.path, query, hash),
  });
};

const resolveRouteByNameInternal = <TRoute extends RouteDefinition>(
  registry: RouteRegistry<TRoute>,
  name: string,
  options: ResolveNamedRouteOptions = {},
): ResolvedRoute<TRoute> =>
  resolveRouteFromParsedTarget(
    registry,
    resolveNamedRouteTarget(registry, {
      name,
      params: options.params,
      query: options.query,
      hash: options.hash,
    }),
  );

const resolveRouteTargetInternal = <TRoute extends RouteDefinition>(
  registry: RouteRegistry<TRoute>,
  target: RouteTarget,
  options: ResolvePathOptions = {},
): ResolvedRoute<TRoute> => {
  if (isNamedRouteTarget(target)) {
    return resolveRouteByNameInternal(registry, target.name, {
      params: target.params,
      query: target.query,
      hash: target.hash,
    });
  }

  return resolveRouteFromPathInternal(registry, target, options);
};

export function resolveRoute<TRoute extends RouteDefinition>(
  routes: readonly TRoute[],
  path: string,
  options?: ResolvePathOptions,
): ResolvedRoute<TRoute>;
export function resolveRoute<TRoute extends RouteDefinition>(
  routes: readonly TRoute[],
  target: NamedRouteTarget,
): ResolvedRoute<TRoute>;
export function resolveRoute<TRoute extends RouteDefinition>(
  routes: readonly TRoute[],
  target: RouteTarget,
  options: ResolvePathOptions = {},
): ResolvedRoute<TRoute> {
  const registry = buildRouteRegistry(routes);
  return resolveRouteTargetInternal(registry, target, options);
}

export const resolveRouteByName = <TRoute extends RouteDefinition>(
  routes: readonly TRoute[],
  name: string,
  options: ResolveNamedRouteOptions = {},
): ResolvedRoute<TRoute> => {
  const registry = buildRouteRegistry(routes);
  return resolveRouteByNameInternal(registry, name, options);
};

const ensureMetaTag = (documentRef: Document, name: string): HTMLMetaElement => {
  const existing = documentRef.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);

  if (existing) {
    return existing;
  }

  const element = documentRef.createElement("meta");
  element.setAttribute("name", name);
  documentRef.head.append(element);
  return element;
};

export const setDocumentDescription = (documentRef: Document, content: string): void => {
  ensureMetaTag(documentRef, "description").setAttribute("content", content);
};

const nodeContainsRouteLinks = (node: Node, selector: string): boolean => {
  if (node.nodeType !== ELEMENT_NODE) {
    return false;
  }

  const element = node as Element;
  return element.matches(selector) || element.querySelector(selector) !== null;
};

const isElementNode = (value: EventTarget | null): value is Element => {
  return (
    typeof value === "object" &&
    value !== null &&
    "nodeType" in value &&
    value.nodeType === ELEMENT_NODE
  );
};

const isMouseClickEvent = (event: Event): event is MouseEvent => {
  return (
    "button" in event &&
    "metaKey" in event &&
    "ctrlKey" in event &&
    "shiftKey" in event &&
    "altKey" in event
  );
};

const asElementFromTarget = (target: EventTarget): Element => target as Element;

const extractLinkPath = (target: string): string => parseRouteTarget(target).path;

export const setActiveRouteLinks = (
  root: ParentNode,
  activePath: string,
  options: ActiveRouteLinkOptions = {},
): void => {
  const selector = options.linkSelector ?? DEFAULT_ROUTE_LINK_SELECTOR;
  const activeClassName = options.activeClassName ?? DEFAULT_ACTIVE_CLASS_NAME;
  const activeAttributeName = options.activeAttributeName ?? DEFAULT_ACTIVE_ATTRIBUTE_NAME;
  const normalizedActivePath = normalizePath(activePath);

  root.querySelectorAll<HTMLAnchorElement>(selector).forEach((link) => {
    const shouldSetActiveState = options.shouldSetActiveState?.(link) ?? true;

    if (!shouldSetActiveState) {
      link.classList.remove(activeClassName);
      link.removeAttribute(activeAttributeName);
      return;
    }

    const routeTarget = link.dataset.route ?? link.getAttribute("href") ?? "/";
    const isActive = extractLinkPath(routeTarget) === normalizedActivePath;

    link.classList.toggle(activeClassName, isActive);

    if (isActive) {
      link.setAttribute(activeAttributeName, "page");
    } else {
      link.removeAttribute(activeAttributeName);
    }
  });
};

const waitForNextPaint = (windowRef: Window, callback: () => void): void => {
  if (typeof windowRef.requestAnimationFrame !== "function") {
    windowRef.setTimeout(callback, 0);
    return;
  }

  windowRef.requestAnimationFrame(() => {
    windowRef.requestAnimationFrame(() => {
      callback();
    });
  });
};

const getScrollPosition = (windowRef: Window): ScrollPosition => ({
  left: windowRef.scrollX,
  top: windowRef.scrollY,
});

const getAnchorElement = (documentRef: Document, hash: string): HTMLElement | null => {
  if (hash === "") {
    return null;
  }

  const anchorId = decodeURIComponent(hash.slice(1));

  if (anchorId === "") {
    return null;
  }

  return (
    documentRef.getElementById(anchorId) ??
    (documentRef.getElementsByName(anchorId)[0] as HTMLElement | undefined) ??
    null
  );
};

const isRenderableRoute = (
  route: ResolvedRoute,
): route is ResolvedRoute & {
  componentTag: string;
  title: string;
  description: string;
} =>
  typeof route.componentTag === "string" &&
  route.componentTag.length > 0 &&
  typeof route.title === "string" &&
  typeof route.description === "string";

export class KoppajsRouter<TRoute extends RouteDefinition = RouteDefinition> {
  private currentRoute: ResolvedRoute<TRoute> | null = null;

  private navObserver: MutationObserver | null = null;

  private navSyncScheduled = false;

  private readonly root: RouterRoot;

  private readonly documentRef: Document;

  private readonly windowRef: Window;

  private readonly basePath: string;

  private readonly routeChangeEventName: string;

  private readonly scrollBehavior: ScrollBehavior;

  private readonly activeRouteLinkOptions: ActiveRouteLinkOptions;

  private readonly routeRegistry: RouteRegistry<TRoute>;

  private readonly scrollPositions = new Map<number, ScrollPosition>();

  private currentHistoryKey = 0;

  private nextHistoryKey = 1;

  private previousScrollRestoration: History["scrollRestoration"] | null = null;

  constructor(private readonly options: KoppajsRouterOptions<TRoute>) {
    if (options.routes.length === 0) {
      throw new Error("KoppajsRouter requires at least one route.");
    }

    this.documentRef = options.document ?? document;
    this.windowRef = options.window ?? window;
    this.root = options.root ?? this.documentRef;
    this.basePath = normalizeBasePath(options.basePath);
    this.routeChangeEventName = options.routeChangeEventName ?? DEFAULT_ROUTE_CHANGE_EVENT_NAME;
    this.scrollBehavior = options.scrollBehavior ?? DEFAULT_SCROLL_BEHAVIOR;
    this.activeRouteLinkOptions = {
      linkSelector: options.linkSelector,
      activeClassName: options.activeClassName,
      activeAttributeName: options.activeAttributeName,
      shouldSetActiveState: options.shouldSetActiveState,
    };
    this.routeRegistry = buildRouteRegistry(options.routes);
  }

  init(): void {
    this.observeRouteLinks();
    this.ensureHistoryState();
    this.setManualScrollRestoration();
    this.windowRef.addEventListener("popstate", this.handlePopState);
    this.root.addEventListener("click", this.handleRootClick);
    this.renderCurrentLocation("load", false);
  }

  destroy(): void {
    this.windowRef.removeEventListener("popstate", this.handlePopState);
    this.root.removeEventListener("click", this.handleRootClick);

    if (this.navObserver) {
      this.navObserver.disconnect();
      this.navObserver = null;
    }

    this.restoreScrollRestoration();
  }

  navigate(path: string, options?: NavigateOptions): void;
  navigate(target: NamedRouteTarget, options?: Pick<NavigateOptions, "replace" | "scroll">): void;
  navigate(
    target: RouteTarget,
    options: NavigateOptions | Pick<NavigateOptions, "replace" | "scroll"> = {},
  ): void {
    const resolveOptions: ResolvePathOptions = {
      query: "query" in options ? options.query : undefined,
      hash: "hash" in options ? options.hash : undefined,
    };
    const resolvedRoute = isNamedRouteTarget(target)
      ? this.resolveTarget(target)
      : this.resolveTarget(target, resolveOptions);
    this.navigateToResolvedRoute(resolvedRoute, options);
  }

  navigateByName(name: string, options: NavigateByNameOptions = {}): void {
    const resolvedRoute = this.resolveByName(name, options);
    this.navigateToResolvedRoute(resolvedRoute, options);
  }

  resolve(path: string, options?: ResolvePathOptions): ResolvedRoute<TRoute>;
  resolve(target: NamedRouteTarget): ResolvedRoute<TRoute>;
  resolve(target: RouteTarget, options: ResolvePathOptions = {}): ResolvedRoute<TRoute> {
    return this.resolveTarget(target, options);
  }

  resolveByName(name: string, options: ResolveNamedRouteOptions = {}): ResolvedRoute<TRoute> {
    return resolveRouteByNameInternal(this.routeRegistry, name, options);
  }

  hrefFor(path: string, options?: ResolvePathOptions): string;
  hrefFor(target: NamedRouteTarget): string;
  hrefFor(target: RouteTarget, options: ResolvePathOptions = {}): string {
    const resolvedRoute = this.resolveTarget(target, options);
    return toHref(resolvedRoute.fullPath, { basePath: this.basePath });
  }

  getCurrentPath(): string {
    return this.currentRoute?.path ?? this.getLocationTarget().path;
  }

  getCurrentRoute(): ResolvedRoute<TRoute> {
    return this.currentRoute ?? this.resolve(this.getLocationTarget().fullPath);
  }

  private resolveTarget(
    target: RouteTarget,
    options: ResolvePathOptions = {},
  ): ResolvedRoute<TRoute> {
    return resolveRouteTargetInternal(this.routeRegistry, target, options);
  }

  private readonly handlePopState = (event: PopStateEvent): void => {
    this.saveScrollPosition(this.currentHistoryKey);

    const nextKey = this.getHistoryStateKey(event.state);
    if (nextKey !== null) {
      this.registerHistoryKey(nextKey);
    } else {
      this.ensureHistoryState();
    }

    this.renderCurrentLocation("popstate", true);
  };

  private readonly handleRootClick = (event: Event): void => {
    if (!isElementNode(event.target)) {
      return;
    }

    const selector = this.activeRouteLinkOptions.linkSelector ?? DEFAULT_ROUTE_LINK_SELECTOR;
    const anchor = asElementFromTarget(event.target).closest<HTMLAnchorElement>(selector);

    if (!anchor) {
      return;
    }

    if (!isMouseClickEvent(event)) {
      return;
    }

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    if (anchor.hasAttribute("download")) {
      return;
    }

    const target = anchor.getAttribute("target");

    if (target && target !== "_self") {
      return;
    }

    const routeTarget = anchor.dataset.route ?? anchor.getAttribute("href");

    if (!routeTarget) {
      return;
    }

    event.preventDefault();
    this.navigate(routeTarget);
  };

  private getLocationTarget(): ParsedRouteTarget {
    const path = fromLocationPathname(this.windowRef.location.pathname, {
      basePath: this.basePath,
    });
    const query = parseQueryString(new URLSearchParams(this.windowRef.location.search));
    const hash = normalizeHash(decodeURIComponent(this.windowRef.location.hash));

    return {
      path,
      query,
      hash,
      fullPath: buildFullPath(path, query, hash),
    };
  }

  private renderCurrentLocation(reason: RenderReason, scroll: boolean): void {
    const locationTarget = this.getLocationTarget();
    const resolvedRoute = resolveRouteFromParsedTarget(this.routeRegistry, locationTarget);
    this.renderResolvedRoute(resolvedRoute, reason, scroll);
  }

  private navigateToResolvedRoute(
    resolvedRoute: ResolvedRoute<TRoute>,
    options: Pick<NavigateOptions, "replace" | "scroll">,
  ): void {
    this.saveScrollPosition(this.currentHistoryKey);

    const currentFullPath = this.getLocationTarget().fullPath;
    const targetHref = toHref(resolvedRoute.fullPath, { basePath: this.basePath });
    const currentHref = toHref(currentFullPath, { basePath: this.basePath });
    const shouldReplace = (options.replace ?? false) || currentHref === targetHref;
    const nextKey = this.createHistoryKey();
    const historyState = (this.windowRef.history.state ?? {}) as Record<string, unknown>;
    const nextState = {
      ...historyState,
      [HISTORY_STATE_KEY]: nextKey,
    };

    if (shouldReplace) {
      this.windowRef.history.replaceState(nextState, "", targetHref);
    } else {
      this.windowRef.history.pushState(nextState, "", targetHref);
    }

    this.currentHistoryKey = nextKey;
    this.renderResolvedRoute(resolvedRoute, "navigate", options.scroll ?? true);
  }

  private ensureHistoryState(): void {
    const stateKey = this.getHistoryStateKey(this.windowRef.history.state);

    if (stateKey !== null) {
      this.registerHistoryKey(stateKey);
      return;
    }

    const nextKey = this.createHistoryKey();
    this.windowRef.history.replaceState(
      {
        ...(this.windowRef.history.state ?? {}),
        [HISTORY_STATE_KEY]: nextKey,
      },
      "",
      this.windowRef.location.href,
    );
    this.currentHistoryKey = nextKey;
  }

  private createHistoryKey(): number {
    const nextKey = this.nextHistoryKey;
    this.nextHistoryKey += 1;
    return nextKey;
  }

  private registerHistoryKey(historyKey: number): void {
    this.currentHistoryKey = historyKey;
    this.nextHistoryKey = Math.max(this.nextHistoryKey, historyKey + 1);
  }

  private getHistoryStateKey(state: unknown): number | null {
    if (
      typeof state === "object" &&
      state !== null &&
      HISTORY_STATE_KEY in state &&
      typeof (state as Record<string, unknown>)[HISTORY_STATE_KEY] === "number"
    ) {
      return (state as Record<string, number>)[HISTORY_STATE_KEY];
    }

    return null;
  }

  private saveScrollPosition(historyKey: number): void {
    if (!historyKey) {
      return;
    }

    this.scrollPositions.set(historyKey, getScrollPosition(this.windowRef));
  }

  private setManualScrollRestoration(): void {
    if (!("scrollRestoration" in this.windowRef.history)) {
      return;
    }

    this.previousScrollRestoration = this.windowRef.history.scrollRestoration;
    this.windowRef.history.scrollRestoration = "manual";
  }

  private restoreScrollRestoration(): void {
    if (this.previousScrollRestoration === null) {
      return;
    }

    this.windowRef.history.scrollRestoration = this.previousScrollRestoration;
    this.previousScrollRestoration = null;
  }

  private observeRouteLinks(): void {
    if (this.navObserver) {
      return;
    }

    this.navObserver = new MutationObserver((mutations: MutationRecord[]) => {
      const hasRouteLinkMutation = mutations.some((mutation) => {
        const changedNodes = [
          ...Array.from(mutation.addedNodes),
          ...Array.from(mutation.removedNodes),
        ];
        return changedNodes.some((node) =>
          nodeContainsRouteLinks(
            node,
            this.activeRouteLinkOptions.linkSelector ?? DEFAULT_ROUTE_LINK_SELECTOR,
          ),
        );
      });

      if (!hasRouteLinkMutation) {
        return;
      }

      this.scheduleActiveRouteLinkSync();
    });

    this.navObserver.observe(this.root, { childList: true, subtree: true });
  }

  private scheduleActiveRouteLinkSync(): void {
    if (this.navSyncScheduled) {
      return;
    }

    this.navSyncScheduled = true;
    queueMicrotask(() => {
      this.navSyncScheduled = false;
      setActiveRouteLinks(this.root, this.getCurrentPath(), this.activeRouteLinkOptions);
    });
  }

  private renderResolvedRoute(
    route: ResolvedRoute<TRoute>,
    reason: RenderReason,
    shouldScroll: boolean,
  ): void {
    if (!isRenderableRoute(route)) {
      throw new Error(
        `KoppajsRouter cannot render route "${route.pattern}" because title, description, and componentTag are required on the final resolved route.`,
      );
    }

    this.options.outlet.innerHTML = `<${route.componentTag}></${route.componentTag}>`;
    this.documentRef.title = route.title;
    setDocumentDescription(this.documentRef, route.description);
    this.currentRoute = route;
    setActiveRouteLinks(this.root, route.path, this.activeRouteLinkOptions);
    this.windowRef.dispatchEvent(
      new CustomEvent<RouteChangeDetail<TRoute>>(this.routeChangeEventName, {
        detail: {
          path: route.path,
          fullPath: route.fullPath,
          hash: route.hash,
          query: route.query,
          route,
        },
      }),
    );

    waitForNextPaint(this.windowRef, () => {
      this.applyScroll(route, reason, shouldScroll);
    });
  }

  private applyScroll(
    route: ResolvedRoute<TRoute>,
    reason: RenderReason,
    shouldScroll: boolean,
  ): void {
    if (reason === "popstate") {
      const savedPosition = this.scrollPositions.get(this.currentHistoryKey);

      if (savedPosition) {
        this.windowRef.scrollTo({
          left: savedPosition.left,
          top: savedPosition.top,
          behavior: "auto",
        });
        return;
      }

      if (route.hash !== "") {
        this.scrollToAnchor(route.hash, "auto");
      }

      return;
    }

    if (route.hash !== "") {
      this.scrollToAnchor(route.hash, shouldScroll ? this.scrollBehavior : "auto");
      return;
    }

    if (!shouldScroll || reason === "load") {
      return;
    }

    this.windowRef.scrollTo({
      left: 0,
      top: 0,
      behavior: this.scrollBehavior,
    });
  }

  private scrollToAnchor(hash: string, behavior: ScrollBehavior): void {
    const anchorElement = getAnchorElement(this.documentRef, hash);

    if (anchorElement && typeof anchorElement.scrollIntoView === "function") {
      anchorElement.scrollIntoView({
        behavior,
        block: "start",
      });
      return;
    }

    this.windowRef.scrollTo({
      left: 0,
      top: 0,
      behavior: "auto",
    });
  }
}
