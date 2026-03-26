export default {
  "**/*.ts": ["eslint --fix", "prettier --write"],
  "**/*.{js,mjs,cjs,md,json,yml,yaml}": ["prettier --write"],
};
