import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(plain: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(plain, salt, 32).toString("hex")}`;
}

export function checkPassword(plain: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const a = Buffer.from(hash, "hex");
  const b = scryptSync(plain, salt, 32);
  return a.length === b.length && timingSafeEqual(a, b);
}
