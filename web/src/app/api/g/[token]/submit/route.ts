import { clientGallery, fail, handle } from "@/lib/api";
import { data } from "@/lib/data";

// No real: avisa o fotógrafo por e-mail e cria o pedido de extras (PIX).
export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const g = await clientGallery((await params).token);
  if (!g) return fail("not_found");
  return handle(() => data.submitSelection(g.id));
}
