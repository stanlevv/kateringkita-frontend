// Konfigurasi Vitest (test unit dan komponen): lingkungan jsdom, alias "@" ke akar repo, test/setup.ts dijalankan dulu.
// Folder e2e/ dikecualikan karena dijalankan Playwright.
import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

/** Mengubah path relatif terhadap akar repo menjadi path file absolut. */
const fromRoot = (relativePath: string) => fileURLToPath(new URL(relativePath, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fromRoot("./"),
      "server-only": fromRoot("./test/empty.ts"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    globals: true,
    css: false,
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
