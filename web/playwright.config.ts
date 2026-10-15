import { defineConfig } from "@playwright/test";

// Roda contra o build de produção (rode `npm run build` antes) num banco descartável.
export const E2E_DB = process.env.E2E_DATABASE_URL ?? "postgres://postgres@localhost:54330/app_e2e";
export const E2E_PORT = 3460;
const BASE = `http://localhost:${E2E_PORT}`;

export default defineConfig({
  testDir: "e2e",
  workers: 1, // um banco só, e os limites de tentativa são por IP
  timeout: 60_000,
  reporter: [["list"]],
  globalSetup: "./e2e/global-setup.ts",
  use: { baseURL: BASE, locale: "pt-BR", timezoneId: "America/Sao_Paulo", trace: "retain-on-failure" },
  webServer: {
    command: `npx next start -p ${E2E_PORT}`,
    url: `${BASE}/entrar`,
    reuseExistingServer: false,
    env: {
      DATABASE_URL: E2E_DB,
      SESSION_SECRET: "e2e-secret",
      CRON_SECRET: "e2e-cron",
      APP_URL: BASE,
      LOCAL_DATA_DIR: ".data-e2e",
    },
  },
});
