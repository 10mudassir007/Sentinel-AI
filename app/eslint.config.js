// Flat ESLint config for the Expo app (ESLint 9 + eslint-config-expo).
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", "node_modules/*"],
  },
]);
