import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    globals: true,
  },
  resolve: {
    alias: {
      "server-only": path.resolve(__dirname, "lib/__mocks__/server-only-stub.ts"),
      "@": path.resolve(__dirname, "."),
    },
  },
});
