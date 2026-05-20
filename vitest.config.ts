import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({
  test: { environment: "node", exclude: ["node_modules/**", "e2e/**", "runner/**"] },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
