import { createHmac, timingSafeEqual } from "node:crypto";

const DEV_SECRET = "dev-only-secret-troque-em-producao";

function secret() {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production" && process.env.DEMO_MODE !== "1") {
    throw new Error("SESSION_SECRET não definido");
  }
  return DEV_SECRET;
}

export function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function verify(value: string, signature: string | undefined | null) {
  if (!signature) return false;
  const a = Buffer.from(sign(value));
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
