import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, normalize } from "node:path";
import { sign, verify } from "../secret";
import type { Storage } from "./index";

/** Pasta local (só desenvolvimento/testes). LOCAL_DATA_DIR permite isolar os testes. */
export const DATA_DIR = process.env.LOCAL_DATA_DIR ?? join(process.cwd(), ".data");
const ROOT = join(DATA_DIR, "storage");
const MAX_BYTES = 8 * 1024 * 1024;

function safePath(key: string) {
  const p = normalize(join(ROOT, key));
  if (!p.startsWith(ROOT + "/") || !/^[\w\-/.]+$/.test(key) || key.includes("..")) throw new Error("bad key");
  return p;
}

function signedUrl(method: "GET" | "PUT", key: string, ttlSeconds: number) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  return `/api/dev-storage/${key}?exp=${exp}&sig=${sign(`${method}:${key}:${exp}`)}`;
}

export const diskStorage: Storage & {
  check(method: "GET" | "PUT", key: string, exp: string | null, sig: string | null): boolean;
  put(key: string, body: Buffer): Promise<void>;
  get(key: string): Promise<Buffer>;
} = {
  uploadUrl: async (key) => signedUrl("PUT", key, 15 * 60),
  viewUrl: async (key) => signedUrl("GET", key, 60 * 60),
  async delete(keys) {
    await Promise.all(keys.map((k) => rm(safePath(k), { force: true })));
  },
  check(method, key, exp, sig) {
    const e = Number(exp);
    return Number.isFinite(e) && e > Date.now() / 1000 && verify(`${method}:${key}:${e}`, sig);
  },
  async put(key, body) {
    if (body.length > MAX_BYTES) throw new Error("too_large");
    const p = safePath(key);
    await mkdir(dirname(p), { recursive: true });
    await writeFile(p, body);
  },
  get: (key) => readFile(safePath(key)),
};
