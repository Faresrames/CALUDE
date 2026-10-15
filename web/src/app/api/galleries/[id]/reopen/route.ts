import { fail, handle, photographerOr401, unauthorized } from "@/lib/api";
import { data } from "@/lib/data";
import { endOfDayInTZ } from "@/lib/format";

/** Reabre a seleção (enviada ou vencida) com um novo prazo "YYYY-MM-DD" (23:59 Brasília), ou sem prazo. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await photographerOr401();
  if (!p) return unauthorized();
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { deadline?: string | null };
  const deadlineAt = body.deadline ? endOfDayInTZ(body.deadline) : null;
  if (body.deadline && (!deadlineAt || new Date(deadlineAt) < new Date())) return fail("invalid", "Escolha uma data a partir de hoje.");
  return handle(() => data.reopenGallery(p.id, id, deadlineAt));
}
