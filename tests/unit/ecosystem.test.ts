import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { Core, type ComponentSource } from "@koppajs/koppajs-core";
import { expect, it, vi } from "vitest";
import { KoppajsRouter, type RouteDefinition } from "../../src/index";

it("mounts Vite-built KPA components through Core across router navigation", async () => {
  const root = mkdtempSync(join(tmpdir(), "koppajs-router-ecosystem-"));
  let router: KoppajsRouter | undefined;
  const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);

  try {
    writeFileSync(join(root, "message.ts"), 'export const message = "Core route ready";');
    writeFileSync(
      join(root, "page.kpa"),
      `[template]<p class="ecosystem-message">{{ label }}</p>[/template]
[ts]
import { message } from './message.ts';
const label: string = message;
[/ts]
[scss]$color: red; .ecosystem-message { color: $color; }[/scss]`,
    );
    // Vite and esbuild need Node's native realm, not jsdom's typed arrays.
    const code = execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `import { build } from 'vite';
import plugin from '@koppajs/koppajs-vite-plugin';
const result = await build({
  root: ${JSON.stringify(root)}, configFile: false, logLevel: 'silent',
  plugins: [plugin()],
  build: { write: false, minify: false,
    lib: { entry: ${JSON.stringify(join(root, "page.kpa"))}, formats: ['iife'], name: 'RoutePage' } }
});
for (const output of Array.isArray(result) ? result : [result]) {
  for (const chunk of output.output) {
    if (chunk.type === 'chunk') process.stdout.write(chunk.code);
  }
}`,
      ],
      { encoding: "utf8", timeout: 15_000 },
    );
    expect(code).toContain("data-k-struct");
    const page = runInNewContext(`${code}; RoutePage;`, {}, { timeout: 1_000 }) as ComponentSource;
    expect(page.style).toContain("color: red");
    Core.take(page, "ecosystem-page");
    Core();

    window.history.replaceState(null, "", "/preview/");
    document.body.innerHTML = `<a data-route="/" href="/preview/">Home</a>
      <a data-route="/next" href="/preview/next">Next</a><main id="outlet"></main>`;
    const outlet = document.querySelector<HTMLElement>("#outlet")!;
    router = new KoppajsRouter<RouteDefinition>({
      outlet,
      basePath: "/preview/",
      routes: [
        { path: "/", componentTag: "ecosystem-page", title: "Home", description: "Home route" },
        { path: "/next", componentTag: "ecosystem-page", title: "Next", description: "Next route" },
      ],
    });
    router.init();
    await vi.waitFor(() => expect(outlet.textContent).toContain("Core route ready"));
    const firstPage = outlet.firstElementChild;
    expect(document.querySelector('[data-route="/"]')?.classList.contains("is-active")).toBe(true);

    document.querySelector<HTMLAnchorElement>('[data-route="/next"]')!.click();
    await vi.waitFor(() => expect(outlet.textContent).toContain("Core route ready"));
    expect(window.location.pathname).toBe("/preview/next");
    expect(document.title).toBe("Next");
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(
      "Next route",
    );
    expect(firstPage?.isConnected).toBe(false);
    expect(outlet.firstElementChild).not.toBe(firstPage);
    expect(document.querySelector('[data-route="/next"]')?.classList.contains("is-active")).toBe(
      true,
    );

    router.navigate("/", { scroll: false });
    await vi.waitFor(() => expect(outlet.textContent).toContain("Core route ready"));
    expect(window.location.pathname).toBe("/preview/");
    expect(document.title).toBe("Home");
  } finally {
    router?.destroy();
    document.body.innerHTML = "";
    window.history.replaceState(null, "", "/");
    scrollTo.mockRestore();
    rmSync(root, { recursive: true, force: true });
  }
}, 20_000);
