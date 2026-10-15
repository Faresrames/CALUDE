// Armazenamento FALSO no disco (web/.data/storage), imitando o Cloudflare R2:
// o navegador recebe URLs assinadas para enviar (PUT) e para ver (GET), com validade.
// /replica-backend troca por URLs assinadas do R2 sem mudar quem chama.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, normalize } from "node:path";
import { DATA_DIR } from "../data/fake";
import { sign, verify } from "../secret";

const ROOT = join(DATA_DIR, "storage");
const MAX_BYTES = 8 * 1024 * 1024; // prévia de 1600px fica bem abaixo disso

function safePath(key: string) {
  const p = normalize(join(ROOT, key));
  if (!p.startsWith(ROOT + "/") || !/^[\w\-/.]+$/.test(key) || key.includes("..")) throw new Error("bad key");
  return p;
}

function signedUrl(method: "GET" | "PUT", key: string, ttlSeconds: number) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const sig = sign(`${method}:${key}:${exp}`);
  return `/api/dev-storage/${key}?exp=${exp}&sig=${sig}`;
}

export const storage = {
  uploadUrl: (key: string) => signedUrl("PUT", key, 15 * 60),
  viewUrl: (key: string) => signedUrl("GET", key, 60 * 60),

  check(method: "GET" | "PUT", key: string, exp: string | null, sig: string | null) {
    const e = Number(exp);
    return Number.isFinite(e) && e > Date.now() / 1000 && verify(`${method}:${key}:${e}`, sig);
  },

  async put(key: string, body: Buffer) {
    if (body.length > MAX_BYTES) throw new Error("too_large");
    const p = safePath(key);
    await mkdir(dirname(p), { recursive: true });
    await writeFile(p, body);
  },

  async get(key: string) {
    return readFile(safePath(key));
  },
};
