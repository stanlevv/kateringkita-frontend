import { defineConfig } from "@playwright/test";
import { API, JWT_SECRET_UJI, PORT_API, PORT_WEB, URL_DB } from "./e2e/bantu";

const web = `http://localhost:${PORT_WEB}`;
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
        PORT: String(PORT_API), DATABASE_URL: URL_DB, JWT_SECRET: JWT_SECRET_UJI,
        CORS_ORIGIN: web, NODE_ENV: "development", TZ: "Asia/Jakarta",
      },
    },
    {
      name: "Web",
      command: `npx next dev -p ${PORT_WEB}`,
      url: `${web}/login`,
      timeout: 180_000,
      reuseExistingServer: false,
      env: { BACKEND_API_URL: API },
    },
  ],
});
