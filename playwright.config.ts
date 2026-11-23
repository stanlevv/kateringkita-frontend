import { defineConfig } from "@playwright/test";
import { API, API_PORT, DB_URL, TEST_JWT_SECRET, WEB_PORT } from "./e2e/helpers";

const web = `http://localhost:${WEB_PORT}`;
const tsx = "node ../be/node_modules/tsx/dist/cli.mjs";

// Web asli + backend asli + DB lokal sekali-pakai. Env eksplisit mengalahkan .env (dotenv tidak menimpa).
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  reporter: "list",
  use: { baseURL: web, channel: "chrome" },
  webServer: [
    {
      name: "API",
      // DB dikosongkan dulu: webServer start sebelum globalSetup, dan /health butuh DB.
      command: `${tsx} e2e/global-setup.ts && ${tsx} ../be/src/server.ts`,
      url: `${API}/health`,
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        PORT: String(API_PORT),
        DATABASE_URL: DB_URL,
        JWT_SECRET: TEST_JWT_SECRET,
        CORS_ORIGIN: web,
        NODE_ENV: "development",
        TZ: "Asia/Jakarta",
      },
    },
    {
      name: "Web",
      command: `npx next dev -p ${WEB_PORT}`,
      url: `${web}/login`,
      timeout: 180_000,
      reuseExistingServer: false,
      env: { BACKEND_API_URL: API },
    },
  ],
});
