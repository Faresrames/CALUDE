import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import postgres from "postgres";
import { E2E_DB } from "../playwright.config";

/** Banco e pasta local zerados a cada rodada. */
export default async function globalSetup() {
  const sql = postgres(E2E_DB, { max: 1, onnotice: () => {} });
  await sql.unsafe("drop schema public cascade; create schema public; drop schema if exists auth cascade;");
  await sql.end();
  execFileSync("node", ["scripts/migrate.mjs"], { env: { ...process.env, DATABASE_URL: E2E_DB }, stdio: "pipe" });
  rmSync(".data-e2e", { recursive: true, force: true });
}
