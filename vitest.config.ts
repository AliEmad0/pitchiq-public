import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.{test,spec}.{ts,tsx}", "src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["tests/e2e/**", "node_modules/**", ".next/**"],
  },
  resolve: {
    alias: {
      // `@/i18n/navigation` (the locale-aware Link/hooks, TASK-1603) builds on
      // next-intl's createNavigation, whose bare `import "next/navigation"`
      // vitest's ESM resolver rejects. Alias to a test stub that delegates to
      // next/link + next/navigation. Must precede the "@" alias so it wins.
      "@/i18n/navigation": path.resolve(__dirname, "tests/stubs/i18n-navigation.ts"),
      "@": path.resolve(__dirname, "src"),
      // Tests run under happy-dom which `server-only` interprets as a client
      // environment, throwing at import. Alias to an empty stub so server
      // modules can be exercised directly. See tests/stubs/server-only.ts.
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
});
