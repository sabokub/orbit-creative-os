import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
  },
  resolve: {
    alias: {
      "server-only": path.resolve(__dirname, "lib/__mocks__/server-only-stub.ts"),
    },
  },
});
