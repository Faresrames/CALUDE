import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { body, fail, rateLimited } from "@/lib/api";
import { unlockBody } from "@/lib/schemas";
import { unlockGallery } from "@/lib/auth";
import { data } from "@/lib/data";
import { checkPassword } from "@/lib/data/password";

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(`unlock:${ip}:${token}`, 5, 60_000)) {
    return NextResponse.json({ error: "rate", message: "Muitas tentativas. Espere um minuto." }, { status: 429 });
  }
  const g = await data.getGalleryByToken(token);
  if (!g || g.status === "draft") return fail("not_found");
  const b = await body(req, unlockBody);
  if (!b) return fail("invalid");
  const { password } = b;
  if (g.passwordHash && !(password && checkPassword(password, g.passwordHash))) {
    return NextResponse.json({ error: "wrong_password", message: "Senha incorreta." }, { status: 401 });
  }
  await unlockGallery(g.id);
  return NextResponse.json({ ok: true });
}
