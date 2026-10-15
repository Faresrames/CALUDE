import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/auth/supabase";
import { env } from "@/lib/env";

/** Volta do link mágico / Google: troca o código pela sessão. */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (env.auth !== "supabase" || !code) return NextResponse.redirect(new URL("/entrar?erro=link", env.appUrl));
  const { error } = await (await supabaseServer()).auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL(error ? "/entrar?erro=link" : "/gerenciador", env.appUrl));
}
