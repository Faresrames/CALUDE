import { NextResponse } from "next/server";
import { sameSecret } from "@/lib/api";
import { applyAsaasEvent, type AsaasEvent } from "@/lib/billing/webhook";

// O Asaas manda o token configurado no painel no cabeçalho asaas-access-token.
// Responder 200 rápido: se não, ele pausa a fila de webhooks.
export async function POST(req: Request) {
  if (!sameSecret(req.headers.get("asaas-access-token"), process.env.ASAAS_WEBHOOK_TOKEN)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const event = (await req.json().catch(() => null)) as AsaasEvent | null;
  if (!event?.event) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const result = await applyAsaasEvent(event);
  return NextResponse.json({ result });
}
