import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const distEntryPath = resolve(repoRoot, "dist/index.js");
const distTypesPath = resolve(repoRoot, "dist/index.d.ts");

if (!existsSync(distEntryPath) || !existsSync(distTypesPath)) {
  throw new Error("Missing dist output. Run `pnpm run build` before `pnpm run test:package`.");
}

const tempRoot = mkdtempSync(join(tmpdir(), "koppajs-router-package-smoke-"));
const cacheDir = join(tempRoot, "npm-cache");
const packDir = join(tempRoot, "pack");
const consumerDir = join(tempRoot, "consumer");

mkdirSync(cacheDir, { recursive: true });
mkdirSync(packDir, { recursive: true });
mkdirSync(consumerDir, { recursive: true });

const runCommand = (command, args, cwd) => {
  const result = spawnSync(command, args, {
    cwd,
    env: {
      ...process.env,
      HUSKY: "0",
    },
    encoding: "utf8",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const details = [
      `Command failed: ${command} ${args.join(" ")}`,
      result.stdout.trim() !== "" ? `stdout:\n${result.stdout.trim()}` : "",
      result.stderr.trim() !== "" ? `stderr:\n${result.stderr.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    throw new Error(details);
  }

  return result.stdout;
};

const parsePackOutput = (output) => {
  const jsonMatch = output.match(/(^[\[{][\s\S]*$)/m);

  if (!jsonMatch) {
    throw new Error(`npm pack did not return JSON output.\n\nstdout:\n${output.trim()}`);
  }

  return JSON.parse(jsonMatch[1]);
};

const writeConsumerSmokeFile = () => {
  writeFileSync(
    join(consumerDir, "package.json"),
    `${JSON.stringify(
      {
        name: "package-smoke-consumer",
        private: true,
        type: "module",
      },
      null,
      2,
    )}\n`,
  );

  writeFileSync(
    join(consumerDir, "smoke.mjs"),
    `import {
  DEFAULT_ROUTE_CHANGE_EVENT_NAME,
  KoppajsRouter,
  fromLocationPathname,
  normalizeBasePath,
  resolveRoute,
  toHref,
} from "@koppajs/koppajs-router";

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
    description: "Services page",
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
    path: "*",
    name: "not-found",
    title: "Not found",
    description: "Missing page",
    componentTag: "not-found-page",
  },
];

const resolvedRoute = resolveRoute(routes, {
  name: "service-detail",
  params: {
    slug: "accessibility-audit",
  },
  query: {
    ref: "nav",
  },
  hash: "contact-form",
});

if (resolvedRoute.fullPath !== "/services/accessibility-audit?ref=nav#contact-form") {
  throw new Error(\`Unexpected resolved route: \${resolvedRoute.fullPath}\`);
}

if (toHref("/services?ref=hero#contact-form", { basePath: "/preview/" }) !== "/preview/services?ref=hero#contact-form") {
  throw new Error("toHref() did not preserve the published base-path contract.");
}

if (fromLocationPathname("/preview/services", { basePath: "/preview/" }) !== "/services") {
  throw new Error("fromLocationPathname() did not preserve the published base-path contract.");
}

if (normalizeBasePath("preview") !== "/preview/") {
  throw new Error("normalizeBasePath() did not normalize the published base-path contract.");
}

if (typeof KoppajsRouter !== "function") {
  throw new Error("KoppajsRouter export is missing from the published package.");
}

if (DEFAULT_ROUTE_CHANGE_EVENT_NAME !== "koppajs-route-change") {
  throw new Error("DEFAULT_ROUTE_CHANGE_EVENT_NAME export is not stable.");
}

console.log("Package consumer smoke check passed.");
`,
  );
};

try {
  const packOutput = runCommand(
    npmCommand,
    [
      "pack",
      "--json",
      "--silent",
      "--ignore-scripts",
      "--pack-destination",
      packDir,
      "--cache",
      cacheDir,
    ],
    repoRoot,
  );
  const parsedPackOutput = parsePackOutput(packOutput);

  if (!Array.isArray(parsedPackOutput)) {
    const summary =
      typeof parsedPackOutput?.error?.summary === "string"
        ? parsedPackOutput.error.summary
        : "Unknown npm pack error.";
    throw new Error(`npm pack did not return a tarball list.\n\n${summary}`);
  }

  const [packResult] = parsedPackOutput;

  if (!packResult || typeof packResult.filename !== "string") {
    throw new Error("npm pack did not return a tarball filename.");
  }

  const tarballPath = join(packDir, packResult.filename);

  writeConsumerSmokeFile();

  runCommand(
    npmCommand,
    [
      "install",
      "--silent",
      "--ignore-scripts",
      "--no-package-lock",
      "--no-audit",
      "--no-fund",
      "--cache",
      cacheDir,
      tarballPath,
    ],
    consumerDir,
  );

  const smokeResult = runCommand(process.execPath, ["smoke.mjs"], consumerDir);
  process.stdout.write(smokeResult);
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
