import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Only include vitest-style tests. The upstream .mjs files use Node's
    // built-in `node:test` runner; they're handled by `npm run test:node`.
    include: ["tests/**/*.{test,spec}.{ts,tsx,js}"],
    exclude: ["**/node_modules/**", "tests/**/*.mjs"],
    globals: false,
    reporters: ["default"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["electron/**/*.js", "src/lib/**/*.ts"],
      exclude: ["**/*.test.*", "**/*.spec.*", "**/__tests__/**"]
    }
  }
});
