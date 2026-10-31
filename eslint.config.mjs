import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import prettier from "eslint-config-prettier";
import globals from "globals";

const files = ["**/*.ts"];

export default [
  { ignores: ["dist/**", "coverage/**", "node_modules/**", ".local/**"] },
  { ...js.configs.recommended, files },
  ...tsPlugin.configs["flat/recommended-type-checked"].map((config) => ({
    ...config,
    files,
  })),
  {
    files,
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        project: ["./tsconfig.eslint.json"],
        tsconfigRootDir: path.dirname(fileURLToPath(import.meta.url)),
      },
    },
    rules: {
      "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: false }],
      "@typescript-eslint/no-floating-promises": "error",
    },
  },
  { ...prettier, files },
];
