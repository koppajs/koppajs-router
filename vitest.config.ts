import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["tests/**"],
      thresholds: {
        lines: 70,
        branches: 60,
        functions: 65,
        statements: 70,
      },
    },
  },
});
