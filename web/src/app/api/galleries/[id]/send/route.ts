import { handle, photographerOr401, unauthorized } from "@/lib/api";
import { data } from "@/lib/data";

// No real: também manda o e-mail com o link para o cliente (Resend).
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await photographerOr401();
  if (!p) return unauthorized();
  const { id } = await params;
  return handle(() => data.sendGallery(p.id, id));
}
