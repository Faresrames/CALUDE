import { NextResponse, type NextRequest } from "next/server";
import { fail, photographerOr401, unauthorized } from "@/lib/api";
import { csvRow } from "@/lib/csv";
import { data, DataError } from "@/lib/data";

/** Lista das escolhidas: texto para colar no filtro do Lightroom, ou CSV. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const p = await photographerOr401();
  if (!p) return unauthorized();
  const { id } = await params;
  try {
    const { basenames, favorites } = await data.exportSelection(p.id, id);
    if (req.nextUrl.searchParams.get("format") === "csv") {
      const fav = new Set(favorites);
      const csv = [csvRow(["arquivo", "favorita"]), ...basenames.map((b) => csvRow([b, fav.has(b) ? "sim" : "nao"]))].join("\n");
      return new NextResponse(csv, {
        headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="selecao-${id.slice(0, 8)}.csv"` },
      });
    }
    return new NextResponse(basenames.join(", "), { headers: { "content-type": "text/plain; charset=utf-8" } });
  } catch (e) {
    if (e instanceof DataError) return fail(e.code);
    throw e;
  }
}
