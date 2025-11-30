import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: ["node_modules", "dist"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["server/**/*.ts", "shared/**/*.ts"],
      exclude: [
        "server/vite.ts",
        "server/index.ts",
        "server/index-dev.ts",
        "**/*.d.ts",
      ],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    typecheck: {
      enabled: true,
    },
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "./shared"),
      "@": path.resolve(__dirname, "./client/src"),
    },
  },
});
